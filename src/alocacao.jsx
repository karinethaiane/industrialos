import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'

// ─── Paleta / tokens (mesmo padrão do sistema) ────────────────────────────────
const C = {
  green:   'var(--green)',   greenDim:  'var(--green-dim)',
  amber:   'var(--amber)',   amberDim:  'var(--amber-dim)',
  red:     'var(--red)',     redDim:    'var(--red-dim)',
  blue:    'var(--blue)',    blueDim:   'var(--blue-dim)',
  purple:  'var(--purple)',  purpleDim: 'var(--purple-dim)',
  teal:    'var(--teal)',    tealDim:   'var(--teal-dim)',
  muted:   'var(--muted)',
}

// ─── Situações ─────────────────────────────────────────────────────────────────
const SIT = {
  sem_alocacao:    { label: 'Sem alocação',      cor: C.red,    dim: C.redDim,    chip: 'c-sem' },
  abaixo:          { label: 'Abaixo',            cor: C.amber,  dim: C.amberDim,  chip: 'c-abaixo' },
  dentro:          { label: 'Dentro',            cor: C.green,  dim: C.greenDim,  chip: 'c-ok' },
  acima:           { label: 'Acima',             cor: C.purple, dim: C.purpleDim, chip: 'c-acima' },
  sem_plan:        { label: 'Sem planejamento',  cor: C.muted,  dim: 'var(--subtle)', chip: '' },
  desligado:       { label: 'Desligado',         cor: C.muted,  dim: 'var(--subtle)', chip: '' },
}

// ─── Utilitários ───────────────────────────────────────────────────────────────
function normalizar(s) {
  if (!s) return ''
  return s.toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function distLevenshtein(a, b) {
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = a[i-1] === b[j-1] ? d[i-1][j-1] : 1 + Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1])
  return d[m][n]
}

function vincularNome(nomeRef, nomesAloc) {
  const r = normalizar(nomeRef)
  // Exato
  const exato = nomesAloc.find(n => normalizar(n) === r)
  if (exato) return { nome: exato, aproximado: false }
  // Por aproximação — até 20% de distância
  let best = null, bestDist = Infinity
  for (const n of nomesAloc) {
    const d = distLevenshtein(r, normalizar(n))
    if (d < bestDist) { bestDist = d; best = n }
  }
  const limite = Math.round(r.length * 0.2)
  if (bestDist <= limite && bestDist > 0) return { nome: best, aproximado: true }
  return null
}

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function pct(alocado, planejado) {
  if (!planejado || planejado === 0) return null
  return Math.round((alocado / planejado) * 100)
}

// ─── Leitura da planilha PCP (xlsx via SheetJS) ────────────────────────────────
function lerPCP(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  // Linha 3 (idx 3) = row 4 no excel → cabeçalhos de meses (mesclados)
  // Linha 4 (idx 4) = row 5 → Planejado/Realizado/…
  const headerMes  = data[3] || []
  const headerSub  = data[4] || []

  // Mapear mês → índice da coluna "Planejado"
  const mesesMap = {} // ex: "NOV/26" → colIndex
  let ultimoMes = null
  for (let c = 0; c < headerMes.length; c++) {
    if (headerMes[c]) ultimoMes = headerMes[c]
    if (headerSub[c] === 'Planejado' && ultimoMes) {
      mesesMap[ultimoMes] = c
    }
  }

  // Colaboradores: a partir da linha 5 (idx 5)
  const colaboradores = []
  for (let r = 5; r < data.length; r++) {
    const row = data[r]
    if (!row) continue
    const nome = row[2]
    const gerencia = row[4]
    if (!nome || typeof nome !== 'string' || nome.includes('TBD') || nome.includes('A CONTRATAR')) continue

    const planejadoPorMes = {}
    for (const [mes, col] of Object.entries(mesesMap)) {
      const v = row[col]
      planejadoPorMes[mes] = (typeof v === 'number') ? v : 0
    }

    colaboradores.push({
      matricula: row[0],
      status:    row[1],
      nome:      nome.trim(),
      funcao:    row[3],
      gerencia:  gerencia,
      planejadoPorMes,
    })
  }

  return { meses: Object.keys(mesesMap), mesesMap, colaboradores }
}

