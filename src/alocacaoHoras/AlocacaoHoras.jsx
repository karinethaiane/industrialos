import { useState, useMemo, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import './alocacaoHoras.css'
import {
  GERENCIA_ALVO, TAGS_MANUAIS, ST_LABEL, ST_CURTO, ST_COR, TD,
  fmtH, fmtDif, ymLabel, ymToPcp, dmy, dmyFull, colLetra, notaKey, sinal,
  interpretarPcp, interpretarRelatorio, calcular, ordenar, mesesDisponiveis, semanasDoMes,
  capturar, stSnap, cobertura, distSnap, metaPct, analisarEvolucao, montarResumo,
} from './calculo'
import { lerPrimeiraAba, dataDoArquivo } from './leitorXlsx'
import * as arm from './armazenamento'

// true  = só quem é admin da plataforma pode salvar notas e registrar posições
// false = qualquer usuário logado pode
const SOMENTE_ADMIN_EDITA = true

// Guarda as planilhas importadas enquanto a página não for recarregada
// (assim, ao trocar de tela e voltar, não precisa importar de novo)
const MEMORIA = { pcp: null, rel: null, fonte: { pcp: '', rel: '' }, dataRel: null }

const hojeISO = () => new Date().toISOString().slice(0, 10)
const Svg = ({ children, size = 13, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">{children}</svg>
)

// ─────────────────────────────────────────────────────────────────────────────
//  Pedaços pequenos de tela
// ─────────────────────────────────────────────────────────────────────────────
function Cartoes({ itens }) {
  return (
    <div className="stats">
      {itens.map(([cor, valor, rotulo, extra]) => (
        <div className="stat" key={rotulo}>
          <div className="v" style={{ color: cor }}>{valor}{extra ? <small>{extra}</small> : null}</div>
          <div className="l">{rotulo}</div>
          <div className="bar" style={{ background: cor }} />
        </div>
      ))}
    </div>
  )
}

function Importador({ res, onFile }) {
  return (
    <>
      <label className="drop">
        <b>1. Planilha PCP (.xlsx)</b>
        <span>Base de colaboradores e planejamento. A coluna "Planejado" do mês é localizada pelo cabeçalho.</span>
        <input type="file" accept=".xlsx" onChange={e => { const f = e.target.files[0]; if (f) onFile('pcp', f); e.target.value = '' }} />
        {res.pcp && <div className={'res' + (res.pcp.ok === false ? ' err' : '')}>{res.pcp.msg}</div>}
      </label>
      <label className="drop">
        <b>2. Relatório de alocações do sistema (.xlsx)</b>
        <span>Usa a 1ª aba (Alocacoes). Pode conter vários meses e outras áreas.</span>
        <input type="file" accept=".xlsx" onChange={e => { const f = e.target.files[0]; if (f) onFile('rel', f); e.target.value = '' }} />
        {res.rel && <div className={'res' + (res.rel.ok === false ? ' err' : '')}>{res.rel.msg}</div>}
      </label>
    </>
  )
}

function GraficoLinha({ snaps, ym, modo }) {
  const W = 640, H = 250, L = 42, R = 18, T = 14, B = 34
  const [y, m] = ym.split('-').map(Number)
  const ini = Date.UTC(y, m - 1, 1), fim = Date.UTC(y, m, 0)
  const ts = snaps.map(s => Date.parse(s.data))
  const x0 = Math.min(ini, ...ts) - 2 * 864e5, x1 = Math.max(fim, ...ts) + 2 * 864e5
  const covs = snaps.map(s => cobertura(s) * 100)
  const ymax = Math.max(100, Math.ceil(Math.max(...covs) / 25) * 25)
  const X = t => L + (t - x0) / (x1 - x0) * (W - L - R)
  const Y = v => T + (1 - v / ymax) * (H - T - B)
  const grade = []; for (let v = 0; v <= ymax; v += 25) grade.push(v)
  const meta = []
  for (let d = ini; d <= fim; d += 864e5) meta.push(`${X(d).toFixed(1)},${Y(metaPct(new Date(d).toISOString().slice(0, 10), ym, modo) * 100).toFixed(1)}`)
  const pts = snaps.map((s, i) => `${X(ts[i]).toFixed(1)},${Y(covs[i]).toFixed(1)}`)
  const minLabelGap = Math.max(68, (W - L - R) / Math.max(1, Math.min(snaps.length, 4)))
  let lastShownX = -Infinity
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Evolução do status de alocação por data de extração do relatório">
        {grade.map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} style={{ stroke: v === 100 ? 'var(--border2)' : 'var(--border)' }} strokeDasharray={v === 100 ? '2 3' : undefined} />
            <text x={L - 7} y={Y(v) + 3} textAnchor="end">{v}%</text>
          </g>
        ))}
        <rect x={X(ini)} y={T} width={X(fim) - X(ini)} height={H - T - B} style={{ fill: 'var(--teal)' }} opacity=".05" />
        <text x={X(ini) + 4} y={T + 11} style={{ fill: 'var(--teal)' }}>{ymLabel(ym)}</text>
        <polyline points={meta.join(' ')} fill="none" style={{ stroke: 'var(--muted)' }} strokeWidth="1.4" strokeDasharray="5 4" />
        {snaps.length > 1 && <polyline points={pts.join(' ')} fill="none" style={{ stroke: 'var(--teal)' }} strokeWidth="2.4" strokeLinejoin="round" />}
        {snaps.map((s, i) => {
          const x = X(ts[i])
          const mostrarData = i === 0 || i === snaps.length - 1 || x - lastShownX >= minLabelGap
          if (mostrarData) lastShownX = x
          return (
            <g key={s.data}>
              <circle cx={x} cy={Y(covs[i])} r="4.5" style={{ fill: 'var(--surface)', stroke: 'var(--teal)' }} strokeWidth="2.2">
                <title>{dmyFull(s.data)} · {covs[i].toFixed(1)}% do planejado</title>
              </circle>
              <text x={x} y={Y(covs[i]) - 10} textAnchor="middle" style={{ fill: 'var(--text)', fontWeight: 500 }}>{Math.round(covs[i])}%</text>
              {mostrarData && <text x={x} y={H - 14} textAnchor="middle" style={{ fill: 'var(--muted)', fontSize: 10 }}>{dmy(s.data)}</text>}
            </g>
          )
        })}
      </svg>
      <div className="legend">
        <span><i style={{ background: 'var(--teal)' }} />Status de alocação</span>
        <span><i style={{ background: 'var(--muted)' }} />Meta de referência ({modo === 'd7' ? 'até o 7º dia' : 'linear'})</span>
      </div>
    </>
  )
}

