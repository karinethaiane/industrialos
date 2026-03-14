import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const SITUACOES  = ['Em uso', 'Disponível', 'Em manutenção', 'Descartado']
const TIPOS_BEM  = ['Computador', 'Periférico', 'Móvel', 'Instrumento de Medição', 'Veículo', 'Outro']
const TIPOS_OCOR = ['Manutenção', 'Transferência', 'Empréstimo', 'Reimpressão de plaqueta', 'Outro']

const SIT_COR = {
  'Em uso': 'var(--green)', 'Disponível': 'var(--blue)',
  'Em manutenção': 'var(--amber)', 'Descartado': 'var(--red)',
}
const OCOR_COR = {
  'Manutenção': ['var(--amber-dim,rgba(245,158,11,.1))', 'var(--amber)'],
  'Transferência': ['var(--blue-dim)', 'var(--blue)'],
  'Empréstimo': ['rgba(167,139,250,.1)', '#a78bfa'],
  'Reimpressão de plaqueta': ['var(--red-dim)', 'var(--red)'],
  'Outro': ['var(--subtle)', 'var(--muted)'],
}

const formVazio = {
  codigo_barra: '', descricao: '', descricao_complementar: '',
  tipo_bem: '', situacao: 'Em uso', local: '', responsavel: '',
  usuario_patrimonio: '', unidade: '',
  data_aquisicao: '', valor_aquisicao: '', saldo_contabil: '',
}
const ocorVazio = {
  tipo: 'Manutenção', descricao: '', chamado: '',
  status: 'Aberto', data_abertura: '', data_resolucao: '',
}

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
  fselSmAtivo: { background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,.4)', borderRadius: 6, padding: '5px 10px', color: 'var(--blue)', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', height: 30, fontWeight: 600 },
  btn:         { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  btnSm:       { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger:   { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  btnLimpar:   { background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: '0 4px' },
  btnGhost:    { background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 },
  btnGreen:    { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 },
  tableWrap:   { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  td:          { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox:    { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle:  { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  modalSub:    { fontSize: 12, color: 'var(--muted)', marginBottom: 18 },
  field:       { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label:       { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input:       { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel:        { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  textarea:    { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', resize: 'vertical', minHeight: 72 },
  row:         { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro:        { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  sectionLabel:{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
  chip:        (bg, color) => ({ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: bg, color, marginRight: 4 }),
  abas:        { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 },
  aba:         (on) => ({ padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: `2px solid ${on ? 'var(--blue)' : 'transparent'}`, fontFamily: 'inherit', marginBottom: -1 }),
  ocorRow:     { display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' },
  ocorDot:     (c) => ({ width: 8, height: 8, borderRadius: '50%', background: c, marginTop: 6, flexShrink: 0 }),
  histRow:     { display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' },
  histDot:     { width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', marginTop: 5, flexShrink: 0 },
}

function fmtData(d) { if (!d) return '—'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') }

export default function Patrimonio({ isAdmin = false }) {
  const [aba, setAba]               = useState('bens')
  const [itens, setItens]           = useState([])
  const [todasOcor, setTodasOcor]   = useState([])
  const [filtroOcorTipo, setFiltroOcorTipo] = useState('')
  const [filtroOcorStatus, setFiltroOcorStatus] = useState('')
  const [loading, setLoading]       = useState(true)
  const [busca, setBusca]           = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSit, setFiltroSit]   = useState('')
  const [filtroLocal, setFiltroLocal] = useState('')
  const [filtroResp, setFiltroResp] = useState('')
  const [filtroUser, setFiltroUser] = useState('')
  const [modal, setModal]           = useState(false)
  const [itemSel, setItemSel]       = useState(null)
  const [form, setForm]             = useState(formVazio)
  const [historico, setHistorico]   = useState([])
  const [ocorrencias, setOcorrencias] = useState([])
  const [abaModal, setAbaModal]     = useState('ocorrencias')
  const [formOcor, setFormOcor]     = useState(ocorVazio)
  const [modalOcor, setModalOcor]   = useState(false)
  const [ocorSel, setOcorSel]       = useState(null)
  const [ocorDetalhe, setOcorDetalhe] = useState(null)
  const [salvando, setSalvando]     = useState(false)
  const [salvandoOcor, setSalvandoOcor] = useState(false)
  const [erro, setErro]             = useState('')
  const [erroOcor, setErroOcor]     = useState('')
  const [importando, setImportando] = useState(false)
  const [erroImport, setErroImport] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const [{ data: patrimonios }, { data: ocor }] = await Promise.all([
      supabase.from('patrimonios').select('*').order('descricao'),
      supabase.from('patrimonio_ocorrencias').select('*, patrimonios(codigo_barra, descricao, local, usuario_patrimonio)').order('created_at', { ascending: false }),
    ])
    setItens(patrimonios || [])
    setTodasOcor(ocor || [])
    setLoading(false)
  }

  const locais  = [...new Set(itens.map(i => i.local).filter(Boolean))].sort()
  const resps   = [...new Set(itens.map(i => i.responsavel).filter(Boolean))].sort()
  const usuarios = [...new Set(itens.map(i => i.usuario_patrimonio).filter(Boolean))].sort()
  const temFiltro = filtroTipo || filtroSit || filtroLocal || filtroResp || filtroUser

  const filtrados = itens.filter(i => {
    if (filtroTipo  && i.tipo_bem          !== filtroTipo)  return false
    if (filtroSit   && i.situacao          !== filtroSit)   return false
    if (filtroLocal && i.local             !== filtroLocal) return false
    if (filtroResp  && i.responsavel       !== filtroResp)  return false
    if (filtroUser  && i.usuario_patrimonio !== filtroUser)  return false
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

  function limparFiltros() {
    setFiltroTipo(''); setFiltroSit(''); setFiltroLocal('')
    setFiltroResp(''); setFiltroUser(''); setBusca('')
  }

  const totalEmUso      = itens.filter(i => i.situacao === 'Em uso').length
  const totalDisponivel = itens.filter(i => i.situacao === 'Disponível').length
  const totalManutencao = itens.filter(i => i.situacao === 'Em manutenção').length

  // ── CRUD patrimônio ──────────────────────────────────────────────────────────
  function abrirNovo() { setItemSel(null); setErro(''); setForm(formVazio); setModal('form') }

  function abrirEditar(item) {
    setItemSel(item); setErro('')
    setForm({
      codigo_barra: item.codigo_barra || '', descricao: item.descricao || '',
      descricao_complementar: item.descricao_complementar || '',
      tipo_bem: item.tipo_bem || '', situacao: item.situacao || 'Em uso',
      local: item.local || '', responsavel: item.responsavel || '',
      usuario_patrimonio: item.usuario_patrimonio || '', unidade: item.unidade || '',
      data_aquisicao: item.data_aquisicao || '', valor_aquisicao: item.valor_aquisicao || '',
      saldo_contabil: item.saldo_contabil || '',
    })
    setModal('form')
  }

  async function abrirOcorrencias(item) {
    setItemSel(item); setAbaModal('ocorrencias')
    const [{ data: ocor }, { data: hist }] = await Promise.all([
      supabase.from('patrimonio_ocorrencias').select('*').eq('patrimonio_id', item.id).order('created_at', { ascending: false }),
      supabase.from('patrimonio_historico').select('*').eq('patrimonio_id', item.id).order('created_at', { ascending: false }),
    ])
    setOcorrencias(ocor || [])
    setHistorico(hist || [])
    setModal('ocorrencias')
  }

  async function salvar() {
    if (!form.codigo_barra.trim() || !form.descricao.trim()) {
      setErro('Código de barra e Descrição são obrigatórios.'); return
    }
    setSalvando(true); setErro('')
    const dados = {
      codigo_barra: form.codigo_barra.trim(), descricao: form.descricao.trim(),
      descricao_complementar: form.descricao_complementar.trim() || null,
      tipo_bem: form.tipo_bem || null, situacao: form.situacao || 'Em uso',
      local: form.local.trim() || null, responsavel: form.responsavel.trim() || null,
      usuario_patrimonio: form.usuario_patrimonio.trim() || null,
      unidade: form.unidade.trim() || null,
      data_aquisicao: form.data_aquisicao || null,
      valor_aquisicao: form.valor_aquisicao.trim() || null,
      saldo_contabil: form.saldo_contabil.trim() || null,
    }
    let error
    if (modal === 'form' && itemSel) {
      for (const campo of Object.keys(dados)) {
        const ant = itemSel[campo]; const nov = dados[campo]
        if (String(ant ?? '') !== String(nov ?? '')) {
          await supabase.from('patrimonio_historico').insert({ patrimonio_id: itemSel.id, campo_alterado: campo, valor_anterior: ant ?? null, valor_novo: nov ?? null })
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
    if (!confirm('Excluir este patrimônio?')) return
    await supabase.from('patrimonio_ocorrencias').delete().eq('patrimonio_id', id)
    await supabase.from('patrimonio_historico').delete().eq('patrimonio_id', id)
    await supabase.from('patrimonios').delete().eq('id', id)
    carregar()
  }

  // ── CRUD ocorrências ─────────────────────────────────────────────────────────
  function abrirNovaOcor() {
    setOcorSel(null); setErroOcor('')
    setFormOcor({ ...ocorVazio, data_abertura: new Date().toISOString().split('T')[0] })
    setModalOcor(true)
  }

  function abrirEditarOcor(ocor) {
    setOcorSel(ocor); setErroOcor('')
    setFormOcor({
      tipo: ocor.tipo, descricao: ocor.descricao, chamado: ocor.chamado || '',
      status: ocor.status, data_abertura: ocor.data_abertura || '', data_resolucao: ocor.data_resolucao || '',
    })
    setModalOcor(true)
  }

  async function salvarOcor() {
    if (!formOcor.descricao.trim()) { setErroOcor('Descrição é obrigatória.'); return }
    setSalvandoOcor(true); setErroOcor('')
    const dados = {
      patrimonio_id: itemSel.id, tipo: formOcor.tipo,
      descricao: formOcor.descricao.trim(),
      chamado: formOcor.chamado.trim() || null,
      status: formOcor.status,
      data_abertura: formOcor.data_abertura || null,
      data_resolucao: formOcor.status === 'Resolvido' ? (formOcor.data_resolucao || null) : null,
    }
    let error
    if (ocorSel) {
      ;({ error } = await supabase.from('patrimonio_ocorrencias').update(dados).eq('id', ocorSel.id))
    } else {
      ;({ error } = await supabase.from('patrimonio_ocorrencias').insert(dados))
    }
    setSalvandoOcor(false)
    if (error) { setErroOcor('Erro: ' + error.message); return }
    setModalOcor(false)
    const [{ data: ocorItem }, { data: ocorTodas }] = await Promise.all([
      supabase.from('patrimonio_ocorrencias').select('*').eq('patrimonio_id', itemSel.id).order('created_at', { ascending: false }),
      supabase.from('patrimonio_ocorrencias').select('*, patrimonios(codigo_barra, descricao, local, usuario_patrimonio)').order('created_at', { ascending: false }),
    ])
    setOcorrencias(ocorItem || [])
    setTodasOcor(ocorTodas || [])
  }

  async function excluirOcor(id) {
    if (!confirm('Excluir esta ocorrência?')) return
    await supabase.from('patrimonio_ocorrencias').delete().eq('id', id)
    const [{ data: ocorItem }, { data: ocorTodas }] = await Promise.all([
      supabase.from('patrimonio_ocorrencias').select('*').eq('patrimonio_id', itemSel.id).order('created_at', { ascending: false }),
      supabase.from('patrimonio_ocorrencias').select('*, patrimonios(codigo_barra, descricao, local, usuario_patrimonio)').order('created_at', { ascending: false }),
    ])
    setOcorrencias(ocorItem || [])
    setTodasOcor(ocorTodas || [])
  }

  async function excluirOcorGlobal(o) {
    if (!confirm('Excluir esta ocorrência?')) return
    await supabase.from('patrimonio_ocorrencias').delete().eq('id', o.id)
    const { data } = await supabase.from('patrimonio_ocorrencias').select('*, patrimonios(codigo_barra, descricao, local, usuario_patrimonio)').order('created_at', { ascending: false })
    setTodasOcor(data || [])
  }

  // ── IMPORTAÇÃO ───────────────────────────────────────────────────────────────
  async function importarExcel(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true); setErroImport('')
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const buf  = await file.arrayBuffer()
      const wb   = XLSX.read(new Uint8Array(buf), { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 })

      const extractType = (desc) => {
        const d = (desc || '').toUpperCase()
        if (d.includes('NOTEBOOK') || d.includes('DESKTOP') || d.includes('COMPUTADOR')) return 'Computador'
        if (d.includes('MONITOR') || d.includes('TECLADO') || d.includes('MOUSE') || d.includes('IMPRESSORA') || d.includes('SCANNER')) return 'Periférico'
        if (d.includes('MULTÍMETRO') || d.includes('ANALISADOR') || d.includes('MEDIDOR')) return 'Instrumento de Medição'
        if (d.includes('MESA') || d.includes('CADEIRA') || d.includes('ARMÁRIO') || d.includes('ESTANTE')) return 'Móvel'
        return 'Outro'
      }
      const formatDate = (v) => {
        if (!v) return null
        if (typeof v === 'number') return new Date((v - 25569) * 86400 * 1000).toISOString().split('T')[0]
        if (typeof v === 'string') {
          const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})/)
          if (m) return `${m[3]}-${m[2]}-${m[1]}`
          if (/\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
        }
        return null
      }

      let inseridos = 0, erros = 0
      let currentResponsavel = '', currentLocal = ''
      let dataStart = 38
      for (let i = 30; i < 50; i++) {
        const row = rawData[i]
        if (row && row.some(c => String(c || '').includes('Cod. Barra'))) { dataStart = i + 1; break }
      }

      for (let i = dataStart; i < rawData.length; i++) {
        const row = rawData[i]
        if (!row || row.length === 0) continue
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
        if (rowStr.includes('Total do') || rowStr.includes('Total da') || rowStr.includes('Total de')) continue
        let barCode = '', description = '', compl = '', situation = '', dtAquis = null, vlrAquis = '', saldo = ''
        for (let c = 5; c <= 8; c++) {
          const v = String(row[c] || '').trim()
          if (v && v !== 'Cod. Barra' && /^\d{5,}/.test(v)) {
            barCode = v; description = String(row[c + 2] || '').trim()
            compl = String(row[c + 5] || '').trim(); situation = String(row[c + 10] || '').trim()
            dtAquis = formatDate(row[c + 13]); vlrAquis = String(row[c + 17] || '').trim()
            saldo = String(row[c + 28] || '').trim(); break
          }
        }
        if (!barCode || !description || description === 'Descr. Padrao') continue
        const dados = {
          codigo_barra: barCode, descricao: description,
          descricao_complementar: compl || null, tipo_bem: extractType(description),
          situacao: situation || 'Em uso', local: currentLocal || null,
          responsavel: currentResponsavel || null, usuario_patrimonio: null,
          unidade: null, data_aquisicao: dtAquis,
          valor_aquisicao: vlrAquis || null, saldo_contabil: saldo || null,
        }
        const { error } = await supabase.from('patrimonios').upsert(dados, { onConflict: 'codigo_barra' })
        if (error) erros++; else inseridos++
      }
      setErroImport(`Importação concluída: ${inseridos} registros.${erros > 0 ? ` ${erros} erros.` : ''}`)
      carregar()
    } catch (err) {
      setErroImport('Erro ao importar: ' + err.message)
    }
    setImportando(false); e.target.value = ''
  }

  const trHover = { onMouseEnter: e => e.currentTarget.style.background='var(--subtle)', onMouseLeave: e => e.currentTarget.style.background='transparent' }

  // ── Dados derivados ─────────────────────────────────────────────────────────
  const ocorAbertas = todasOcor.filter(o => o.status === 'Aberto')
  const resumoOcor = {
    'Manutenção':             ocorAbertas.filter(o => o.tipo === 'Manutenção').length,
    'Reimpressão de plaqueta':ocorAbertas.filter(o => o.tipo === 'Reimpressão de plaqueta').length,
    'Empréstimo':             ocorAbertas.filter(o => o.tipo === 'Empréstimo').length,
    'Transferência':          ocorAbertas.filter(o => o.tipo === 'Transferência').length,
  }
  const ocorFiltradas = todasOcor.filter(o => {
    if (filtroOcorTipo   && o.tipo   !== filtroOcorTipo)   return false
    if (filtroOcorStatus && o.status !== filtroOcorStatus) return false
    return true
  })
  const OCOR_RESUMO_COR = {
    'Manutenção':              ['rgba(245,158,11,.1)', 'var(--amber)'],
    'Reimpressão de plaqueta': ['var(--red-dim)',      'var(--red)'],
    'Empréstimo':              ['rgba(167,139,250,.1)','#a78bfa'],
    'Transferência':           ['var(--blue-dim)',     'var(--blue)'],
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Patrimônio</div>
          <div style={S.sub}>Gestão e controle de bens patrimoniais</div>
        </div>
        {isAdmin && (
          <div style={{ display:'flex', gap:8 }}>
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
        <div style={{ ...S.erro, marginBottom:16, color: erroImport.startsWith('Erro') ? 'var(--red)' : 'var(--green)', background: erroImport.startsWith('Erro') ? 'var(--red-dim)' : 'var(--green-dim)' }}>
          {erroImport}
        </div>
      )}

      {/* ABAS PRINCIPAIS */}
      <div style={S.abas}>
        <button style={S.aba(aba === 'bens')} onClick={() => setAba('bens')}>Bens</button>
        <button style={S.aba(aba === 'ocorrencias')} onClick={() => setAba('ocorrencias')}>
          Ocorrências
          {ocorAbertas.length > 0 && (
            <span style={{ marginLeft:6, background:'rgba(245,158,11,.15)', color:'var(--amber)', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>
              {ocorAbertas.length} {ocorAbertas.length === 1 ? 'aberta' : 'abertas'}
            </span>
          )}
        </button>
      </div>

      {/* ══ ABA BENS ══════════════════════════════════════════════════════════ */}
      {aba === 'bens' && (<>

      {/* CARD RESUMO — só aparece se houver ocorrências abertas */}
      {ocorAbertas.length > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 18px', marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em' }}>
              Ocorrências abertas
            </span>
            <button style={{ ...S.btnSm, fontSize:11 }} onClick={() => setAba('ocorrencias')}>Ver todas →</button>
          </div>
          {/* Contadores por tipo */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
            {Object.entries(resumoOcor).map(([tipo, qtd]) => {
              const [bg, cor] = OCOR_RESUMO_COR[tipo] || ['var(--subtle)','var(--muted)']
              return (
                <div key={tipo} style={{ background: qtd > 0 ? bg : 'var(--subtle)', borderRadius:8, padding:'10px 12px', opacity: qtd === 0 ? .4 : 1 }}>
                  <div style={{ fontFamily:'DM Mono, monospace', fontSize:20, fontWeight:500, color: qtd > 0 ? cor : 'var(--muted)', lineHeight:1, marginBottom:3 }}>{qtd}</div>
                  <div style={{ fontSize:10, color: qtd > 0 ? cor : 'var(--muted)', fontWeight:600 }}>{tipo}</div>
                </div>
              )
            })}
          </div>
          {/* Mini lista das abertas (máx 4) */}
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:10 }}>
            {ocorAbertas.slice(0, 4).map(o => {
              const [, cor] = OCOR_RESUMO_COR[o.tipo] || ['var(--subtle)','var(--muted)']
              return (
                <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', minWidth:0 }}>
                    <span style={{ ...S.chip('var(--subtle)', cor), flexShrink:0 }}>{o.tipo}</span>
                    <span style={{ fontSize:12, color:'var(--text)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {o.patrimonios?.descricao || '—'}
                    </span>
                    <span style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'var(--blue)', flexShrink:0 }}>
                      {o.patrimonios?.codigo_barra}
                    </span>
                  </div>
                  <span style={{ fontSize:11, color:'var(--muted)', flexShrink:0, marginLeft:8 }}>
                    {o.data_abertura ? new Date(o.data_abertura + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
              )
            })}
            {ocorAbertas.length > 4 && (
              <div style={{ paddingTop:8, fontSize:11, color:'var(--muted)', textAlign:'center' }}>
                + {ocorAbertas.length - 4} outras ocorrências abertas
              </div>
            )}
          </div>
        </div>
      )}

      <div style={S.stats}>
        {[['var(--blue)', itens.length, 'Total'], ['var(--green)', totalEmUso, 'Em uso'], ['var(--blue)', totalDisponivel, 'Disponível'], ['var(--amber)', totalManutencao, 'Manutenção'], ['var(--red)', itens.filter(i=>i.situacao==='Descartado').length, 'Descartados']].map(([cor, val, lbl]) => (
          <div key={lbl} style={S.statCard}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

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
        <select style={filtroUser ? S.fselSmAtivo : S.fselSm} value={filtroUser} onChange={e => setFiltroUser(e.target.value)}>
          <option value="">Usuário — todos</option>
          {usuarios.map(u => <option key={u}>{u}</option>)}
        </select>
        <span style={{ fontSize:11, color:'var(--muted)', marginLeft:'auto' }}>
          {filtrados.length} de {itens.length} registros
        </span>
      </div>

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
                  <td style={{ ...S.td, fontFamily:'DM Mono, monospace', color:'var(--blue)', fontWeight:500, fontSize:12 }}>{item.codigo_barra}</td>
                  <td style={{ ...S.td, color:'var(--text)', fontWeight:500, maxWidth:220 }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.descricao}</div>
                    {item.descricao_complementar && <div style={{ fontSize:11, color:'var(--muted)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.descricao_complementar}</div>}
                  </td>
                  <td style={S.td}>{item.tipo_bem ? <span style={S.chip('var(--blue-dim)','var(--blue)')}>{item.tipo_bem}</span> : <span style={{ color:'var(--border2)' }}>—</span>}</td>
                  <td style={{ ...S.td, fontSize:12 }}>{item.local || <span style={{ color:'var(--border2)' }}>—</span>}</td>
                  <td style={{ ...S.td, fontSize:12 }}>{item.responsavel ? <span style={S.chip('rgba(167,139,250,.1)','#a78bfa')}>{item.responsavel}</span> : <span style={{ color:'var(--border2)' }}>—</span>}</td>
                  <td style={{ ...S.td, fontSize:12 }}>{item.usuario_patrimonio ? <span style={S.chip('var(--green-dim)','var(--green)')}>{item.usuario_patrimonio}</span> : <span style={{ color:'var(--border2)' }}>—</span>}</td>
                  <td style={S.td}><span style={{ background:`${cor}18`, color:cor, padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600 }}>● {item.situacao || '—'}</span></td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button style={S.btnGhost} onClick={() => abrirOcorrencias(item)}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Ocorrências
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

      </>)}

      {/* ══ ABA OCORRÊNCIAS ═══════════════════════════════════════════════════ */}
      {aba === 'ocorrencias' && (
        <div>
          <div style={S.toolbar2}>
            <span style={{ fontSize:11, color:'var(--muted)', fontWeight:500 }}>Filtrar:</span>
            <select style={S.fselSm} value={filtroOcorTipo} onChange={e => setFiltroOcorTipo(e.target.value)}>
              <option value="">Tipo — todos</option>
              {TIPOS_OCOR.map(t => <option key={t}>{t}</option>)}
            </select>
            <select style={S.fselSm} value={filtroOcorStatus} onChange={e => setFiltroOcorStatus(e.target.value)}>
              <option value="">Status — todos</option>
              <option>Aberto</option>
              <option>Resolvido</option>
            </select>
            {(filtroOcorTipo || filtroOcorStatus) && (
              <button style={S.btnLimpar} onClick={() => { setFiltroOcorTipo(''); setFiltroOcorStatus('') }}>limpar</button>
            )}
            <span style={{ fontSize:11, color:'var(--muted)', marginLeft:'auto' }}>
              {ocorFiltradas.length} de {todasOcor.length} ocorrências
            </span>
          </div>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>Data</th>
                <th style={S.th}>Tipo</th>
                <th style={S.th}>Bem</th>
                <th style={S.th}>Local · Usuário</th>
                <th style={S.th}>Descrição</th>
                <th style={S.th}>Chamado</th>
                <th style={S.th}>Status</th>
                <th style={S.th}></th>
              </tr></thead>
              <tbody>
                {ocorFiltradas.map(o => {
                  const [bg, cor] = OCOR_COR[o.tipo] || OCOR_COR['Outro']
                  return (
                    <tr key={o.id} onMouseEnter={e => e.currentTarget.style.background='var(--subtle)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ ...S.td, fontFamily:'DM Mono, monospace', fontSize:11, whiteSpace:'nowrap' }}>{fmtData(o.data_abertura)}</td>
                      <td style={S.td}><span style={S.chip(bg, cor)}>{o.tipo}</span></td>
                      <td style={{ ...S.td, color:'var(--text)', fontWeight:500, maxWidth:180 }}>
                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {o.patrimonios?.descricao || '—'}
                        </div>
                      </td>
                      <td style={{ ...S.td, fontSize:11 }}>
                        <div style={{ color:'var(--text2)' }}>{o.patrimonios?.local || <span style={{ color:'var(--border2)' }}>—</span>}</div>
                        {o.patrimonios?.usuario_patrimonio && (
                          <div style={{ marginTop:2 }}><span style={S.chip('var(--green-dim)','var(--green)')}>{o.patrimonios.usuario_patrimonio}</span></div>
                        )}
                      </td>
                      <td style={{ ...S.td, maxWidth:200 }}>
                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.descricao}</div>
                      </td>
                      <td style={{ ...S.td, fontFamily:'DM Mono, monospace', fontSize:11 }}>
                        {o.chamado || <span style={{ color:'var(--border2)' }}>—</span>}
                      </td>
                      <td style={S.td}>
                        <span style={{ background: o.status === 'Aberto' ? 'rgba(245,158,11,.1)' : 'var(--green-dim)', color: o.status === 'Aberto' ? 'var(--amber)' : 'var(--green)', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display:'flex', gap:4 }}>
                          <button style={S.btnGhost} title="Detalhes" onClick={() => setOcorDetalhe(o)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          </button>
                          {isAdmin && <button style={S.btnSm} onClick={() => { setItemSel(itens.find(i => i.id === o.patrimonio_id) || { id: o.patrimonio_id, descricao: o.patrimonios?.descricao }); abrirEditarOcor(o) }}>Editar</button>}
                          {isAdmin && <button style={S.btnDanger} onClick={() => excluirOcorGlobal(o)}>✕</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {ocorFiltradas.length === 0 && (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign:'center', padding:40, color:'var(--muted)' }}>
                    Nenhuma ocorrência encontrada.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL FORM ──────────────────────────────────────────────────────────── */}
      {modal === 'form' && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{itemSel ? 'Editar Patrimônio' : 'Novo Patrimônio'}</div>
            {erro && <div style={S.erro}>{erro}</div>}

            <div style={S.sectionLabel}>Identificação</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Código de Barra *</label><input style={S.input} value={form.codigo_barra} onChange={e => setForm({...form, codigo_barra: e.target.value})} placeholder="Ex: 001234567" /></div>
              <div style={S.field}><label style={S.label}>Tipo de Bem</label>
                <select style={S.fsel} value={form.tipo_bem} onChange={e => setForm({...form, tipo_bem: e.target.value})}>
                  <option value="">Selecione...</option>
                  {TIPOS_BEM.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={S.field}><label style={S.label}>Descrição *</label><textarea style={S.textarea} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} placeholder="Ex: Notebook Dell Inspiron 15" rows={2} /></div>
            <div style={S.field}><label style={S.label}>Descrição Complementar</label><input style={S.input} value={form.descricao_complementar} onChange={e => setForm({...form, descricao_complementar: e.target.value})} placeholder="Informações adicionais" /></div>

            <div style={S.sectionLabel}>Localização e Responsabilidade</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Local</label><input style={S.input} value={form.local} onChange={e => setForm({...form, local: e.target.value})} placeholder="Ex: 4º Andar - Sala 402" /></div>
              <div style={S.field}><label style={S.label}>Unidade</label><input style={S.input} value={form.unidade} onChange={e => setForm({...form, unidade: e.target.value})} placeholder="Ex: Sede Recife" /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Responsável</label><input style={S.input} value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} placeholder="Quem responde pelo bem" /></div>
              <div style={S.field}><label style={S.label}>Usuário do Patrimônio</label><input style={S.input} value={form.usuario_patrimonio} onChange={e => setForm({...form, usuario_patrimonio: e.target.value})} placeholder="Quem está utilizando" /></div>
            </div>

            <div style={S.sectionLabel}>Status e Aquisição</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Situação</label>
                <select style={S.fsel} value={form.situacao} onChange={e => setForm({...form, situacao: e.target.value})}>
                  {SITUACOES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Data de Aquisição</label><input type="date" style={S.input} value={form.data_aquisicao} onChange={e => setForm({...form, data_aquisicao: e.target.value})} /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Valor de Aquisição</label><input style={S.input} value={form.valor_aquisicao} onChange={e => setForm({...form, valor_aquisicao: e.target.value})} placeholder="Ex: 2.500,00" /></div>
              <div style={S.field}><label style={S.label}>Saldo Contábil</label><input style={S.input} value={form.saldo_contabil} onChange={e => setForm({...form, saldo_contabil: e.target.value})} placeholder="Ex: 1.800,00" /></div>
            </div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModal(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL OCORRÊNCIAS ───────────────────────────────────────────────────── */}
      {modal === 'ocorrencias' && itemSel && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ ...S.modalBox, maxWidth: 560 }}>
            <div style={S.modalTitle}>{itemSel.descricao}</div>
            <div style={S.modalSub}>{itemSel.codigo_barra}{itemSel.local ? ` · ${itemSel.local}` : ''}</div>

            <div style={S.abas}>
              <button style={S.aba(abaModal === 'ocorrencias')} onClick={() => setAbaModal('ocorrencias')}>Ocorrências</button>
              <button style={S.aba(abaModal === 'historico')} onClick={() => setAbaModal('historico')}>Histórico de edições</button>
            </div>

            {/* ABA OCORRÊNCIAS */}
            {abaModal === 'ocorrencias' && (<>
              {isAdmin && (
                <button style={{ ...S.btnGreen, marginBottom: 14, fontSize: 12 }} onClick={abrirNovaOcor}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nova ocorrência
                </button>
              )}
              {ocorrencias.length === 0 ? (
                <div style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'24px 0' }}>Nenhuma ocorrência registrada.</div>
              ) : ocorrencias.map(o => {
                const [bg, cor] = OCOR_COR[o.tipo] || OCOR_COR['Outro']
                return (
                  <div key={o.id} style={S.ocorRow}>
                    <div style={S.ocorDot(cor)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 5 }}>
                        <div style={{ display:'flex', gap: 6, alignItems:'center' }}>
                          <span style={S.chip(bg, cor)}>{o.tipo}</span>
                          <span style={S.chip(o.status === 'Aberto' ? 'rgba(245,158,11,.1)' : 'var(--green-dim)', o.status === 'Aberto' ? 'var(--amber)' : 'var(--green)')}>
                            {o.status}
                          </span>
                        </div>
                        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                          <span style={{ fontSize:11, color:'var(--muted)' }}>{fmtData(o.data_abertura)}</span>
                          {isAdmin && <>
                            <button style={S.btnSm} onClick={() => abrirEditarOcor(o)}>Editar</button>
                            <button style={S.btnDanger} onClick={() => excluirOcor(o.id)}>✕</button>
                          </>}
                        </div>
                      </div>
                      <div style={{ fontSize:13, color:'var(--text)', marginBottom: 4 }}>{o.descricao}</div>
                      {o.chamado && <div style={{ fontSize:11, color:'var(--muted)' }}>Chamado: <span style={{ fontFamily:'DM Mono, monospace', color:'var(--text2)' }}>{o.chamado}</span></div>}
                      {o.data_resolucao && <div style={{ fontSize:11, color:'var(--muted)' }}>Resolvido em: {fmtData(o.data_resolucao)}</div>}
                    </div>
                  </div>
                )
              })}
            </>)}

            {/* ABA HISTÓRICO */}
            {abaModal === 'historico' && (<>
              {historico.length === 0 ? (
                <div style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'24px 0' }}>Nenhuma alteração registrada.</div>
              ) : historico.map(h => (
                <div key={h.id} style={S.histRow}>
                  <div style={S.histDot} />
                  <div style={{ flex:1, fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>
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
            </>)}

            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NOVA/EDITAR OCORRÊNCIA ─────────────────────────────────────────── */}
      {modalOcor && (
        <div style={{ ...S.modal, zIndex: 110 }} onClick={e => e.target === e.currentTarget && setModalOcor(false)}>
          <div style={{ ...S.modalBox, maxWidth: 480 }}>
            <div style={S.modalTitle}>{ocorSel ? 'Editar Ocorrência' : 'Nova Ocorrência'}</div>
            <div style={S.modalSub}>{itemSel?.descricao}</div>
            {erroOcor && <div style={S.erro}>{erroOcor}</div>}

            <div style={S.field}><label style={S.label}>Tipo de ocorrência</label>
              <select style={S.fsel} value={formOcor.tipo} onChange={e => setFormOcor({...formOcor, tipo: e.target.value})}>
                {TIPOS_OCOR.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data de abertura</label><input type="date" style={S.input} value={formOcor.data_abertura} onChange={e => setFormOcor({...formOcor, data_abertura: e.target.value})} /></div>
              <div style={S.field}><label style={S.label}>Nº do chamado (opcional)</label><input style={S.input} value={formOcor.chamado} onChange={e => setFormOcor({...formOcor, chamado: e.target.value})} placeholder="Ex: CHM-2026-0042" /></div>
            </div>
            <div style={S.field}><label style={S.label}>Descrição *</label><textarea style={S.textarea} value={formOcor.descricao} onChange={e => setFormOcor({...formOcor, descricao: e.target.value})} placeholder="Descreva a ocorrência..." /></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Status</label>
                <select style={S.fsel} value={formOcor.status} onChange={e => setFormOcor({...formOcor, status: e.target.value})}>
                  <option>Aberto</option>
                  <option>Resolvido</option>
                </select>
              </div>
              <div style={{ ...S.field, opacity: formOcor.status === 'Resolvido' ? 1 : .4 }}>
                <label style={S.label}>Data de resolução</label>
                <input type="date" style={S.input} value={formOcor.data_resolucao} disabled={formOcor.status !== 'Resolvido'} onChange={e => setFormOcor({...formOcor, data_resolucao: e.target.value})} />
              </div>
            </div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalOcor(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvarOcor} disabled={salvandoOcor}>{salvandoOcor ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALHE OCORRÊNCIA ─────────────────────────────────────────── */}
      {ocorDetalhe && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setOcorDetalhe(null)}>
          <div style={{ ...S.modalBox, maxWidth: 460 }}>
            <div style={S.modalTitle}>Detalhes da Ocorrência</div>
            <div style={S.modalSub}>{ocorDetalhe.patrimonios?.descricao} · <span style={{ fontFamily:'DM Mono, monospace', color:'var(--blue)' }}>{ocorDetalhe.patrimonios?.codigo_barra}</span></div>

            {/* Tipo + Status */}
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {(() => { const [bg,cor] = OCOR_COR[ocorDetalhe.tipo]||OCOR_COR['Outro']; return <span style={S.chip(bg,cor)}>{ocorDetalhe.tipo}</span> })()}
              <span style={{ background: ocorDetalhe.status==='Aberto'?'rgba(245,158,11,.1)':'var(--green-dim)', color: ocorDetalhe.status==='Aberto'?'var(--amber)':'var(--green)', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>{ocorDetalhe.status}</span>
            </div>

            {/* Bem */}
            <div style={S.sectionLabel}>Bem patrimonial</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Local</div>
                <div style={{ fontSize:13, color:'var(--text)' }}>{ocorDetalhe.patrimonios?.local || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Usuário</div>
                <div style={{ fontSize:13, color:'var(--text)' }}>
                  {ocorDetalhe.patrimonios?.usuario_patrimonio
                    ? <span style={S.chip('var(--green-dim)','var(--green)')}>{ocorDetalhe.patrimonios.usuario_patrimonio}</span>
                    : '—'}
                </div>
              </div>
            </div>

            {/* Ocorrência */}
            <div style={S.sectionLabel}>Ocorrência</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Data de abertura</div>
                <div style={{ fontSize:13, color:'var(--text)' }}>{fmtData(ocorDetalhe.data_abertura)}</div>
              </div>
              {ocorDetalhe.chamado && (
                <div>
                  <div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Nº do chamado</div>
                  <div style={{ fontFamily:'DM Mono, monospace', fontSize:13, color:'var(--text)' }}>{ocorDetalhe.chamado}</div>
                </div>
              )}
              {ocorDetalhe.data_resolucao && (
                <div>
                  <div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:3 }}>Resolvido em</div>
                  <div style={{ fontSize:13, color:'var(--green)' }}>{fmtData(ocorDetalhe.data_resolucao)}</div>
                </div>
              )}
            </div>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:'var(--muted)', fontWeight:500, marginBottom:6 }}>Descrição</div>
              <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.6, background:'var(--surface2)', borderRadius:7, padding:'10px 12px' }}>{ocorDetalhe.descricao}</div>
            </div>

            <div style={S.row}>
              {isAdmin && <button style={S.btnSm} onClick={() => { setItemSel(itens.find(i => i.id === ocorDetalhe.patrimonio_id) || { id: ocorDetalhe.patrimonio_id, descricao: ocorDetalhe.patrimonios?.descricao }); abrirEditarOcor(ocorDetalhe); setOcorDetalhe(null) }}>Editar</button>}
              <button style={S.btnSm} onClick={() => setOcorDetalhe(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}