// ─── Leitura do relatório de alocações (xlsx via SheetJS) ─────────────────────
function lerRelatorio(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  // Sempre primeira aba
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null })
  // Colunas: Ano, Mes, Usuario, Horas
  return rows
}

// ─── Cruzamento ───────────────────────────────────────────────────────────────
function cruzar(pcpData, relRows, mesRef, tolerancia) {
  // 1. Filtrar relatorio pelo mês de referência
  const [mesStr, anoStr] = mesRef.split('/') // ex: "NOV/26"
  const MESES_NUM = { JAN:1, FEV:2, MAR:3, ABR:4, MAI:5, JUN:6, JUL:7, AGO:8, SET:9, OUT:10, NOV:11, DEZ:12 }
  const mesNum = MESES_NUM[mesStr]
  const anoNum = anoStr ? parseInt('20' + anoStr) : null

  const alocacaoMap = {} // nomeNorm → horas
  const nomesRelatorio = new Set()
  for (const row of relRows) {
    if (row.Ano !== anoNum || row.Mes !== mesNum) continue
    const nomeNorm = normalizar(row.Usuario)
    nomesRelatorio.add(row.Usuario)
    alocacaoMap[nomeNorm] = (alocacaoMap[nomeNorm] || 0) + (Number(row.Horas) || 0)
  }
  const nomesAlocList = [...nomesRelatorio]

  // 2. Pegar só TICs do PCP
  const equipe = pcpData.colaboradores.filter(c => c.gerencia && c.gerencia.includes('TICs'))

  // Extra: quem está no relatório (vertical TICs) mas não está no PCP
  const nomesNaEquipe = new Set(equipe.map(c => normalizar(c.nome)))
  const foraDoPlano = []
  // Para detectar TICs no relatório: checamos a coluna Vertical
  for (const row of relRows) {
    if (row.Ano !== anoNum || row.Mes !== mesNum) continue
    if (row.Vertical && row.Vertical.includes('TICs')) {
      const nNorm = normalizar(row.Usuario)
      if (!nomesNaEquipe.has(nNorm) && !foraDoPlano.find(x => normalizar(x.nome) === nNorm)) {
        foraDoPlano.push({
          nome: row.Usuario,
          funcao: row.Cargo || '—',
          alocado: alocacaoMap[nNorm] || 0,
          situacao: 'sem_plan',
          alertas: ['sem_plan_pcp'],
          planejado: 0,
          vinculo: null,
        })
      }
    }
  }

  // 3. Para cada colaborador TICs do PCP, calcular situação
  const linhas = equipe.map(c => {
    const planejado = c.planejadoPorMes[mesRef] ?? 0
    const alertas = []

    // Vínculo com relatório
    const vinculo = vincularNome(c.nome, nomesAlocList)
    let alocado = 0
    if (vinculo) {
      const nNorm = normalizar(vinculo.nome)
      alocado = alocacaoMap[nNorm] || 0
      if (vinculo.aproximado) alertas.push('nome_aproximado')
    } else {
      alertas.push('nao_localizado')
    }

    if (c.status === 'DESLIGADO') alertas.push('desligado')

    // Situação
    let situacao
    if (c.status === 'DESLIGADO') {
      situacao = 'desligado'
    } else if (planejado === 0 || planejado === null) {
      situacao = 'sem_plan'
      if (alocado > 0) alertas.push('aloc_sem_plan')
    } else if (alocado === 0) {
      situacao = 'sem_alocacao'
    } else {
      const p = pct(alocado, planejado)
      const tol = tolerancia || 0
      if (p < (100 - tol)) situacao = 'abaixo'
      else if (p > (100 + tol)) situacao = 'acima'
      else situacao = 'dentro'
    }

    return {
      matricula: c.matricula,
      nome: c.nome,
      funcao: c.funcao,
      gerencia: 'TICs',
      status_pcp: c.status,
      planejado,
      alocado,
      situacao,
      alertas,
      vinculo,
      nota: '',
    }
  })

  return { linhas: [...linhas, ...foraDoPlano], foraDoPlano }
}

