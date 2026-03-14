import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const SITUACOES  = ['Em uso', 'Disponível', 'Em manutenção', 'Descartado']
const TIPOS_BEM  = ['Computador', 'Periférico', 'Móvel', 'Instrumento de Medição', 'Veículo', 'Outro']

const SIT_COR = {
  'Em uso':          'var(--green)',
  'Disponível':      'var(--blue)',
  'Em manutenção':   'var(--amber)',
  'Descartado':      'var(--red)',
}

const formVazio = {
  codigo_barra: '', descricao: '', descricao_complementar: '',
  tipo_bem: '', situacao: 'Em uso', local: '', responsavel: '',
  usuario_patrimonio: '', unidade: '',
  data_aquisicao: '', valor_aquisicao: '', saldo_contabil: '',
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const S = {
  wrap:        { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:       { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub:         { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  stats:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 22 },
  statCard:    { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' },
  statBar:     (c) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: c, opacity: .5 }),
  statVal:     (c) => ({ fontFamily: 'DM Mono, monospace', fontSize: 26, fontWeight: 500, color: c, lineHeight: 1, marginBottom: 5 }),
  statLbl:     { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },
  toolbar:     { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' },
  toolbar2:    { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  search:      { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 260 },
  fselSm:      { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '5px 10px', color: 'var(--text2)', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', height: 30 },
  filtro:      (on) => ({ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'rgba(59,130,246,.25)' : 'var(--border2)'}`, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)', fontFamily: 'inherit' }),
  btn:         { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  btnSm:       { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger:   { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  btnLimpar:   { background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: '0 4px' },
  btnGhost:    { background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 },
  tableWrap:   { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  td:          { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox:    { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle:  { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 18 },
  field:       { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  fieldRow3:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 },
  label:       { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input:       { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel:        { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  textarea:    { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', resize: 'vertical', minHeight: 64 },
  row:         { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro:        { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  sectionLabel:{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
  chip:        (bg, color) => ({ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: bg, color, marginRight: 4 }),
  histRow:     { display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' },
  histDot:     (c) => ({ width: 8, height: 8, borderRadius: '50%', background: c, marginTop: 5, flexShrink: 0 }),
  histInfo:    { flex: 1, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 },
  uploadArea:  { border: '2px dashed var(--border2)', borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: 14, color: 'var(--muted)', fontSize: 13 },
  abas:        { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 },
  aba:         (on) => ({ padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: `2px solid ${on ? 'var(--blue)' : 'transparent'}`, fontFamily: 'inherit', marginBottom: -1 }),
}

function fmtData(d) { if (!d) return '—'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') }
function fmtMoeda(v) { if (!v) return '—'; const n = parseFloat(String(v).replace(',','.')); return isNaN(n) ? v : n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) }

// ── COMPONENTE ────────────────────────────────────────────────────────────────
export default function Patrimonio({ isAdmin = false }) {
  const [aba, setAba]             = useState('lista')
  const [itens, setItens]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [busca, setBusca]         = useState('')
  const [filtroTipo, setFiltroTipo]   = useState('')
  const [filtroSit, setFiltroSit]     = useState('')
  const [filtroLocal, setFiltroLocal] = useState('')
  const [filtroResp, setFiltroResp]   = useState('')
  const [modal, setModal]         = useState(false)   // 'novo' | 'editar' | 'historico'
  const [itemSel, setItemSel]     = useState(null)
  const [form, setForm]           = useState(formVazio)
  const [historico, setHistorico] = useState([])
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')
  const [importando, setImportando] = useState(false)
  const [erroImport, setErroImport] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from('patrimonios').select('*').order('descricao')
    setItens(data || [])
    setLoading(false)
  }

  // ── FILTROS ──────────────────────────────────────────────────────────────────
  const locais   = [...new Set(itens.map(i => i.local).filter(Boolean))].sort()
  const resps    = [...new Set(itens.map(i => i.responsavel).filter(Boolean))].sort()
  const temFiltro = filtroTipo || filtroSit || filtroLocal || filtroResp

  const filtrados = itens.filter(i => {
    if (filtroTipo  && i.tipo_bem   !== filtroTipo)  return false
    if (filtroSit   && i.situacao   !== filtroSit)   return false
    if (filtroLocal && i.local      !== filtroLocal) return false
    if (filtroResp  && i.responsavel !== filtroResp) return false
    if (busca) {
      const b = busca.toLowerCase()
      return (
        i.codigo_barra?.toLowerCase().includes(b) ||
        i.descricao?.toLowerCase().includes(b) ||
        i.local?.toLowerCase().includes(b) ||
        i.responsavel?.toLowerCase().includes(b) ||
        i.usuario_patrimonio?.toLowerCase().includes(b)
      )
    }
    return true
  })

  function limparFiltros() { setFiltroTipo(''); setFiltroSit(''); setFiltroLocal(''); setFiltroResp(''); setBusca('') }

  // ── STATS ────────────────────────────────────────────────────────────────────
  const totalEmUso      = itens.filter(i => i.situacao === 'Em uso').length
  const totalDisponivel = itens.filter(i => i.situacao === 'Disponível').length
  const totalManutencao = itens.filter(i => i.situacao === 'Em manutenção').length

  // ── CRUD ──────────────────────────────────────────────────────────────────────
  function abrirNovo() {
    setItemSel(null); setErro(''); setForm(formVazio); setModal('novo')
  }
  function abrirEditar(item) {
    setItemSel(item); setErro('')
    setForm({
      codigo_barra:            item.codigo_barra            || '',
      descricao:               item.descricao               || '',
      descricao_complementar:  item.descricao_complementar  || '',
      tipo_bem:                item.tipo_bem                || '',
      situacao:                item.situacao                || 'Em uso',
      local:                   item.local                   || '',
      responsavel:             item.responsavel             || '',
      usuario_patrimonio:      item.usuario_patrimonio      || '',
      unidade:                 item.unidade                 || '',
      data_aquisicao:          item.data_aquisicao          || '',
      valor_aquisicao:         item.valor_aquisicao         || '',
      saldo_contabil:          item.saldo_contabil          || '',
    })
    setModal('editar')
  }

  async function abrirHistorico(item) {
    setItemSel(item)
    const { data } = await supabase
      .from('patrimonio_historico')
      .select('*')
      .eq('patrimonio_id', item.id)
      .order('created_at', { ascending: false })
    setHistorico(data || [])
    setModal('historico')
  }

  async function salvar() {
    if (!form.codigo_barra.trim() || !form.descricao.trim()) {
      setErro('Código de barra e Descrição são obrigatórios.'); return
    }
    setSalvando(true); setErro('')
    const dados = {
      codigo_barra:           form.codigo_barra.trim(),
      descricao:              form.descricao.trim(),
      descricao_complementar: form.descricao_complementar.trim() || null,
      tipo_bem:               form.tipo_bem || null,
      situacao:               form.situacao || 'Em uso',
      local:                  form.local.trim() || null,
      responsavel:            form.responsavel.trim() || null,
      usuario_patrimonio:     form.usuario_patrimonio.trim() || null,
      unidade:                form.unidade.trim() || null,
      data_aquisicao:         form.data_aquisicao || null,
      valor_aquisicao:        form.valor_aquisicao.trim() || null,
      saldo_contabil:         form.saldo_contabil.trim() || null,
    }

    let error
    if (modal === 'editar' && itemSel) {
      // Registrar mudanças no histórico
      const campos = Object.keys(dados)
      for (const campo of campos) {
        const anterior = itemSel[campo]
        const novo     = dados[campo]
        if (String(anterior ?? '') !== String(novo ?? '')) {
          await supabase.from('patrimonio_historico').insert({
            patrimonio_id: itemSel.id,
            campo_alterado: campo,
            valor_anterior: anterior ?? null,
            valor_novo:     novo ?? null,
          })
        }
      }
      ;({ error } = await supabase.from('patrimonios').update(dados).eq('id', itemSel.id))
    } else {
      ;({ error } = await supabase.from('patrimonios').insert(dados))
    }

    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModal(false); carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir este patrimônio? O histórico também será removido.')) return
    await supabase.from('patrimonio_historico').delete().eq('patrimonio_id', id)
    await supabase.from('patrimonios').delete().eq('id', id)
    carregar()
  }

  // ── IMPORTAÇÃO EXCEL ─────────────────────────────────────────────────────────
  async function importarExcel(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true); setErroImport('')
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const buf  = await file.arrayBuffer()
      const wb   = XLSX.read(new Uint8Array(buf), { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]

      // Planilha de relatório: dados por índice de coluna (formato fixo do sistema)
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 })

      const extractType = (desc) => {
        const d = (desc || '').toUpperCase()
        if (d.includes('NOTEBOOK') || d.includes('DESKTOP') || d.includes('COMPUTADOR')) return 'Computador'
        if (d.includes('MONITOR') || d.includes('TECLADO') || d.includes('MOUSE') || d.includes('IMPRESSORA') || d.includes('SCANNER')) return 'Periférico'
        if (d.includes('MULTÍMETRO') || d.includes('ANALISADOR') || d.includes('MEDIDOR') || d.includes('ANALISAD')) return 'Instrumento de Medição'
        if (d.includes('MESA') || d.includes('CADEIRA') || d.includes('ARMÁRIO') || d.includes('ESTANTE')) return 'Móvel'
        return 'Outro'
      }

      const formatDate = (v) => {
        if (!v) return null
        if (typeof v === 'number') {
          const d = new Date((v - 25569) * 86400 * 1000)
          return d.toISOString().split('T')[0]
        }
        if (typeof v === 'string') {
          const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})/)
          if (m) return `${m[3]}-${m[2]}-${m[1]}`
          if (/\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
        }
        return null
      }

      let inseridos = 0, erros = 0
      let currentResponsavel = '', currentLocal = ''

      // Encontrar a linha do cabeçalho (contém 'Cod. Barra')
      let dataStart = 38
      for (let i = 30; i < 50; i++) {
        const row = rawData[i]
        if (row && row.some(c => String(c || '').includes('Cod. Barra'))) {
          dataStart = i + 1
          break
        }
      }

      for (let i = dataStart; i < rawData.length; i++) {
        const row = rawData[i]
        if (!row || row.length === 0) continue

        // Detectar linhas de responsável e local (varrer toda a linha)
        const rowStr = row.map(c => String(c || '')).join('|')
        
        if (rowStr.includes('Total do Responsável')) {
          const m = rowStr.match(/Total do Responsável \[([^\]]+)\]/)
          if (m) currentResponsavel = m[1].trim()
          continue
        }
        if (rowStr.includes('Total do Local')) {
          const m = rowStr.match(/Total do Local \[([^\]]+)\]/)
          if (m) currentLocal = m[1].trim()
          continue
        }
        if (rowStr.includes('Total da Unidade') || rowStr.includes('Total de bens') || rowStr.includes('Total do')) continue

        // Tentar encontrar o código de barra — procurar em colunas 5-8
        let barCode = '', description = '', compl = '', situation = '', dtAquis = null, vlrAquis = '', saldo = ''
        
        // Procurar coluna com código (numérico longo ou começa com 0)
        for (let c = 5; c <= 8; c++) {
          const v = String(row[c] || '').trim()
          if (v && v !== 'Cod. Barra' && /^\d{5,}/.test(v)) {
            barCode    = v
            description = String(row[c + 2] || '').trim()
            compl       = String(row[c + 5] || '').trim()
            situation   = String(row[c + 10] || '').trim()
            dtAquis     = formatDate(row[c + 13])
            vlrAquis    = String(row[c + 17] || '').trim()
            saldo       = String(row[c + 28] || '').trim()
            break
          }
        }

        if (!barCode || !description || description === 'Descr. Padrao') continue

        const dados = {
          codigo_barra:           barCode,
          descricao:              description,
          descricao_complementar: compl || null,
          tipo_bem:               extractType(description),
          situacao:               situation || 'Em uso',
          local:                  currentLocal || null,
          responsavel:            currentResponsavel || null,
          usuario_patrimonio:     null,
          unidade:                null,
          data_aquisicao:         dtAquis,
          valor_aquisicao:        vlrAquis || null,
          saldo_contabil:         saldo || null,
        }

        const { error } = await supabase.from('patrimonios').upsert(dados, { onConflict: 'codigo_barra' })
        if (error) erros++
        else inseridos++
      }

      setErroImport(`Importação concluída: ${inseridos} registros.${erros > 0 ? ` ${erros} erros.` : ''}`)
      carregar()
    } catch (e) {
      setErroImport('Erro ao importar: ' + e.message)
    }
    setImportando(false)
    e.target.value = ''
  }

  const trHover = { onMouseEnter: e => e.currentTarget.style.background='var(--subtle)', onMouseLeave: e => e.currentTarget.style.background='transparent' }

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Patrimônio</div>
          <div style={S.sub}>Gestão e controle de bens patrimoniais</div>
        </div>
        {isAdmin && (
          <div style={{ display:'flex', gap: 8 }}>
            <label style={{ ...S.btn, background:'var(--subtle)', color:'var(--text2)', border:'1px solid var(--border2)', cursor:'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {importando ? 'Importando...' : 'Importar Excel'}
              <input type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={importarExcel} disabled={importando} />
            </label>
            <button style={S.btn} onClick={abrirNovo}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo Bem
            </button>
          </div>
        )}
      </div>

      {erroImport && (
        <div style={{ ...S.erro, marginBottom: 16, color: erroImport.startsWith('Erro') ? 'var(--red)' : 'var(--green)', background: erroImport.startsWith('Erro') ? 'var(--red-dim)' : 'var(--green-dim)' }}>
          {erroImport}
        </div>
      )}

      {/* STATS */}
      <div style={S.stats}>
        {[
          ['var(--blue)',  itens.length,       'Total'],
          ['var(--green)', totalEmUso,          'Em uso'],
          ['var(--blue)',  totalDisponivel,      'Disponível'],
          ['var(--amber)', totalManutencao,      'Manutenção'],
          ['var(--red)',   itens.filter(i=>i.situacao==='Descartado').length, 'Descartados'],
        ].map(([cor, val, lbl]) => (
          <div key={lbl} style={S.statCard}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={S.toolbar}>
        <input style={S.search} placeholder="Buscar código, descrição, local, usuário..." value={busca} onChange={e => setBusca(e.target.value)} />
        {temFiltro && <button style={S.btnLimpar} onClick={limparFiltros}>limpar filtros</button>}
      </div>
      <div style={S.toolbar2}>
        <span style={{ fontSize:11, color:'var(--muted)', fontWeight:500 }}>Filtrar:</span>
        <select style={S.fselSm} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Tipo — todos</option>
          {TIPOS_BEM.map(t => <option key={t}>{t}</option>)}
        </select>
        <select style={S.fselSm} value={filtroSit} onChange={e => setFiltroSit(e.target.value)}>
          <option value="">Situação — todas</option>
          {SITUACOES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select style={S.fselSm} value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)}>
          <option value="">Local — todos</option>
          {locais.map(l => <option key={l}>{l}</option>)}
        </select>
        <select style={S.fselSm} value={filtroResp} onChange={e => setFiltroResp(e.target.value)}>
          <option value="">Responsável — todos</option>
          {resps.map(r => <option key={r}>{r}</option>)}
        </select>
        <span style={{ fontSize:11, color:'var(--muted)', marginLeft:'auto' }}>
          {filtrados.length} de {itens.length} registros
        </span>
      </div>

      {/* TABELA */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Código</th>
            <th style={S.th}>Descrição</th>
            <th style={S.th}>Tipo</th>
            <th style={S.th}>Local</th>
            <th style={S.th}>Responsável</th>
            <th style={S.th}>Usuário</th>
            <th style={S.th}>Situação</th>
            <th style={S.th}></th>
          </tr></thead>
          <tbody>
            {filtrados.map(item => {
              const cor = SIT_COR[item.situacao] || 'var(--muted)'
              return (
                <tr key={item.id} {...trHover}>
                  <td style={{ ...S.td, fontFamily:'DM Mono, monospace', color:'var(--blue)', fontWeight:500, fontSize:12 }}>
                    {item.codigo_barra}
                  </td>
                  <td style={{ ...S.td, color:'var(--text)', fontWeight:500, maxWidth:240 }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.descricao}</div>
                    {item.descricao_complementar && (
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.descricao_complementar}</div>
                    )}
                  </td>
                  <td style={S.td}>
                    {item.tipo_bem
                      ? <span style={S.chip('var(--blue-dim)','var(--blue)')}>{item.tipo_bem}</span>
                      : <span style={{ color:'var(--border2)' }}>—</span>}
                  </td>
                  <td style={{ ...S.td, fontSize:12 }}>{item.local || <span style={{ color:'var(--border2)' }}>—</span>}</td>
                  <td style={{ ...S.td, fontSize:12 }}>
                    {item.responsavel
                      ? <span style={S.chip('rgba(167,139,250,.1)','#a78bfa')}>{item.responsavel}</span>
                      : <span style={{ color:'var(--border2)' }}>—</span>}
                  </td>
                  <td style={{ ...S.td, fontSize:12 }}>
                    {item.usuario_patrimonio
                      ? <span style={S.chip('var(--green-dim)','var(--green)')}>{item.usuario_patrimonio}</span>
                      : <span style={{ color:'var(--border2)' }}>—</span>}
                  </td>
                  <td style={S.td}>
                    <span style={{ background:`${cor}18`, color:cor, padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600 }}>
                      ● {item.situacao || '—'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button style={S.btnGhost} onClick={() => abrirHistorico(item)} title="Histórico">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </button>
                      {isAdmin && <button style={S.btnSm} onClick={() => abrirEditar(item)}>Editar</button>}
                      {isAdmin && <button style={S.btnDanger} onClick={() => excluir(item.id)}>✕</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={8} style={{ ...S.td, textAlign:'center', padding:40, color:'var(--muted)' }}>
                {loading ? 'Carregando...' : 'Nenhum patrimônio encontrado.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL FORM (NOVO / EDITAR) ─────────────────────────────────────────── */}
      {(modal === 'novo' || modal === 'editar') && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{modal === 'novo' ? 'Novo Patrimônio' : 'Editar Patrimônio'}</div>
            {erro && <div style={S.erro}>{erro}</div>}

            <div style={S.sectionLabel}>Identificação</div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Código de Barra *</label>
                <input style={S.input} value={form.codigo_barra} onChange={e => setForm({...form, codigo_barra: e.target.value})} placeholder="Ex: 001234567" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Tipo de Bem</label>
                <select style={S.fsel} value={form.tipo_bem} onChange={e => setForm({...form, tipo_bem: e.target.value})}>
                  <option value="">Selecione...</option>
                  {TIPOS_BEM.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Descrição *</label>
              <textarea style={S.textarea} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} placeholder="Ex: Notebook Dell Inspiron 15" rows={2} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Descrição Complementar</label>
              <input style={S.input} value={form.descricao_complementar} onChange={e => setForm({...form, descricao_complementar: e.target.value})} placeholder="Informações adicionais" />
            </div>

            <div style={S.sectionLabel}>Localização e Responsabilidade</div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Local</label>
                <input style={S.input} value={form.local} onChange={e => setForm({...form, local: e.target.value})} placeholder="Ex: 4º Andar - Sala 402" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Unidade</label>
                <input style={S.input} value={form.unidade} onChange={e => setForm({...form, unidade: e.target.value})} placeholder="Ex: Sede Recife" />
              </div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Responsável</label>
                <input style={S.input} value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} placeholder="Quem responde pelo bem" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Usuário do Patrimônio</label>
                <input style={S.input} value={form.usuario_patrimonio} onChange={e => setForm({...form, usuario_patrimonio: e.target.value})} placeholder="Quem está utilizando" />
              </div>
            </div>

            <div style={S.sectionLabel}>Status e Aquisição</div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Situação</label>
                <select style={S.fsel} value={form.situacao} onChange={e => setForm({...form, situacao: e.target.value})}>
                  {SITUACOES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Data de Aquisição</label>
                <input type="date" style={S.input} value={form.data_aquisicao} onChange={e => setForm({...form, data_aquisicao: e.target.value})} />
              </div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Valor de Aquisição</label>
                <input style={S.input} value={form.valor_aquisicao} onChange={e => setForm({...form, valor_aquisicao: e.target.value})} placeholder="Ex: 2.500,00" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Saldo Contábil</label>
                <input style={S.input} value={form.saldo_contabil} onChange={e => setForm({...form, saldo_contabil: e.target.value})} placeholder="Ex: 1.800,00" />
              </div>
            </div>

            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModal(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL HISTÓRICO ───────────────────────────────────────────────────── */}
      {modal === 'historico' && itemSel && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ ...S.modalBox, maxWidth: 500 }}>
            <div style={S.modalTitle}>
              Histórico — {itemSel.codigo_barra}
              <div style={{ fontSize:12, fontWeight:400, color:'var(--muted)', marginTop:2 }}>{itemSel.descricao}</div>
            </div>
            {historico.length === 0 ? (
              <div style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'24px 0' }}>Nenhuma alteração registrada.</div>
            ) : historico.map(h => (
              <div key={h.id} style={S.histRow}>
                <div style={S.histDot('var(--blue)')} />
                <div style={S.histInfo}>
                  <strong style={{ color:'var(--text)' }}>{h.campo_alterado}</strong>
                  <span style={{ color:'var(--muted)' }}> · {new Date(h.created_at).toLocaleString('pt-BR')}</span>
                  <div>
                    <span style={{ color:'var(--red)', textDecoration:'line-through' }}>{h.valor_anterior || '(vazio)'}</span>
                    {' → '}
                    <span style={{ color:'var(--green)' }}>{h.valor_novo || '(vazio)'}</span>
                  </div>
                </div>
              </div>
            ))}
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