function GraficoBarras({ snaps, tol }) {
  const W = 420, H = 250, L = 8, R = 8, T = 22, B = 34
  const n = snaps.length
  const slot = (W - L - R) / Math.max(1, n), bw = Math.min(46, slot * 0.62)
  const dists = snaps.map(s => distSnap(s, tol))
  const tot = Math.max(1, ...dists.map(d => d.sem + d.abaixo + d.ok + d.acima))
  const faixas = [['sem', 'var(--red)'], ['abaixo', 'var(--amber)'], ['ok', 'var(--green)'], ['acima', 'var(--purple)']]
  let lastShownX = -Infinity
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Distribuição por situação">
      {snaps.map((s, i) => {
        const d = dists[i], cx = L + slot * i + slot / 2
        const mostrarData = i === 0 || i === snaps.length - 1 || cx - lastShownX >= 52
        if (mostrarData) lastShownX = cx
        let yb = H - B
        return (
          <g key={s.data}>
            {faixas.map(([k, cor]) => {
              const h = d[k] / tot * (H - T - B)
              if (!h) return null
              const yTopo = yb - h; const yTxt = yb - h / 2 + 3.5
              yb -= h
              return (
                <g key={k}>
                  <rect x={cx - bw / 2} y={yTopo} width={bw} height={h} style={{ fill: cor }} rx="2" opacity=".9"><title>{dmyFull(s.data)} · {k}: {d[k]}</title></rect>
                  {h > 13 && <text x={cx} y={yTxt} textAnchor="middle" style={{ fill: '#fff', fontWeight: 500 }}>{d[k]}</text>}
                </g>
              )
            })}
            {mostrarData && <text x={cx} y={H - 14} textAnchor="middle">{dmy(s.data)}</text>}
          </g>
        )
      })}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  TELA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function AlocacaoHoras({ isAdmin = false }) {
  const podeEditar = SOMENTE_ADMIN_EDITA ? isAdmin : true

  // dados importados
  const [pcp, setPcp] = useState(MEMORIA.pcp)
  const [rel, setRel] = useState(MEMORIA.rel)
  const [fonte, setFonte] = useState(MEMORIA.fonte)
  const [dataRel, setDataRel] = useState(MEMORIA.dataRel)
  const [resImp, setResImp] = useState({ pcp: null, rel: null })
  const [modalImp, setModalImp] = useState(false)

  // posição atual
  const [ym, setYm] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [tol, setTol] = useState(5)
  const [incNI, setIncNI] = useState(false)
  const [incFora, setIncFora] = useState(false)
  const [semanas, setSemanas] = useState(false)
  const [sort, setSort] = useState({ col: 'sev', dir: 1 })
  const [view, setView] = useState('pos')
  const [notas, setNotas] = useState({})
  const [modoLocal, setModoLocal] = useState(false)

  // detalhe + nota
  const [detId, setDetId] = useState(null)
  const [detTag, setDetTag] = useState('')
  const [detTexto, setDetTexto] = useState('')

  // evolução semanal
  const [evYm, setEvYm] = useState(null)
  const [evMeta, setEvMeta] = useState('linear')
  const [evFiltro, setEvFiltro] = useState('todos')
  const [evBusca, setEvBusca] = useState('')
  const [snaps, setSnaps] = useState([])
  const [dataSnap, setDataSnap] = useState('')

  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)
  function toast(msg) {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }

  // ── meses e dados calculados ──────────────────────────────────────────────
  const meses = useMemo(() => mesesDisponiveis(pcp, rel), [pcp, rel])
  const escolherMes = ms => { const h = hojeISO().slice(0, 7); return ms.includes(h) ? h : ms[ms.length - 1] }
  const ymAtivo = ym && meses.includes(ym) ? ym : (meses.length ? escolherMes(meses) : null)
  const evYmAtivo = evYm && meses.includes(evYm) ? evYm : ymAtivo

  const { linhas: todas, info } = useMemo(
    () => calcular({ pcp, rel, ym: ymAtivo, tol, incNI, incFora, notas }),
    [pcp, rel, ymAtivo, tol, incNI, incFora, notas]
  )

  // carrega as notas do mês
  useEffect(() => {
    if (!ymAtivo) return
    let vivo = true
    arm.carregarNotas(ymAtivo).then(n => { if (vivo) { setNotas(n); setModoLocal(arm.estaEmModoLocal()) } })
    return () => { vivo = false }
  }, [ymAtivo])

  // carrega as posições semanais quando abre a aba de evolução
  useEffect(() => {
    if (view !== 'evo' || !evYmAtivo) return
    let vivo = true
    arm.carregarSnaps(evYmAtivo).then(s => { if (vivo) { setSnaps(s); setModoLocal(arm.estaEmModoLocal()) } })
    return () => { vivo = false }
  }, [view, evYmAtivo])

  // Esc fecha as janelas
  useEffect(() => {
    const f = e => { if (e.key === 'Escape') { setDetId(null); setModalImp(false) } }
    document.addEventListener('keydown', f)
    return () => document.removeEventListener('keydown', f)
  }, [])

  async function registrarPosicaoAtual(dataOverride = null) {
    if (!pcp || !rel || !ymAtivo) return
    const data = dataOverride || dataRel || hojeISO()
    const notasDoMes = evYmAtivo === ymAtivo ? notas : await arm.carregarNotas(ymAtivo)
    const rows = capturar({ pcp, rel, ym: ymAtivo, tol, notas: notasDoMes })
    await arm.salvarSnap(ymAtivo, data, rows)
    setSnaps(await arm.carregarSnaps(ymAtivo))
    setDataSnap(data)
    setModoLocal(arm.estaEmModoLocal())
  }

  // ── importação ────────────────────────────────────────────────────────────
  async function importar(tipo, file) {
    setResImp(r => ({ ...r, [tipo]: { ok: null, msg: 'Processando…' } }))
    await new Promise(r => setTimeout(r, 30))   // deixa a mensagem aparecer antes do trabalho pesado
    try {
      const t0 = performance.now()
      const { linhas } = await lerPrimeiraAba(file)
      if (tipo === 'pcp') {
        const p = interpretarPcp(linhas)
        MEMORIA.pcp = p; MEMORIA.fonte = { ...MEMORIA.fonte, pcp: file.name }
        setPcp(p); setFonte(f => ({ ...f, pcp: file.name }))
        const n = p.rows.filter(r => r.gerencia === GERENCIA_ALVO).length
        setResImp(r => ({ ...r, pcp: { ok: true, msg: `✓ ${file.name} · ${p.rows.length} colaboradores (${n} em ${GERENCIA_ALVO}) · ${Object.keys(p.labels).length} meses` } }))
        if (rel && ymAtivo) await registrarPosicaoAtual(dataRel || hojeISO())
      } else {
        const m = interpretarRelatorio(linhas)
        const d = dataDoArquivo(file)
        MEMORIA.rel = m; MEMORIA.fonte = { ...MEMORIA.fonte, rel: file.name }; MEMORIA.dataRel = d
        setRel(m); setFonte(f => ({ ...f, rel: file.name })); setDataRel(d); setDataSnap('')
        setResImp(r => ({ ...r, rel: { ok: true, msg: `✓ ${file.name} · ${m.total.toLocaleString('pt-BR')} lançamentos · ${m.users.size} colaboradores · ${m.meses.size} meses (${((performance.now() - t0) / 1000).toFixed(1)}s)` } }))
        if (pcp && ymAtivo) await registrarPosicaoAtual(d)
      }
    } catch (err) {
      console.error(err)
      setResImp(r => ({ ...r, [tipo]: { ok: false, msg: '✕ ' + err.message } }))
    }
  }

  // ── filtros e tabela ──────────────────────────────────────────────────────
  const cnt = s => todas.filter(l => l.status === s).length
  const mon = todas.filter(l => ['sem', 'abaixo', 'ok', 'acima'].includes(l.status))
  const somaP = mon.reduce((a, l) => a + (l.planejado || 0), 0)
  const somaA = mon.reduce((a, l) => a + l.alocado, 0)

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let vis = todas.filter(l => filtro === 'todos' || (filtro === 'fora' ? ['desl', 'afast'].includes(l.status) : l.status === filtro))
    if (q) vis = vis.filter(l => `${l.nome} ${l.funcao} ${l.mat}`.toLowerCase().includes(q))
    return ordenar(vis, sort)
  }, [todas, filtro, busca, sort])

  const wks = ymAtivo ? semanasDoMes(ymAtivo) : []
  const seta = c => sort.col === c ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''
  const ordenarPor = c => setSort(s => s.col === c ? { col: c, dir: -s.dir } : { col: c, dir: 1 })
  const th = (c, rotulo, cls = '') => <th className={`sortable ${cls}`} onClick={() => ordenarPor(c)}>{rotulo}{seta(c)}</th>

  // ── detalhe + nota ────────────────────────────────────────────────────────
  const linhaDet = detId ? todas.find(l => l.id === detId) : null
  function abrirDetalhe(l) { setDetId(l.id); setDetTag(l.nota.tag || ''); setDetTexto(l.nota.texto || '') }
  async function salvarNota(limpar = false) {
    const tag = limpar ? '' : detTag, texto = limpar ? '' : detTexto.trim()
    await arm.salvarNota(ymAtivo, detId, { tag, texto })
    const k = notaKey(ymAtivo, detId)
    setNotas(n => { const c = { ...n }; if (!tag && !texto) delete c[k]; else c[k] = { tag, texto }; return c })
    setModoLocal(arm.estaEmModoLocal()); setDetId(null); toast('Nota salva.')
  }

  // ── exportar Excel ────────────────────────────────────────────────────────
  function exportar() {
    const cab = ['Gerência', 'Colaborador', 'Função', 'Matrícula', 'Planejado (h)', 'Alocado (h)', 'Diferença (h)', '% Alocado', 'Situação', ...wks.map(w => `${w.label} (${w.faixa})`), 'Alertas automáticos', 'Nota']
    const dados = visiveis.map(l => [
      l.gerencia, l.nome, l.funcao, l.mat, l.planejado, l.alocado, l.dif,
      l.pct == null ? null : +(l.pct / 100).toFixed(4),
      l.status === 'afast' ? (l.nota.tag || 'Afastado') : ST_LABEL[l.status],
      ...l.semanasH.map(h => +h.toFixed(2)),
      l.alertas.map(a => a[1]).join(' | '),
      (l.nota.tag ? `[${l.nota.tag}] ` : '') + l.nota.texto,
    ])
    const ws = XLSX.utils.aoa_to_sheet([cab, ...dados])
    dados.forEach((_, i) => { const c = ws[XLSX.utils.encode_cell({ r: i + 1, c: 7 })]; if (c && typeof c.v === 'number') c.z = '0%' })
    ws['!cols'] = [14, 40, 38, 12, 14, 14, 14, 12, 22, ...wks.map(() => 16), 60, 60].map(wch => ({ wch }))
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: dados.length, c: cab.length - 1 } }) }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Alocação ${ymToPcp(ymAtivo).replace('/', '-')}`)
    XLSX.writeFile(wb, `alocacao-horas-${GERENCIA_ALVO}-${ymAtivo}.xlsx`)
    toast('Relatório exportado.')
  }

  // ── evolução ──────────────────────────────────────────────────────────────
  const dataSugerida = dataSnap || dataRel || hojeISO()
  async function registrarPosicao() {
    if (!dataSugerida) { toast('Informe a data da extração.'); return }
    const notasDoMes = evYmAtivo === ymAtivo ? notas : await arm.carregarNotas(evYmAtivo)
    const rows = capturar({ pcp, rel, ym: evYmAtivo, tol, notas: notasDoMes })
    await arm.salvarSnap(evYmAtivo, dataSugerida, rows)
    setSnaps(await arm.carregarSnaps(evYmAtivo))
    setModoLocal(arm.estaEmModoLocal())
    toast(`Posição de ${dmyFull(dataSugerida)} registrada.`)
  }
  async function removerPosicao(data) {
    if (!confirm(`Remover a posição de ${dmyFull(data)}?`)) return
    await arm.removerSnap(evYmAtivo, data)
    setSnaps(await arm.carregarSnaps(evYmAtivo))
  }

  const A = snaps.length ? analisarEvolucao(snaps, tol) : null
  const resumo = A ? montarResumo(evYmAtivo, A) : ''
  function copiarResumo() {
    const ok = () => toast('Resumo copiado.')
    if (navigator.clipboard) navigator.clipboard.writeText(resumo).then(ok).catch(() => toast('Não foi possível copiar.'))
    else toast('Não foi possível copiar.')
  }
  const evVisiveis = A
    ? A.pes.filter(p => (evFiltro === 'todos' || p.t === evFiltro) && (!evBusca.trim() || p.nome.toLowerCase().includes(evBusca.trim().toLowerCase())))
        .sort((a, b) => TD[a.t][2] - TD[b.t][2] || a.nome.localeCompare(b.nome, 'pt-BR'))
    : []

  // ═════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════════
  const botoesTopo = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 14 }}>
      <button className="btn-ghost" onClick={() => setModalImp(true)}>
        <Svg><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></Svg>
        Importar planilhas
      </button>
      {pcp && rel && (
        <button className="btn" onClick={exportar}>
          <Svg sw={2.4}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Svg>
          Exportar Excel
        </button>
      )}
    </div>
  )

  // Ainda sem planilhas
  if (!pcp || !rel || !ymAtivo) {
    return (
      <div className="aloc">
        <div className="card" style={{ maxWidth: 640 }}>
          <h4 style={{ fontSize: 14, marginBottom: 4 }}>Alocação de Horas · {GERENCIA_ALVO}</h4>
          <div className="hint" style={{ marginBottom: 14 }}>Importe as duas planilhas para ver o comparativo entre planejado e alocado. O processamento é feito no seu navegador; nada é enviado.</div>
          <Importador res={resImp} onFile={importar} />
          {pcp && rel && !ymAtivo && (
            <div className="banner sim">Nenhum mês aparece nas duas planilhas ao mesmo tempo. Confira se o PCP tem a coluna "Planejado" do mês e se o relatório traz esse mês.</div>
          )}
        </div>
      </div>
    )
  }

  const chips = [['todos', 'Todos', todas.length, ''], ['sem', 'Sem alocação', cnt('sem'), 'c-sem'], ['abaixo', 'Abaixo', cnt('abaixo'), 'c-abaixo'], ['ok', 'Dentro', cnt('ok'), 'c-ok'], ['acima', 'Acima', cnt('acima'), 'c-acima'], ['semplan', 'Sem planejamento', cnt('semplan'), ''], ['fora', 'Desligados / afastados', cnt('desl') + cnt('afast'), '']]
  const extra = []
  if (cnt('semplan')) extra.push(`${cnt('semplan')} sem planejamento`)
  if (cnt('desl')) extra.push(`${cnt('desl')} desligados`)
  if (cnt('afast')) extra.push(`${cnt('afast')} afastados/férias`)
  const nColspan = 9 + (semanas ? wks.length : 0)

  return (
    <div className="aloc">
      {botoesTopo}

      {modoLocal && (
        <div className="banner sim">
          <b>Atenção:</b> as tabelas do Supabase ainda não foram criadas, então notas e posições estão sendo guardadas só neste computador. Rode o arquivo <code>alocacao_tabelas.sql</code> no Supabase para guardar para todos.
        </div>
      )}

      <div className="subnav">
        <button className={view === 'pos' ? 'on' : ''} onClick={() => setView('pos')}>Posição atual</button>
        <button className={view === 'evo' ? 'on' : ''} onClick={() => setView('evo')}>Evolução semanal</button>
      </div>

      {/* ═════════════════ POSIÇÃO ATUAL ═════════════════ */}
      {view === 'pos' && (
        <>
          <div className="ctx">
            <label htmlFor="selMes">Mês de referência</label>
            <select className="sel" id="selMes" value={ymAtivo} onChange={e => { setYm(e.target.value); setFiltro('todos') }}>
              {meses.map(m => <option key={m} value={m}>{ymLabel(m)}</option>)}
            </select>
            <label style={{ marginLeft: 6 }}>Gerência</label>
            <select className="sel" disabled title="Fixo: TICs"><option>{GERENCIA_ALVO}</option></select>
            <span className="pill teal">{info.coluna ? <>Planejado lido da coluna <b className="mono">{colLetra(info.coluna)}</b> · {ymToPcp(ymAtivo)}</> : 'Planejado: —'}</span>
            <span className="pill">Relatório: <b>{info.nColab}</b> colaboradores com horas em {ymLabel(ymAtivo)}</span>
            <span className="pill">Fonte: <b>{fonte.pcp === fonte.rel ? fonte.pcp : `PCP: ${fonte.pcp} · Sistema: ${fonte.rel}`}</b></span>
          </div>

          <Cartoes itens={[
            ['var(--blue)', mon.length, 'Colaboradores monitorados', ''],
            ['var(--teal)', fmtH(somaP), 'Planejado (h)', ''],
            ['var(--teal)', fmtH(somaA), 'Alocado (h)', somaP ? `${Math.round(somaA / somaP * 100)}%` : ''],
            ['var(--red)', cnt('sem'), 'Sem alocação', ''],
            ['var(--amber)', cnt('abaixo'), 'Abaixo do planejado', ''],
            ['var(--green)', cnt('ok'), 'Dentro do planejado', ''],
            ['var(--purple)', cnt('acima'), 'Acima do planejado', ''],
          ]} />
          <div className="statnote">Base de monitoria: o esperado cresce com os dias úteis do mês; a comparação usa o acumulado até hoje, não o total do mês em semana 1.</div>
          <div className="statnote">{extra.length ? `Fora dos indicadores: ${extra.join(' · ')}.` : ''}</div>

          <div className="toolbar">
            <input className="search" placeholder="Buscar colaborador, função ou matrícula..." value={busca} onChange={e => setBusca(e.target.value)} />
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {chips.map(([id, l, n, c]) => (
                <button key={id} className={`chip ${c} ${filtro === id ? 'on' : ''}`} onClick={() => setFiltro(id)}>{l} <span className="n">{n}</span></button>
              ))}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>{visiveis.length} de {todas.length} colaboradores</span>
          </div>

          <div className="opts">
            <label>Tolerância de ±
              <select className="sel" style={{ padding: '3px 8px', fontSize: 12 }} value={tol} onChange={e => setTol(+e.target.value)}>
                {[0, 5, 10, 15].map(v => <option key={v} value={v}>{v}%</option>)}
              </select>
            </label>
            <label><input type="checkbox" checked={semanas} onChange={e => setSemanas(e.target.checked)} /> Mostrar horas por semana</label>
            {info.niN > 0 && <label><input type="checkbox" checked={incNI} onChange={e => setIncNI(e.target.checked)} /> Incluir gerência "não identificada" no PCP <span className="info">({info.niN})</span></label>}
            <label><input type="checkbox" checked={incFora} onChange={e => setIncFora(e.target.checked)} /> Incluir quem aloca no sistema (vertical TICs) mas não está no PCP <span className="info">({info.foraN})</span></label>
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Gerência</th>
                  {th('nome', 'Colaborador')}
                  {th('funcao', 'Função')}
                  {th('plan', 'Planejado', 'num')}
                  {th('aloc', 'Alocado', 'num')}
                  {semanas && wks.map(w => <th key={w.key} className="num" title={w.faixa}>{w.label}</th>)}
                  {th('dif', 'Diferença', 'num')}
                  {th('pct', '% Alocado')}
                  {th('st', 'Situação')}
                  <th>Nota</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map(l => {
                  const cor = ST_COR[l.status], pctN = l.pct == null ? null : Math.round(l.pct)
                  const stTxt = l.status === 'afast' ? (l.nota.tag || 'Afastado') : ST_CURTO[l.status]
                  const gerCor = l.gerencia === GERENCIA_ALVO ? 'var(--teal)' : (l.gerencia.startsWith('TICs') ? 'var(--muted)' : 'var(--amber)')
                  const origemBadge = l.fora ? 'Fora do PCP' : (l.gerencia === 'Não identificada' ? 'Não identificada' : null)
                  const gerLabel = l.fora ? 'Sistema sem PCP' : l.gerencia
                  return (
                    <tr key={l.id} style={l.fora ? { background: 'rgba(245, 158, 11, 0.04)' } : undefined}>
                      <td><span className="ger" style={{ color: l.fora ? 'var(--amber)' : gerCor }}>{gerLabel}</span></td>
                      <td className="nome">
                        {origemBadge && (
                          <span className="badge" style={{ display: 'inline-block', marginBottom: 6, background: l.fora ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.12)', color: l.fora ? 'var(--amber)' : 'var(--red)' }}>
                            {origemBadge}
                          </span>
                        )}
                        <div>{l.nome}{l.mat ? <span className="mat">{l.mat}</span> : null}</div>
                      </td>
                      <td className="func">{l.funcao || '—'}</td>
                      <td className="num">{fmtH(l.planejado)}</td>
                      <td className="num" style={{ color: 'var(--text)', fontWeight: 500 }}>{fmtH(l.alocado)}</td>
                      {semanas && l.semanasH.map((h, i) => <td key={i} className="num wk">{h ? fmtH(h) : <span className="dim">·</span>}</td>)}
                      <td className="num" style={{ color: l.dif == null ? 'var(--muted)' : l.dif < 0 ? 'var(--red)' : l.dif > 0 ? 'var(--purple)' : 'var(--green)' }}>{fmtDif(l.dif)}</td>
                      <td>
                        {pctN == null ? <span className="dim">—</span> : (
                          <div className="pct">
                            <div className="track"><div className="fill" style={{ width: `${Math.min(100, pctN)}%`, background: cor }} /></div>
                            <span className="val" style={{ color: cor }}>{pctN}%</span>
                          </div>
                        )}
                      </td>
                      <td><span className="badge" style={{ background: `color-mix(in srgb, ${cor} 14%, transparent)`, color: cor }}>● {stTxt}</span></td>
                      <td className="notacell" onClick={() => abrirDetalhe(l)}>
                        {l.alertas.slice(0, 2).map(([t, x], i) => <span key={i} className={`alert a-${t}`}>{x}</span>)}
                        {l.alertas.length > 2 && <span className="alert a-mute">+{l.alertas.length - 2}</span>}
                        {l.nota.texto ? <div className="nota">{l.nota.texto}</div> : (!l.alertas.length && podeEditar ? <span className="add">+ nota</span> : null)}
                      </td>
                      <td><button className="btn-det" onClick={() => abrirDetalhe(l)}>Detalhes</button></td>
                    </tr>
                  )
                })}
                {!visiveis.length && <tr><td colSpan={nColspan} className="empty">Nenhum colaborador para os filtros atuais.</td></tr>}
              </tbody>
            </table>
          </div>

          <details className="regras">
            <summary>Regras do cruzamento (PCP × relatório do sistema)</summary>
            <ol>
              <li><b>Equipe:</b> colaboradores da planilha PCP com <code>GERÊNCIA = TICs</code> (linhas "A CONTRATAR/TBD" são ignoradas).</li>
              <li><b>Planejado:</b> no PCP, a coluna <code>Planejado</code> do bloco do mês escolhido é localizada pelo cabeçalho (ex.: <code>NOV/26</code> → coluna <code>X</code>). Muda sozinha ao trocar o mês.</li>
              <li><b>Alocado:</b> 1ª aba do relatório do sistema (<code>Alocacoes</code>), somando <code>Horas</code> das linhas cujo <code>Ano/Mês</code> = mês de referência. Colaboradores de outras áreas são ignorados.</li>
              <li><b>Vínculo entre as planilhas:</b> pelo nome (sem acento/caixa). Se o nome estiver abreviado ou com pequena divergência de grafia no sistema, vincula por aproximação (somente quando houver um único candidato) e registra um alerta.</li>
              <li><b>Esperado até a data:</b> a comparação não usa o total do mês como critério imediato. O esperado do período é <code>planejado × dias úteis até hoje ÷ dias úteis do mês</code>. Ou seja, o indicador cresce com o passar dos dias úteis; nos primeiros 3 dias úteis, ninguém é cobrado e aparece como <i>No prazo</i>.</li>
              <li><b>Situação:</b> <i>Sem alocação</i> (0 h com planejamento) · <i>Abaixo</i> (&lt; esperado × (1 − tolerância)) · <i>Dentro</i> · <i>Acima</i> (&gt; planejado do mês + tolerância) · <i>Sem planejamento</i> (PCP vazio/0 no mês).</li>
              <li><b>Fora dos indicadores:</b> desligados (status do PCP) e afastados/férias/licença (marcados manualmente na nota) — continuam listados, mas não entram nos totais.</li>
              <li><b>Alertas automáticos:</b> desligado, divergência PCP × sistema, não localizado no relatório, sem planejamento, alocação sem planejamento, nome por aproximação.</li>
            </ol>
          </details>
        </>
      )}

      {/* ═════════════════ EVOLUÇÃO SEMANAL ═════════════════ */}
      {view === 'evo' && (
        <>
          <div className="ctx">
            <label htmlFor="evoMes">Mês</label>
            <select className="sel" id="evoMes" value={evYmAtivo} onChange={e => { setEvYm(e.target.value); setEvFiltro('todos'); setSnaps([]) }}>
              {meses.map(m => <option key={m} value={m}>{ymLabel(m)}</option>)}
            </select>
            <label htmlFor="evoMeta" style={{ marginLeft: 6 }}>Meta de referência</label>
            <select className="sel" id="evoMeta" value={evMeta} onChange={e => setEvMeta(e.target.value)}>
              <option value="linear">Linear pelos dias úteis</option>
              <option value="d7">Tudo alocado até o 7º dia</option>
            </select>
            <span className="pill teal"><b>{snaps.length}</b> {snaps.length === 1 ? 'posição registrada' : 'posições registradas'}</span>
          </div>

          {snaps.length < 2 && (
            <div className="banner info">
              {snaps.length === 0
                ? <>Ainda não há posição registrada de {ymLabel(evYmAtivo)}. Importe o relatório e clique em <b>&nbsp;Registrar posição</b>.</>
                : <>Só há 1 posição registrada de {ymLabel(evYmAtivo)}. A evolução aparece a partir da 2ª extração: na próxima semana, importe o relatório novo e clique em <b>&nbsp;Registrar posição</b>.</>}
            </div>
          )}

          <div className="snapbar">
            <span className="lbl">Posições</span>
            {snaps.map(s => (
              <span className="snap" key={s.data}>{dmyFull(s.data)} {podeEditar && <button title="Remover esta posição" onClick={() => removerPosicao(s.data)}>×</button>}</span>
            ))}
            {!snaps.length && <span style={{ fontSize: 12, color: 'var(--muted)' }}>nenhuma ainda</span>}
            {podeEditar && (
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="lbl">Extração de</span>
                <input type="date" className="sel" value={dataSugerida} onChange={e => setDataSnap(e.target.value)} />
                <button className="btn" onClick={registrarPosicao}>Registrar posição</button>
              </span>
            )}
          </div>

          {A && (
            <>
              <Cartoes itens={[
                ['var(--teal)', `${Math.round(A.cov)}%`, 'Cobertura atual', A.covPrev == null ? '' : `${sinal(A.cov - A.covPrev)} pp`],
                ['var(--blue)', A.n > 1 ? `${A.horasAdd >= 0 ? '+' : ''}${fmtH(A.horasAdd)}` : '—', 'Horas na última semana', ''],
                ['var(--teal)', A.n > 1 ? A.comecaram : '—', 'Começaram a alocar', ''],
                ['var(--amber)', A.c('up') + A.c('stall'), 'Evoluindo', ''],
                ['var(--red)', A.c('zero') + A.c('down'), 'Sem alocação', ''],
                ['var(--green)', A.c('ok'), 'Em dia', A.pes.length ? `${Math.round(A.c('ok') / A.pes.length * 100)}%` : ''],
              ]} />
              <div className="statnote">{A.pen ? `Comparando a posição de ${dmyFull(A.ult.data)} com a de ${dmyFull(A.pen.data)}.` : `Posição de ${dmyFull(A.ult.data)}.`}</div>

              <div className="evo-grid">
                <div className="card">
                  <h4>Status de alocação por data do relatório</h4>
                  <div className="hint">Cada ponto representa uma extração do relatório e o nível de alocação é avaliado conforme a data da coleta. A linha tracejada mostra a meta esperada para esse mesmo ponto de referência.</div>
                  <GraficoLinha snaps={snaps} ym={evYmAtivo} modo={evMeta} />
                </div>
                <div className="card">
                  <h4>Colaboradores por situação</h4>
                  <div className="hint">Só quem está sendo monitorado em cada extração.</div>
                  <GraficoBarras snaps={snaps} tol={tol} />
                  <div className="legend">
                    <span><i style={{ background: 'var(--red)' }} />Sem alocação</span>
                    <span><i style={{ background: 'var(--amber)' }} />Evoluindo</span>
                    <span><i style={{ background: 'var(--green)' }} />Em dia</span>
                    <span><i style={{ background: 'var(--purple)' }} />Acima</span>
                  </div>
                </div>
              </div>

              <div className="card resumo" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <h4>Resumo para o report semanal</h4>
                    <div className="hint" style={{ marginBottom: 0 }}>Texto gerado a partir da última extração; copie e cole no e-mail ou no chat.</div>
                  </div>
                  <button className="btn-sm" onClick={copiarResumo}>Copiar</button>
                </div>
                <pre>{resumo}</pre>
              </div>

              <div className="toolbar">
                <input className="search" placeholder="Buscar colaborador..." value={evBusca} onChange={e => setEvBusca(e.target.value)} />
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['todos', 'Todos', A.pes.length, ''], ['zero', 'Sem alocação', A.c('zero'), 'c-sem'], ['down', 'Sem alocação', A.c('down'), 'c-sem'], ['stall', 'Evoluindo', A.c('stall'), 'c-abaixo'], ['up', 'Evoluindo', A.c('up'), 'c-ok'], ['ok', 'Em dia', A.c('ok'), 'c-ok']].map(([id, l, k, cl]) => (
                    <button key={id} className={`chip ${cl} ${evFiltro === id ? 'on' : ''}`} onClick={() => setEvFiltro(id)}>{l} <span className="n">{k}</span></button>
                  ))}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>{evVisiveis.length} de {A.pes.length} colaboradores</span>
              </div>

              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Colaborador</th><th>Função</th><th className="num">Planejado</th>
                      {snaps.map(s => <th key={s.data} className="num" title={dmyFull(s.data)}>{dmy(s.data)}</th>)}
                      <th className="num">Δ semana</th><th>Tendência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evVisiveis.map(p => {
                      const [lb, cor] = TD[p.t]
                      const corSt = { sem: 'var(--red)', abaixo: 'var(--amber)', ok: 'var(--green)', acima: 'var(--purple)', x: 'var(--muted)' }
                      return (
                        <tr key={p.id}>
                          <td className="nome">{p.nome}</td>
                          <td className="func">{p.funcao || '—'}</td>
                          <td className="num">{fmtH(p.plano)}</td>
                          {p.snapsRows.map((r, i) => {
                            if (!r) return <td key={i} className="num"><span className="dim">—</span></td>
                            const cc = corSt[stSnap(r, tol)]
                            return (
                              <td key={i} className="num">
                                <span className="hc" style={{ background: `color-mix(in srgb, ${cc} 13%, transparent)`, color: cc }} title={r.p ? `${Math.round(r.a / r.p * 100)}% de ${fmtH(r.p)} h` : ''}>{fmtH(r.a)}</span>
                              </td>
                            )
                          })}
                          <td className="num dlt" style={{ color: p.delta == null ? 'var(--muted)' : p.delta > 0 ? 'var(--green)' : p.delta < 0 ? 'var(--red)' : 'var(--muted)' }}>{p.delta == null ? '—' : (p.delta > 0 ? '+' : '') + fmtH(p.delta)}</td>
                          <td><span className="badge" style={{ background: `color-mix(in srgb, ${cor} 14%, transparent)`, color: cor }}>{p.t === 'up' ? '↑ ' : p.t === 'down' ? '↓ ' : p.t === 'stall' ? '■ ' : '● '}{lb}</span></td>
                        </tr>
                      )
                    })}
                    {!evVisiveis.length && <tr><td colSpan={6 + A.n} className="empty">Nenhum colaborador para os filtros atuais.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <details className="regras">
            <summary>Como a evolução é calculada</summary>
            <ol>
              <li>O sistema não guarda histórico. Por isso, <b>a cada semana</b> você importa o relatório novo e clica em <i>Registrar posição</i>: isso grava uma "foto" (planejado e alocado de cada pessoa) com a data da extração.</li>
              <li>A data da extração é lida do nome do arquivo (ex.: <code>relatorio-alocacoes-1793875403193</code> = 05/11/2026) e pode ser corrigida no campo de data.</li>
              <li>O planejado também é gravado em cada foto, porque o PCP pode mudar durante o mês.</li>
              <li><b>Tendência</b> compara a última foto com a anterior: <i>Em dia</i> · <i>Evoluindo</i> (+horas) · <i>Parado</i> (abaixo e sem mudança) · <i>Regrediu</i> (horas diminuíram) · <i>Sem movimento</i> (0 h em todas as fotos).</li>
              <li>As fotos ficam guardadas na tabela <code>alocacao_snapshots</code> do Supabase.</li>
            </ol>
          </details>
        </>
      )}

      {/* ═════════════════ JANELA: DETALHE + NOTA ═════════════════ */}
      {linhaDet && (() => {
        const l = linhaDet, cor = ST_COR[l.status], maxW = Math.max(1, ...l.semanasH)
        const proj = l.agg ? Object.entries(l.agg.projetos).sort((a, b) => b[1] - a[1]) : []
        const horasProj = l.agg ? (l.agg.tipos['projeto'] || 0) : 0
        return (
          <div className="modal open" onClick={e => { if (e.target === e.currentTarget) setDetId(null) }}>
            <div className="mbox">
              <div className="mhead">
                <div>
                  <div className="mtitle">{l.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{l.funcao || '—'} · {l.gerencia}{l.mat ? ` · mat. ${l.mat}` : ''}</div>
                </div>
                <button className="mx" onClick={() => setDetId(null)}>×</button>
              </div>
              <div className="grid3">
                <div className="mini"><div className="l">Planejado</div><div className="v">{fmtH(l.planejado)} h</div></div>
                <div className="mini"><div className="l">Alocado</div><div className="v">{fmtH(l.alocado)} h</div></div>
                <div className="mini"><div className="l">Situação</div>
                  <div className="v" style={{ fontSize: 12.5, fontFamily: 'inherit', color: cor, fontWeight: 600, paddingTop: 3 }}>
                    ● {l.status === 'afast' ? (l.nota.tag || 'Afastado') : ST_LABEL[l.status]}{l.pct != null ? ` · ${Math.round(l.pct)}%` : ''}
                  </div>
                </div>
              </div>

              {l.alertas.length > 0 && (<>
                <div className="sec">Alertas automáticos</div>
                <div>{l.alertas.map(([t, x], i) => <span key={i} className={`alert a-${t}`}>{x}</span>)}</div>
              </>)}

              <div className="sec">Horas por semana — {ymLabel(ymAtivo)}</div>
              {wks.map((w, i) => (
                <div className="wkrow" key={w.key}>
                  <span>{w.label} <span style={{ color: 'var(--muted)' }}>{w.faixa}</span></span>
                  <div className="t"><i style={{ width: `${l.semanasH[i] / maxW * 100}%` }} /></div>
                  <span className="h">{fmtH(l.semanasH[i])} h</span>
                </div>
              ))}

              <div className="sec">Composição</div>
              {l.agg ? (<>
                <div className="kv"><span>Dias com lançamento</span><span>{l.agg.dias.size}</span></div>
                <div className="kv"><span>Horas em projetos</span><span>{fmtH(horasProj)} h</span></div>
                <div className="kv"><span>Horas em outras atividades (timesheet)</span><span>{fmtH(l.alocado - horasProj)} h</span></div>
                {proj.length > 0 && <div className="sec">Principais projetos / atividades</div>}
                {proj.slice(0, 6).map(([p, h]) => <div className="kv" key={p}><span>{p}</span><span>{fmtH(h)} h</span></div>)}
              </>) : <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Sem lançamentos no relatório para este mês.</div>}

              <div className="sec">Nota gerencial</div>
              {podeEditar && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Marcar como (tira o colaborador dos indicadores):</div>}
              <div className="tags">
                {TAGS_MANUAIS.map(t => (
                  <button key={t} className={`chip ${detTag === t ? 'on c-ok' : ''}`} disabled={!podeEditar} onClick={() => setDetTag(detTag === t ? '' : t)}>{t}</button>
                ))}
              </div>
              <textarea
                value={detTexto} readOnly={!podeEditar} onChange={e => setDetTexto(e.target.value)}
                placeholder="Ex.: afastado (INSS) desde 20/10; retorna em dezembro · aguardando abertura de projeto · em ferramenta de outro time..."
              />
              <div className="row">
                {podeEditar && <button className="btn-sm" onClick={() => salvarNota(true)}>Limpar nota</button>}
                <button className="btn-ghost" onClick={() => setDetId(null)}>{podeEditar ? 'Cancelar' : 'Fechar'}</button>
                {podeEditar && <button className="btn" onClick={() => salvarNota(false)}>Salvar nota</button>}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═════════════════ JANELA: IMPORTAR ═════════════════ */}
      {modalImp && (
        <div className="modal open" onClick={e => { if (e.target === e.currentTarget) setModalImp(false) }}>
          <div className="mbox">
            <div className="mhead">
              <div>
                <div className="mtitle">Importar planilhas</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>O processamento é feito no próprio navegador; nada é enviado.</div>
              </div>
              <button className="mx" onClick={() => setModalImp(false)}>×</button>
            </div>
            <Importador res={resImp} onFile={importar} />
            <div className="row"><button className="btn" onClick={() => setModalImp(false)}>Concluir</button></div>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast" style={{ display: 'block' }}>{toastMsg}</div>}
    </div>
  )
}