// ─── Estilos inline (mesmo padrão do sistema) ─────────────────────────────────
const S = {
  wrap:   { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' },
  title:  { fontSize: 21, fontWeight: 700, letterSpacing: '-.02em' },
  sub:    { fontSize: 13, color: 'var(--muted)', marginTop: 3 },

  tabs:   { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 18 },
  tab:    (on) => ({
    padding: '9px 20px', fontSize: 13, fontWeight: on ? 700 : 500, cursor: 'pointer',
    color: on ? 'var(--teal)' : 'var(--muted)', background: 'none', border: 'none',
    borderBottom: on ? '2px solid var(--teal)' : '2px solid transparent',
    marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7, transition: 'all .15s',
  }),

  btn:    { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontFamily: 'inherit' },
  btnGhost: { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontFamily: 'inherit' },
  btnSm:  { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },

  sel:    { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '7px 10px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  search: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 280 },

  drop:   (ativo) => ({
    display: 'block', border: `1.5px dashed ${ativo ? 'var(--teal)' : 'var(--border2)'}`,
    borderRadius: 10, padding: '18px 20px', cursor: 'pointer',
    background: ativo ? 'var(--teal-dim)' : 'var(--surface2)',
    transition: 'all .15s', marginBottom: 10,
  }),
  dropLabel: { fontSize: 13, color: 'var(--text)', fontWeight: 600, display: 'block', marginBottom: 3 },
  dropHint:  { fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 },
  dropOk:    { fontSize: 12, color: 'var(--green)', fontWeight: 600, marginTop: 6 },

  stats:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 16 },
  stat:   { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px var(--shadow)', position: 'relative', overflow: 'hidden' },
  statV:  { fontFamily: '"JetBrains Mono", monospace', fontSize: 26, fontWeight: 500, lineHeight: 1, marginBottom: 5 },
  statL:  { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },

  tablewrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflowX: 'auto', boxShadow: '0 1px 6px var(--shadow)', marginTop: 10 },
  th:     { textAlign: 'left', padding: '10px 12px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  thR:    { textAlign: 'right', padding: '10px 12px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  td:     { padding: '10px 12px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  tdR:    { padding: '10px 12px', fontSize: 12.5, color: 'var(--text2)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', textAlign: 'right', fontFamily: '"JetBrains Mono", monospace' },

  badge:  (cor, dim) => ({ background: dim, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }),
  alert:  (cor, dim) => ({ background: dim, color: cor, fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 4, display: 'inline-block', marginRight: 4, marginBottom: 2 }),

  pctWrap: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 },
  pctBar:  { flex: 1, height: 6, borderRadius: 4, background: 'var(--surface2)', border: '1px solid var(--border)', overflow: 'hidden', minWidth: 50 },
  pctVal:  { fontFamily: '"JetBrains Mono", monospace', fontSize: 12, width: 42, textAlign: 'right' },
}

// ─── Helpers de UI ─────────────────────────────────────────────────────────────
function SituacaoBadge({ sit }) {
  const cfg = SIT[sit] || SIT.sem_plan
  return <span style={S.badge(cfg.cor, cfg.dim)}>● {cfg.label}</span>
}

function AlertaChips({ alertas }) {
  const MAP = {
    desligado:     { label: 'Desligado',              cor: C.muted,   dim: 'var(--subtle)' },
    nao_localizado:{ label: 'Não localizado no rel.', cor: C.amber,   dim: C.amberDim },
    nome_aproximado:{ label: 'Nome por aproximação',  cor: C.blue,    dim: C.blueDim },
    aloc_sem_plan: { label: 'Aloca sem planejamento', cor: C.purple,  dim: C.purpleDim },
    sem_plan_pcp:  { label: 'Fora do PCP',            cor: C.muted,   dim: 'var(--subtle)' },
  }
  return alertas.map((a, i) => {
    const c = MAP[a] || { label: a, cor: C.muted, dim: 'var(--subtle)' }
    return <span key={i} style={S.alert(c.cor, c.dim)}>{c.label}</span>
  })
}

function BarraPct({ alocado, planejado }) {
  if (!planejado) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
  const p = pct(alocado, planejado)
  const largura = Math.min(p, 100)
  const cor = p >= 100 ? C.green : p >= 70 ? C.amber : C.red
  return (
    <div style={S.pctWrap}>
      <div style={S.pctBar}>
        <div style={{ width: `${largura}%`, height: '100%', background: cor, borderRadius: 4 }} />
      </div>
      <span style={{ ...S.pctVal, color: cor }}>{p}%</span>
    </div>
  )
}

function StatCard({ valor, label, cor, dim }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statV, color: cor }}>{valor}</div>
      <div style={S.statL}>{label}</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: cor, opacity: .4 }} />
    </div>
  )
}

