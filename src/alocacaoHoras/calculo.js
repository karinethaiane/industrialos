// ═══════════════════════════════════════════════════════════════════════════
//  CÁLCULO DA ALOCAÇÃO DE HORAS  (PCP × relatório do sistema)
//  Este arquivo só tem regras e contas. Não tem tela.
//  Se um dia precisar mudar uma regra (ex.: a gerência, a tolerância), é aqui.
// ═══════════════════════════════════════════════════════════════════════════

// ── Constantes ─────────────────────────────────────────────────────────────
export const GERENCIA_ALVO = 'TICs'
export const MES_ABREV = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
export const MES_NOME  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const TAGS_MANUAIS = ['Afastado', 'Férias', 'Licença']

// ── Formatação ─────────────────────────────────────────────────────────────
export const pad2 = n => String(n).padStart(2, '0')
export const fmtH = v => v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
export const fmtDif = v => v == null ? '—' : (v > 0 ? '+' : '') + fmtH(v)
export const ymLabel = ym => { const [y, m] = ym.split('-').map(Number); return `${MES_NOME[m - 1]}/${y}` }
export const nomePlanilhaAlocacao = ym => { const [y, m] = ym.split('-').map(Number); return `Alocação ${MES_ABREV[m - 1]}-${String(y).slice(2)}` }
export const ymToPcp = ym => { const [y, m] = ym.split('-').map(Number); return `${MES_ABREV[m - 1]}/${String(y).slice(2)}` }
export const pcpToYm = lb => { const m = lb.match(/^([A-Z]{3})\/(\d{2})$/); return m ? `${2000 + +m[2]}-${pad2(MES_ABREV.indexOf(m[1]) + 1)}` : null }
export const dmy = s => `${s.slice(8, 10)}/${s.slice(5, 7)}`
export const dmyFull = s => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`
export const titulo = s => s.toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (De|Da|Do|Dos|Das|E) /g, x => x.toLowerCase())
export function colLetra(n) { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) } return s }
export const notaKey = (ym, id) => `${ym}|${id}`

// ═══════════════════════════════════════════════════════════════════════════
//  PCP  →  { labels: {'NOV/26': nº da coluna}, rows: [colaboradores] }
//  `linhas` vem do leitor de Excel: linhas[nº da linha][nº da coluna], começando em 1.
// ═══════════════════════════════════════════════════════════════════════════
export function interpretarPcp(linhas) {
  const lbl = v => String(v ?? '').trim()
  let h = -1
  for (let r = 1; r < Math.min(linhas.length, 30); r++) {
    if (linhas[r] && linhas[r].some(v => lbl(v).toUpperCase() === 'COLABORADOR')) { h = r; break }
  }
  if (h < 0) throw new Error('Não achei a linha de cabeçalho com "COLABORADOR" na planilha PCP.')
  const cab = linhas[h], sub = linhas[h + 1] || []
  const col = nome => { for (let c = 1; c < cab.length; c++) if (lbl(cab[c]).toUpperCase() === nome) return c; return -1 }
  const cMat = col('MATRÍCULA'), cSt = col('STATUS'), cNome = col('COLABORADOR'), cFun = col('FUNÇÃO'), cGer = col('GERÊNCIA')
  if (cNome < 0 || cGer < 0) throw new Error('Não achei as colunas COLABORADOR e GERÊNCIA na planilha PCP.')

  // Localiza a coluna "Planejado" de cada mês pelo cabeçalho (ex.: NOV/26 → coluna X)
  const labels = {}
  for (let c = 1; c < cab.length; c++) {
    const l = lbl(cab[c]).toUpperCase()
    if (/^[A-Z]{3}\/\d{2}$/.test(l) && lbl(sub[c]).toLowerCase() === 'planejado' && !(l in labels)) labels[l] = c
  }
  if (!Object.keys(labels).length) throw new Error('Não achei nenhuma coluna "Planejado" por mês na planilha PCP.')

  const rows = []
  for (let r = h + 2; r < linhas.length; r++) {
    const L = linhas[r]; if (!L) continue
    const nome = lbl(L[cNome]); if (!nome || nome.toUpperCase() === 'TBD') continue
    const status = lbl(L[cSt]).toUpperCase()
    if (status === 'A CONTRATAR' || /ESTAGI/.test(status) || /DESLIG/.test(status) || /INATIVO/.test(status)) continue
    const plan = {}
    for (const [lb, c] of Object.entries(labels)) {
      const n = parseNumero(L[c])
      plan[lb] = n
    }
    rows.push({ linha: r, mat: lbl(L[cMat]), status, nome, funcao: lbl(L[cFun]), gerencia: lbl(L[cGer]), plan })
  }
  return { labels, rows }
}

// ═══════════════════════════════════════════════════════════════════════════
//  RELATÓRIO DO SISTEMA  →  horas agregadas por mês e por pessoa
// ═══════════════════════════════════════════════════════════════════════════
const normTokens = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean)
const chaveNome = s => normTokens(s).join(' ')
function parseNumero(v) {
  if (v == null || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  let s = String(v).trim().replace(/\s+/g, '').replace(/R\$\s*/g, '')
  if (!s || s === '-' || s === '—' || s === '–') return null
  s = s.replace(/[^0-9,.-]/g, '')
  if (!s || s === '-' || s === '.' || s === ',') return null
  if (s.includes(',') && s.includes('.')) {
    const iC = s.lastIndexOf(',')
    const iP = s.lastIndexOf('.')
    s = iC > iP ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function segundaDe(y, m, d) {
  const t = Date.UTC(y, m - 1, d), wd = new Date(t).getUTCDay()
  return new Date(t - ((wd + 6) % 7) * 864e5).toISOString().slice(0, 10)
}

function addLinhaRel(M, o) {
  const k = chaveNome(o.usuario); if (!k) return
  const data = `${o.ano}-${pad2(o.mes)}-${pad2(o.dia)}`
  let u = M.users.get(k)
  if (!u) { u = { nome: o.usuario, email: o.email, cargo: o.cargo, vertical: o.vertical, situacao: o.situacao, detalhe: o.detalhe, ultima: data }; M.users.set(k, u) }
  else if (data >= u.ultima) Object.assign(u, { nome: o.usuario, email: o.email, cargo: o.cargo, vertical: o.vertical, situacao: o.situacao, detalhe: o.detalhe, ultima: data })
  const ym = `${o.ano}-${pad2(o.mes)}`
  if (!M.meses.has(ym)) M.meses.set(ym, new Map())
  const mm = M.meses.get(ym)
  let a = mm.get(k); if (!a) { a = { horas: 0, dias: new Set(), semanas: {}, projetos: {}, tipos: {} }; mm.set(k, a) }
  a.horas += o.horas; a.dias.add(o.dia)
  const sw = segundaDe(o.ano, o.mes, o.dia); a.semanas[sw] = (a.semanas[sw] || 0) + o.horas
  a.projetos[o.projeto] = (a.projetos[o.projeto] || 0) + o.horas
  a.tipos[o.tipo] = (a.tipos[o.tipo] || 0) + o.horas
  M.total++
}

export function interpretarRelatorio(linhas) {
  let h = -1
  for (let r = 1; r < Math.min(linhas.length, 10); r++) {
    if (linhas[r] && linhas[r].some(v => String(v).trim() === 'Usuario')) { h = r; break }
  }
  if (h < 0) throw new Error('Não achei a coluna "Usuario" na 1ª aba do relatório. Confira se é o relatório de alocações.')
  const cab = linhas[h], ix = {}
  cab.forEach((v, c) => { if (v != null) ix[String(v).trim()] = c })
  for (const n of ['Usuario', 'Ano', 'Mes', 'Horas']) if (!(n in ix)) throw new Error(`Não achei a coluna "${n}" no relatório.`)

  const M = { users: new Map(), meses: new Map(), total: 0 }
  const g = (L, n) => (n in ix && L[ix[n]] != null) ? L[ix[n]] : ''
  for (let r = h + 1; r < linhas.length; r++) {
    const L = linhas[r]; if (!L) continue
    const ano = +g(L, 'Ano'), mes = +g(L, 'Mes'); if (!ano || !mes) continue
    let dia = +g(L, 'Dia')
    if (!dia) { const m = String(g(L, 'Data')).match(/-(\d{2})$/); dia = m ? +m[1] : 1 }
    addLinhaRel(M, {
      usuario: String(g(L, 'Usuario')), email: String(g(L, 'Email')), cargo: String(g(L, 'Cargo')),
      vertical: String(g(L, 'Vertical')), situacao: String(g(L, 'Situacao')), detalhe: String(g(L, 'Detalhe Situacao')),
      ano, mes, dia, horas: parseNumero(g(L, 'Horas')) ?? 0,
      projeto: String(g(L, 'Label Tipo') || g(L, 'Projeto') || '—'), tipo: String(g(L, 'Tipo Timesheet') || '—'),
    })
  }
  return M
}

// ═══════════════════════════════════════════════════════════════════════════
//  VÍNCULO PCP × SISTEMA  (pelo nome; aproximado só quando há um único candidato)
// ═══════════════════════════════════════════════════════════════════════════
function dist1(a, b) { // true se os textos diferem em no máximo 1 letra
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, d = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++d > 1) return false
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++ }
  }
  return d + (a.length - i) + (b.length - j) <= 1
}
const tokOk = (a, b) => a === b || (a.length === 1 && b[0] === a) || (b.length === 1 && a[0] === b) || (a.length >= 5 && b.length >= 5 && dist1(a, b))
function similar(ta, tb) {
  const [S, L] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  if (S.length < 2 || !tokOk(S[0], L[0]) || !tokOk(S[S.length - 1], L[L.length - 1])) return false
  let p = 0
  for (const t of S) { let ok = false; while (p < L.length) { if (tokOk(t, L[p++])) { ok = true; break } } if (!ok) return false }
  return true
}
function vincular(pcpRows, users) {
  const out = new Map(), usados = new Set()
  const porChave = new Map(); pcpRows.forEach(p => porChave.set(chaveNome(p.nome), p))
  for (const p of pcpRows) { const k = chaveNome(p.nome); if (users.has(k)) { out.set(p, { key: k, aprox: false }); usados.add(k) } }
  for (const p of pcpRows) {
    if (out.has(p)) continue
    const tp = normTokens(p.nome), cands = []
    for (const [k, u] of users) if (!usados.has(k) && !porChave.has(k) && similar(tp, normTokens(u.nome))) cands.push(k)
    if (cands.length === 1) { out.set(p, { key: cands[0], aprox: true }); usados.add(cands[0]) }
  }
  return out
}

// ═══════════════════════════════════════════════════════════════════════════
//  SEMANAS DO MÊS
// ═══════════════════════════════════════════════════════════════════════════
function semanasUteisDetalhe(ym) {
  const [y, m] = ym.split('-').map(Number)
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const out = []
  for (let d = 1; d <= n; d++) {
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
    if (wd === 0 || wd === 6) continue
    const seg = segundaDe(y, m, d)
    let w = out.find(x => x.key === seg)
    if (!w) {
      w = { key: seg, ini: d, fim: d, dias: [d] }
      out.push(w)
    } else {
      w.fim = d
      w.dias.push(d)
    }
  }
  return out
}

export function semanasDoMes(ym) {
  const [, m] = ym.split('-').map(Number)
  return semanasUteisDetalhe(ym).map((w, i) => ({
    key: w.key,
    label: `S${i + 1}`,
    faixa: w.ini === w.fim ? `${pad2(w.ini)}/${pad2(m)}` : `${pad2(w.ini)}/${pad2(m)}–${pad2(w.fim)}/${pad2(m)}`,
  }))
}

export function semanaCorrenteInfo(ym, dataStr = new Date().toISOString().slice(0, 10)) {
  const semanas = semanasUteisDetalhe(ym)
  if (!semanas.length) return null

  const [y, m] = ym.split('-').map(Number)
  const iniMes = Date.UTC(y, m - 1, 1)
  const diasMes = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const ts = Date.parse(dataStr)
  const dia = Number.isNaN(ts) ? 1 : Math.min(diasMes, Math.max(1, Math.floor((ts - iniMes) / 864e5) + 1))

  let idx = semanas.findIndex(s => dia <= s.fim)
  if (idx < 0) idx = semanas.length - 1
  const s = semanas[idx]
  return {
    index: idx,
    label: `S${idx + 1}`,
    total: semanas.length,
    faixa: s.ini === s.fim ? `${pad2(s.ini)}/${pad2(m)}` : `${pad2(s.ini)}/${pad2(m)}–${pad2(s.fim)}/${pad2(m)}`,
  }
}
function distribuirSemanas(agg, wks) {
  const v = wks.map(() => 0); if (!agg) return v
  for (const [key, h] of Object.entries(agg.semanas)) { let i = wks.findIndex(w => w.key === key); if (i < 0) i = key < wks[0].key ? 0 : wks.length - 1; v[i] += h }
  return v
}

// ═══════════════════════════════════════════════════════════════════════════
//  SITUAÇÕES (textos e cores)
// ═══════════════════════════════════════════════════════════════════════════
export const SEV = { sem: 0, abaixo: 1, acima: 2, ok: 3, semplan: 4, afast: 5, desl: 6 }
export const ST_LABEL = { sem: 'Sem alocação', abaixo: 'Abaixo do planejado', ok: 'Estável', acima: 'Acima do planejado', semplan: 'Sem planejamento', desl: 'Desligado', afast: 'Afastado' }
export const ST_CURTO = { sem: 'Sem alocação', abaixo: 'Abaixo', ok: 'Estável', acima: 'Acima', semplan: 'Sem planejamento', desl: 'Desligado', afast: 'Afastado' }
export const ST_COR = { sem: 'var(--red)', abaixo: 'var(--amber)', ok: 'var(--green)', acima: 'var(--purple)', semplan: 'var(--muted)', desl: 'var(--muted)', afast: 'var(--teal)' }

// ═══════════════════════════════════════════════════════════════════════════
//  COMPARATIVO PLANEJADO × ALOCADO
//  opts: { pcp, rel, ym, incNI, incFora, notas }
// ═══════════════════════════════════════════════════════════════════════════
export function calcular({ pcp, rel, ym, incNI, incFora, notas }) {
  const vazio = { linhas: [], info: { niN: 0, foraN: 0, nColab: 0, coluna: null } }
  if (!pcp || !rel || !ym) return vazio
  const lb = ymToPcp(ym), mesAgg = rel.meses.get(ym) || new Map(), wks = semanasDoMes(ym)
  const vinc = vincular(pcp.rows, rel.users)
  const ctx = { ym, notas: notas || {}, lb }

  const ehNI = p => p.gerencia.toLowerCase().startsWith('não identificada')
  const equipe = pcp.rows.filter(p => p.gerencia === GERENCIA_ALVO || (incNI && ehNI(p)))
  const linhas = []
  for (const p of equipe) {
    const v = vinc.get(p), agg = v ? mesAgg.get(v.key) : null, u = v ? rel.users.get(v.key) : null
    const planejado = p.plan[lb] ?? null, alocado = agg ? +agg.horas.toFixed(2) : 0
    linhas.push(montarLinha({
      id: p.mat || `L${p.linha}`, nome: p.nome, funcao: p.funcao || (u && u.cargo !== '-' ? u.cargo : ''),
      gerencia: p.gerencia === GERENCIA_ALVO ? GERENCIA_ALVO : 'Não identificada', mat: p.mat, pcpStatus: p.status,
      planejado, alocado, agg, u, aprox: !!(v && v.aprox), noRel: !u, wks, fora: false,
    }, ctx))
  }

  // Quem aloca no sistema (vertical TICs) mas não está no PCP
  const vinculados = new Set([...vinc.values()].map(x => x.key))
  let foraN = 0
  for (const [k, agg] of mesAgg) {
    const u = rel.users.get(k)
    if (vinculados.has(k) || !/TIC/i.test(u.vertical) || agg.horas <= 0) continue
    foraN++
    if (incFora) {
      linhas.push(montarLinha({
        id: 'S:' + k, nome: u.nome.toUpperCase(), funcao: u.cargo, gerencia: 'TICs (sistema)', mat: '', pcpStatus: '',
        planejado: null, alocado: +agg.horas.toFixed(2), agg, u, aprox: false, noRel: false, wks, fora: true,
      }, ctx))
    }
  }

  return {
    linhas,
    info: {
      niN: pcp.rows.filter(ehNI).length,
      foraN,
      nColab: mesAgg.size,
      coluna: pcp.labels[lb] || null,
    },
  }
}

function metaAteHoje(ym, planejado, dataStr = new Date().toISOString().slice(0, 10)) {
  if (!planejado) return 0
  const [y, m] = ym.split('-').map(Number)
  const ini = Date.UTC(y, m - 1, 1)
  const diasMes = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const hojeTs = Date.parse(dataStr)
  if (Number.isNaN(hojeTs)) return 0
  const hoje = Math.min(diasMes, Math.max(1, Math.floor((hojeTs - ini) / 864e5) + 1))
  let diasUteis = 0
  let ateHoje = 0
  for (let d = 1; d <= diasMes; d++) {
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
    if (wd === 0 || wd === 6) continue
    diasUteis++
    if (d <= hoje) ateHoje++
  }
  return diasUteis ? planejado * (ateHoje / diasUteis) : 0
}

function faixaEsperadaSemana(ym, planejado, dataStr = new Date().toISOString().slice(0, 10)) {
  if (!planejado) return { min: 0, max: 0, hoje: 0 }
  const semanas = semanasUteisDetalhe(ym)
  if (!semanas.length) return { min: 0, max: 0, hoje: 0 }

  const [y, m] = ym.split('-').map(Number)
  const iniMes = Date.UTC(y, m - 1, 1)
  const diasMes = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const ts = Date.parse(dataStr)
  const dia = Number.isNaN(ts) ? 1 : Math.min(diasMes, Math.max(1, Math.floor((ts - iniMes) / 864e5) + 1))

  const totalUteis = semanas.reduce((a, s) => a + s.dias.length, 0)
  let uteisHoje = 0
  for (const s of semanas) for (const d of s.dias) if (d <= dia) uteisHoje++

  let iSemana = semanas.findIndex(s => dia <= s.fim)
  if (iSemana < 0) iSemana = semanas.length - 1
  const uteisAteSemanaAnterior = semanas.slice(0, iSemana).reduce((a, s) => a + s.dias.length, 0)
  const uteisAteFimSemana = uteisAteSemanaAnterior + semanas[iSemana].dias.length

  const pHoje = totalUteis ? uteisHoje / totalUteis : 0
  const pMin = totalUteis ? uteisAteSemanaAnterior / totalUteis : 0
  const pMax = totalUteis ? uteisAteFimSemana / totalUteis : 0
  return {
    min: planejado * pMin,
    max: planejado * pMax,
    hoje: planejado * pHoje,
  }
}

function metaSemanalMes(ym, planejado) {
  const semanas = semanasDoMes(ym)
  return planejado && semanas.length ? planejado / semanas.length : null
}

function montarLinha(o, { ym, notas, lb }) {
  const nota = notas[notaKey(ym, o.id)] || { tag: '', texto: '' }
  const alertas = []
  const sitInativa = o.u && /inativo/i.test(o.u.situacao)
  if (o.fora) alertas.push(['err', 'Não consta no PCP'])
  if (o.pcpStatus && o.pcpStatus !== 'ATIVO') alertas.push(['mute', `PCP: ${o.pcpStatus.charAt(0) + o.pcpStatus.slice(1).toLowerCase()}`])
  if (sitInativa) {
    const d = o.u.detalhe ? o.u.detalhe : 'Inativo'
    alertas.push([o.pcpStatus === 'ATIVO' ? 'warn' : 'mute', o.pcpStatus === 'ATIVO' ? `Divergência: ativo no PCP, "${d}" no sistema` : `Sistema: ${d}`])
  }
  if (o.noRel) alertas.push(['warn', 'Não localizado no relatório do sistema'])
  if (!o.fora && (o.planejado == null || o.planejado === 0)) alertas.push(['info', `Sem planejamento no PCP (${lb})`])
  if (!o.fora && (o.planejado == null || o.planejado === 0) && o.alocado > 0) alertas.push(['warn', 'Alocou horas sem planejamento'])
  if (o.aprox && o.u) alertas.push(['info', `Nome no sistema: ${o.u.nome}`])
  if (o.gerencia === 'Não identificada') alertas.push(['warn', 'Gerência "não identificada" no PCP'])

  const faixa = o.planejado != null ? faixaEsperadaSemana(ym, o.planejado) : { min: null, max: null, hoje: null }
  const metaHoje = o.planejado != null ? metaAteHoje(ym, o.planejado) : null
  const metaSemanal = o.planejado != null ? metaSemanalMes(ym, o.planejado) : null
  const pct = o.planejado ? (o.alocado / o.planejado) * 100 : null
  const pctMetaHoje = metaHoje ? (o.alocado / metaHoje) * 100 : null

  let status
  if (TAGS_MANUAIS.includes(nota.tag)) status = 'afast'
  else if (o.pcpStatus && o.pcpStatus !== 'ATIVO') status = 'desl'
  else if (!o.planejado) status = 'semplan'
  else if (o.alocado < 0.05) status = 'sem'
  else if (faixa.min != null && o.alocado < faixa.min - 1e-9) status = 'abaixo'
  else if (faixa.max != null && o.alocado <= faixa.max + 1e-9) status = 'ok'
  else if (pct != null && pct > 100 + 1e-9) status = 'acima'
  else status = 'ok'

  return {
    ...o,
    nota,
    alertas,
    status,
    pct,
    pctMetaHoje,
    metaHoje,
    metaSemanal,
    faixaSemana: faixa,
    dif: o.planejado != null ? +(o.alocado - o.planejado).toFixed(2) : null,
    semanasH: distribuirSemanas(o.agg, o.wks),
  }
}

export function ordenar(linhas, { col, dir }) {
  const cmpS = (a, b) => a.localeCompare(b, 'pt-BR')
  const val = { sev: l => SEV[l.status], nome: l => l.nome, funcao: l => l.funcao, plan: l => l.planejado ?? -1, aloc: l => l.alocado, dif: l => l.dif ?? 0, pct: l => l.pct ?? -1, st: l => SEV[l.status] }[col]
  return [...linhas].sort((a, b) => { const x = val(a), y = val(b); const r = typeof x === 'string' ? cmpS(x, y) : x - y; return (r || cmpS(a.nome, b.nome)) * dir })
}

// Meses que existem nas duas planilhas
export function mesesDisponiveis(pcp, rel) {
  if (!pcp || !rel) return []
  return Object.keys(pcp.labels).map(pcpToYm).filter(ym => ym && rel.meses.has(ym)).sort()
}

// ═══════════════════════════════════════════════════════════════════════════
//  EVOLUÇÃO SEMANAL  — "fotos" (posições) do planejado × alocado
// ═══════════════════════════════════════════════════════════════════════════

// Tira a "foto" do mês: só a equipe TICs do PCP (sem "não identificada" e sem "fora do PCP")
export function capturar({ pcp, rel, ym, notas }) {
  const { linhas } = calcular({ pcp, rel, ym, incNI: false, incFora: false, notas })
  const rows = {}
  linhas.forEach(l => { rows[l.id] = { n: l.nome, f: l.funcao, p: l.planejado, a: l.alocado, x: ['semplan', 'desl', 'afast'].includes(l.status) ? 1 : 0 } })
  return rows
}

export function stSnap(r, ym, dataStr) {
  if (r.x || !r.p) return 'x'
  const faixa = faixaEsperadaSemana(ym, r.p, dataStr)
  if (r.a < 0.05) return 'sem'
  if (r.a < faixa.min - 1e-9) return 'abaixo'
  if (r.a <= faixa.max + 1e-9) return 'ok'
  if (r.a > r.p + 1e-9) return 'acima'
  return 'ok'
}
const monit = s => Object.values(s.rows).filter(r => !r.x && r.p)
export const cobertura = s => { const m = monit(s), p = m.reduce((a, r) => a + r.p, 0); return p ? m.reduce((a, r) => a + r.a, 0) / p : 0 }
export function distSnap(s, ym) {
  const d = { sem: 0, abaixo: 0, ok: 0, acima: 0 }
  Object.values(s.rows).forEach(r => { const k = stSnap(r, ym, s.data); if (k !== 'x') d[k]++ })
  return d
}

// Linha tracejada da meta: quanto já deveria estar alocado em cada dia
export function metaPct(dataStr, ym, modo) {
  const [y, m] = ym.split('-').map(Number), ini = Date.UTC(y, m - 1, 1), nd = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const dias = Math.floor((Date.parse(dataStr) - ini) / 864e5) + 1; if (dias <= 0) return 0
  if (modo === 'd7') return Math.min(1, dias / 7)
  let tot = 0, dec = 0
  for (let d = 1; d <= nd; d++) { const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); if (wd && wd < 6) { tot++; if (d <= dias) dec++ } }
  return dec / tot
}

export const TD = {
  zero: ['Sem alocação', 'var(--red)', 0],
  down: ['Ritmo estável', 'var(--amber)', 1],
  stall: ['Ritmo estável', 'var(--amber)', 2],
  up: ['Recuperação de ritmo', 'var(--teal)', 3],
  ok: ['Conforme plano', 'var(--green)', 4],
  na: ['—', 'var(--muted)', 5],
}
function tendencia(serie, plano, ym, dataStr) {
  const a = serie[serie.length - 1] ?? 0, b = serie.length > 1 ? (serie[serie.length - 2] ?? 0) : null
  const atual = stSnap({ a, p: plano, x: 0 }, ym, dataStr)
  if (atual === 'ok' || atual === 'acima') return 'ok'
  if (serie.every(v => !v)) return 'zero'
  if (b === null) return 'na'
  if (a > b + 0.05) return 'up'
  if (a < b - 0.05) return 'stall'
  return 'stall'
}

// Tudo que a tela "Evolução semanal" precisa, calculado a partir das fotos
export function analisarEvolucao(snaps, ym) {
  const n = snaps.length, ult = snaps[n - 1], pen = n > 1 ? snaps[n - 2] : null
  const pes = []
  for (const [id, r] of Object.entries(ult.rows)) {
    if (r.x || !r.p) continue
    const serie = snaps.map(s => s.rows[id] ? s.rows[id].a : null)
    const prev = n > 1 ? (serie[n - 2] ?? 0) : null
    pes.push({
      id,
      nome: r.n,
      funcao: r.f,
      plano: r.p,
      serie,
      delta: prev == null ? null : +(r.a - prev).toFixed(1),
      t: tendencia(serie, r.p, ym, ult.data),
      snapsRows: snaps.map(s => s.rows[id]),
    })
  }
  const c = t => pes.filter(p => p.t === t).length
  return {
    n, ult, pen, pes, c,
    cov: cobertura(ult) * 100,
    covPrev: pen ? cobertura(pen) * 100 : null,
    comecaram: pes.filter(p => n > 1 && !(p.serie[n - 2]) && p.serie[n - 1] > 0).length,
    horasAdd: pes.reduce((a, p) => a + (p.delta || 0), 0),
    dist: distSnap(ult, ym),
  }
}

const sinal = v => v == null ? '' : `${v >= 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')}`
export { sinal }

// Texto pronto para copiar e colar no e-mail/chat
export function montarResumo(ym, A) {
  const { pes, ult, pen, cov, covPrev, comecaram, horasAdd, dist, c } = A
  const nomes = (arr, k = 6) => arr.slice(0, k).map(p => titulo(p.nome)).join(', ') + (arr.length > k ? ` e mais ${arr.length - k}` : '')
  return [
    `Alocação de horas · TICs · ${ymLabel(ym)} (posição de ${dmyFull(ult.data)})`,
    `• Equipe em ${Math.round(cov)}% do planejado${covPrev != null ? ` (${sinal(cov - covPrev)} pp desde ${dmyFull(pen.data)})` : ''}; ${pes.length} colaboradores monitorados.`,
    `• ${dist.ok + dist.acima} conforme plano · ${c('up') + c('stall')} em recuperação/estabilização · ${dist.sem} sem alocação.`,
    ...(pen ? [`• Semana corrente: ${horasAdd >= 0 ? '+' : ''}${fmtH(horasAdd)} h; ${comecaram} colaborador(es) iniciaram alocação.`] : []),
    ...(c('up') ? [`• Recuperação de ritmo (${c('up')}): ${nomes(pes.filter(p => p.t === 'up'))}.`] : []),
    ...(c('stall') ? [`• Ritmo estável (${c('stall')}): ${nomes(pes.filter(p => p.t === 'stall'))}.`] : []),
    ...(c('zero') ? [`• Sem alocação (${c('zero')}): ${nomes(pes.filter(p => p.t === 'zero'))}.`] : []),
  ].join('\n')
}