// ─── Chip de filtro ────────────────────────────────────────────────────────────
function Chip({ label, count, ativo, cor, onClick }) {
  const baseStyle = {
    padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: '1px solid var(--border2)',
    background: ativo ? (cor?.dim || 'var(--blue-dim)') : 'var(--subtle)',
    color: ativo ? (cor?.cor || 'var(--blue)') : 'var(--text2)',
    display: 'inline-flex', gap: 6, alignItems: 'center',
  }
  return (
    <button style={baseStyle} onClick={onClick}>
      {label}
      {count !== undefined && <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, opacity: .8 }}>{count}</span>}
    </button>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function Administrativo() {
  const [aba, setAba] = useState('alocacao')   // 'onedoc' | 'alocacao'

  // --- Estado da aba Alocação ---
  const [pcpFile, setPcpFile]       = useState(null)   // { nome, buffer }
  const [relFile, setRelFile]       = useState(null)   // { nome, buffer }
  const [pcpData, setPcpData]       = useState(null)   // resultado lerPCP
  const [relRows, setRelRows]       = useState(null)   // linhas do relatório
  const [mesRef, setMesRef]         = useState('')
  const [tolerancia, setTolerancia] = useState(5)
  const [busca, setBusca]           = useState('')
  const [filtroSit, setFiltroSit]   = useState('')     // situação ativa no chip
  const [incFora, setIncFora]       = useState(false)  // incluir fora do PCP
  const [notas, setNotas]           = useState({})     // nome → nota
  const [editandoNota, setEditandoNota] = useState(null)
  const [notaTemp, setNotaTemp]     = useState('')

  // ─── Carregar PCP ───────────────────────────────────────────────────────────
  const handlePCP = useCallback(async (file) => {
    if (!file) return
    const buffer = await file.arrayBuffer()
    try {
      const parsed = lerPCP(new Uint8Array(buffer))
      setPcpData(parsed)
      setPcpFile({ nome: file.name })
      // Pré-selecionar mês mais próximo do mês atual
      const hoje = new Date()
      const MESES_LABEL = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
      const mesAtual = MESES_LABEL[hoje.getMonth()] + '/' + String(hoje.getFullYear()).slice(2)
      if (parsed.meses.includes(mesAtual)) setMesRef(mesAtual)
      else setMesRef(parsed.meses[0] || '')
    } catch (e) {
      alert('Erro ao ler PCP: ' + e.message)
    }
  }, [])

  // ─── Carregar Relatório ─────────────────────────────────────────────────────
  const handleRelatorio = useCallback(async (file) => {
    if (!file) return
    const buffer = await file.arrayBuffer()
    try {
      const rows = lerRelatorio(new Uint8Array(buffer))
      setRelRows(rows)
      setRelFile({ nome: file.name })
    } catch (e) {
      alert('Erro ao ler relatório: ' + e.message)
    }
  }, [])

  // ─── Dados cruzados ─────────────────────────────────────────────────────────
  const dados = (pcpData && relRows && mesRef)
    ? cruzar(pcpData, relRows, mesRef, tolerancia)
    : null

  const todasLinhas = dados ? dados.linhas : []
  const linhas = todasLinhas.filter(l => {
    if (!incFora && l.alertas.includes('sem_plan_pcp')) return false
    return true
  })

  // Filtro por busca e situação
  const linhasFiltradas = linhas.filter(l => {
    if (filtroSit && l.situacao !== filtroSit) return false
    if (busca) {
      const q = normalizar(busca)
      return normalizar(l.nome).includes(q) || normalizar(l.funcao).includes(q) || String(l.matricula).includes(q)
    }
    return true
  })

  // Contagens para cards
  const monitorizados = linhas.filter(l => l.situacao !== 'desligado' && !l.alertas.includes('sem_plan_pcp'))
  const countSit = (s) => monitorizados.filter(l => l.situacao === s).length
  const totalPlan = monitorizados.reduce((a, l) => a + (l.planejado || 0), 0)
  const totalAloc = monitorizados.reduce((a, l) => a + (l.alocado || 0), 0)
  const cobertura = totalPlan > 0 ? Math.round((totalAloc / totalPlan) * 100) : null

  // ─── Exportar Excel ─────────────────────────────────────────────────────────
  function exportarExcel() {
    if (!linhas.length) return
    const rows = linhas.map(l => ({
      'Gerência': 'TICs',
      'Matrícula': l.matricula || '—',
      'Colaborador': l.nome,
      'Função': l.funcao,
      'Status PCP': l.status_pcp || '—',
      'Planejado (h)': l.planejado ?? 0,
      'Alocado (h)': l.alocado ?? 0,
      'Desvio (h)': (l.alocado ?? 0) - (l.planejado ?? 0),
      '% Realizado': l.planejado ? Math.round(((l.alocado ?? 0) / l.planejado) * 100) + '%' : '—',
      'Situação': SIT[l.situacao]?.label || l.situacao,
      'Alertas': l.alertas.join(', '),
      'Nota': notas[l.nome] || '',
      'Mês ref.': mesRef,
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [8,10,30,28,12,14,13,13,13,18,30,30,10].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws, `Alocacao_${mesRef.replace('/','_')}`)
    XLSX.writeFile(wb, `alocacao_horas_${mesRef.replace('/','_')}.xlsx`)
  }

  // ─── Drop zone helpers ──────────────────────────────────────────────────────
  function DropZone({ label, hint, file, onFile }) {
    const [over, setOver] = useState(false)
    return (
      <label
        style={S.drop(over || !!file)}
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
      >
        <span style={S.dropLabel}>📂 {label}</span>
        <span style={S.dropHint}>{hint}</span>
        {file && <span style={S.dropOk}>✓ {file.nome}</span>}
        <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) onFile(f) }} />
      </label>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>Administrativo</div>
          <div style={S.sub}>1Doc, documentação e Alocação de Horas</div>
        </div>
        {aba === 'alocacao' && dados && (
          <button style={S.btn} onClick={exportarExcel}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar Excel
          </button>
        )}
      </div>

      {/* Abas */}
      <div style={S.tabs}>
        <button style={S.tab(aba === 'onedoc')} onClick={() => setAba('onedoc')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Documentos (1Doc)
        </button>
        <button style={S.tab(aba === 'alocacao')} onClick={() => setAba('alocacao')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
          Alocação de Horas
          {dados && (
            <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: 'var(--teal-dim)', color: 'var(--teal)' }}>
              {monitorizados.length}
            </span>
          )}
        </button>
      </div>

      {/* ══ ABA 1DOC ════════════════════════════════════════════════════════════ */}
      {aba === 'onedoc' && (
        <div style={{ background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: 10, padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Conteúdo do 1Doc permanece inalterado.
        </div>
      )}

      {/* ══ ABA ALOCAÇÃO ════════════════════════════════════════════════════════ */}
      {aba === 'alocacao' && (
        <>
          {/* Upload das planilhas */}
          {(!pcpData || !relRows) && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>Importar planilhas</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <DropZone
                  label="Planilha PCP"
                  hint="Arquivo com o planejamento de horas dos colaboradores. Aba Planilha1."
                  file={pcpFile}
                  onFile={handlePCP}
                />
                <DropZone
                  label="Relatório de Alocações"
                  hint="Exportado do sistema. Aba Alocacoes com colunas Ano, Mês, Usuario e Horas."
                  file={relFile}
                  onFile={handleRelatorio}
                />
              </div>
              {pcpData && !relRows && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--teal)' }}>
                  ✓ PCP carregado — {pcpData.colaboradores.filter(c=>c.gerencia?.includes('TICs')).length} colaboradores TICs · meses: {pcpData.meses.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Painel de upload já carregado (compacto) */}
          {pcpData && relRows && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 12 }}>
              <span style={{ color: 'var(--teal)', fontWeight: 600 }}>✓ PCP:</span>
              <span style={{ color: 'var(--muted)' }}>{pcpFile?.nome}</span>
              <span style={{ color: 'var(--teal)', fontWeight: 600, marginLeft: 8 }}>✓ Relatório:</span>
              <span style={{ color: 'var(--muted)' }}>{relFile?.nome}</span>
              <button style={{ ...S.btnSm, marginLeft: 'auto' }} onClick={() => { setPcpData(null); setRelRows(null); setPcpFile(null); setRelFile(null) }}>
                Trocar planilhas
              </button>
            </div>
          )}

          {/* Controles de mês e gerência */}
          {pcpData && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Mês de referência</label>
              <select style={S.sel} value={mesRef} onChange={e => setMesRef(e.target.value)}>
                {pcpData.meses.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginLeft: 6 }}>Gerência</label>
              <select style={S.sel} disabled><option>TICs</option></select>
              {dados && (
                <span style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, color: 'var(--teal)', background: 'var(--teal-dim)', border: '1px solid rgba(13,148,136,.25)' }}>
                  <b>{monitorizados.length}</b> monitorados
                </span>
              )}
            </div>
          )}

          {/* KPIs */}
          {dados && (
            <div style={S.stats}>
              <StatCard valor={monitorizados.length} label="Monitorados" cor="var(--blue)" />
              <StatCard valor={countSit('sem_alocacao')} label="Sem alocação" cor={C.red} dim={C.redDim} />
              <StatCard valor={countSit('abaixo')} label="Abaixo do plano" cor={C.amber} dim={C.amberDim} />
              <StatCard valor={countSit('dentro')} label="Dentro do plano" cor={C.green} dim={C.greenDim} />
              <StatCard valor={countSit('acima')} label="Acima do plano" cor={C.purple} dim={C.purpleDim} />
              <StatCard valor={cobertura !== null ? cobertura + '%' : '—'} label="Cobertura geral" cor="var(--teal)" />
              <StatCard valor={fmt(totalPlan) + ' h'} label="Total planejado" cor="var(--muted)" />
              <StatCard valor={fmt(totalAloc) + ' h'} label="Total alocado" cor="var(--muted)" />
            </div>
          )}

          {/* Toolbar */}
          {dados && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input style={S.search} placeholder="Buscar colaborador, função ou matrícula…" value={busca} onChange={e => setBusca(e.target.value)} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { key: '', label: 'Todos' },
                    { key: 'sem_alocacao', label: 'Sem alocação', cor: { cor: C.red, dim: C.redDim } },
                    { key: 'abaixo',       label: 'Abaixo',       cor: { cor: C.amber, dim: C.amberDim } },
                    { key: 'dentro',       label: 'Dentro',       cor: { cor: C.green, dim: C.greenDim } },
                    { key: 'acima',        label: 'Acima',        cor: { cor: C.purple, dim: C.purpleDim } },
                    { key: 'sem_plan',     label: 'Sem plan.',    cor: { cor: C.muted, dim: 'var(--subtle)' } },
                    { key: 'desligado',    label: 'Desligados',   cor: { cor: C.muted, dim: 'var(--subtle)' } },
                  ].map(({ key, label, cor }) => (
                    <Chip
                      key={key} label={label}
                      count={key ? linhas.filter(l => l.situacao === key).length : linhas.length}
                      ativo={filtroSit === key} cor={cor}
                      onClick={() => setFiltroSit(filtroSit === key ? '' : key)}
                    />
                  ))}
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
                  {linhasFiltradas.length} de {linhas.length}
                </span>
              </div>

              {/* Opções extras */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12, fontSize: 12, color: 'var(--text2)' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  Tolerância de ±
                  <select style={{ ...S.sel, padding: '3px 8px', fontSize: 12 }} value={tolerancia} onChange={e => setTolerancia(Number(e.target.value))}>
                    {[0,5,10,15].map(v => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={incFora} onChange={e => setIncFora(e.target.checked)} style={{ accentColor: 'var(--blue)' }} />
                  Incluir quem aloca no sistema mas não está no PCP
                  {dados.foraDoPlano.length > 0 && (
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>({dados.foraDoPlano.length})</span>
                  )}
                </label>
              </div>
            </>
          )}

          {/* Tabela */}
          {dados && (
            <div style={S.tablewrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Gerência','Colaborador','Função','Status PCP','Situação','Planejado','Alocado','% Realizado','Nota'].map((h, i) => (
                      <th key={h} style={[5,6,7].includes(i) ? S.thR : S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhasFiltradas.length === 0 && (
                    <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Nenhum colaborador encontrado.</td></tr>
                  )}
                  {linhasFiltradas.map((l, idx) => {
                    const isUlt = idx === linhasFiltradas.length - 1
                    const tdStyle = (r) => ({ ...r, borderBottom: isUlt ? 'none' : '1px solid var(--border)' })
                    return (
                      <tr key={l.nome} style={{ background: 'transparent' }}
                        onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = 'var(--subtle)')}
                        onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '')}
                      >
                        {/* Gerência */}
                        <td style={tdStyle(S.td)}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)' }}>TICs</span>
                        </td>
                        {/* Colaborador */}
                        <td style={tdStyle(S.td)}>
                          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{l.nome}</span>
                          {l.matricula && (
                            <span style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: 'var(--muted)', fontWeight: 400, marginTop: 1 }}>
                              {l.matricula}
                            </span>
                          )}
                          {l.alertas.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              <AlertaChips alertas={l.alertas} />
                            </div>
                          )}
                        </td>
                        {/* Função */}
                        <td style={tdStyle({ ...S.td, fontSize: 12, maxWidth: 180 })}>{l.funcao || '—'}</td>
                        {/* Status PCP */}
                        <td style={tdStyle(S.td)}>
                          {l.status_pcp
                            ? <span style={{ fontSize: 11, fontWeight: 600, color: l.status_pcp === 'DESLIGADO' ? C.red : C.green }}>
                                {l.status_pcp}
                              </span>
                            : <span style={{ color: 'var(--muted)' }}>—</span>
                          }
                        </td>
                        {/* Situação */}
                        <td style={tdStyle(S.td)}><SituacaoBadge sit={l.situacao} /></td>
                        {/* Planejado */}
                        <td style={tdStyle(S.tdR)}>{l.planejado ? fmt(l.planejado) + ' h' : '—'}</td>
                        {/* Alocado */}
                        <td style={tdStyle(S.tdR)}>{fmt(l.alocado)} h</td>
                        {/* % */}
                        <td style={tdStyle({ ...S.td, minWidth: 130 })}>
                          <BarraPct alocado={l.alocado} planejado={l.planejado} />
                        </td>
                        {/* Nota */}
                        <td style={tdStyle({ ...S.td, minWidth: 230, maxWidth: 260, cursor: 'pointer' })}
                          onClick={() => { setEditandoNota(l.nome); setNotaTemp(notas[l.nome] || '') }}>
                          {notas[l.nome]
                            ? <span style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic' }}>{notas[l.nome]}</span>
                            : <span style={{ fontSize: 11, color: 'var(--muted)', border: '1px dashed var(--border2)', borderRadius: 5, padding: '1px 8px', display: 'inline-block' }}>+ Nota</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Estado vazio */}
          {!dados && pcpData && relRows && (
            <div style={{ background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: 10, padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Selecione um mês de referência acima para ver o cruzamento.
            </div>
          )}
          {!pcpData && !relRows && (
            <div style={{ background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: 10, padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Importe as duas planilhas acima para visualizar o relatório de alocação.
            </div>
          )}

          {/* Modal nota */}
          {editandoNota && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
              onClick={e => { if (e.target === e.currentTarget) setEditandoNota(null) }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, padding: 28, width: '92%', maxWidth: 460, boxShadow: '0 8px 40px var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>Nota</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{editandoNota}</div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22 }} onClick={() => setEditandoNota(null)}>×</button>
                </div>
                <textarea
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', minHeight: 90, resize: 'vertical' }}
                  placeholder="Ex.: Desligado em 15/11, afastado por licença, sem planejamento pois é bolsista novo…"
                  value={notaTemp} autoFocus
                  onChange={e => setNotaTemp(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
                  {notas[editandoNota] && (
                    <button style={S.btnSm} onClick={() => { setNotas(n => { const c={...n}; delete c[editandoNota]; return c }); setEditandoNota(null) }}>
                      Remover nota
                    </button>
                  )}
                  <button style={S.btnGhost} onClick={() => setEditandoNota(null)}>Cancelar</button>
                  <button style={S.btn} onClick={() => {
                    setNotas(n => ({ ...n, [editandoNota]: notaTemp }))
                    setEditandoNota(null)
                  }}>Salvar</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
