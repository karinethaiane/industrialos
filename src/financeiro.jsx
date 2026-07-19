import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  wrap:         { padding: 32, background: 'var(--bg)', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:        { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub:          { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  stats:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 22 },
  statCard:     { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px var(--shadow)' },
  statBar:      (cor) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: cor, opacity: .5 }),
  statVal:      (cor) => ({ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 500, color: cor, lineHeight: 1, marginBottom: 5 }),
  statLbl:      { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },
  tabs:         { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 },
  tab:          (on) => ({ padding: '9px 20px', fontSize: 13, fontWeight: on ? 600 : 500, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: on ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, fontFamily: 'inherit', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 7 }),
  tabCount:     (on) => ({ padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)' }),
  tabCountTeal: (on) => ({ padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: on ? 'rgba(13,148,136,.15)' : 'var(--subtle)', color: on ? '#0d9488' : 'var(--text2)' }),
  toolbar:      { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  search:       { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 260 },
  filtro:       (on) => ({ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'rgba(99,102,241,.25)' : 'var(--border2)'}`, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)', fontFamily: 'inherit' }),
  filtroConsultoria: (on) => ({ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'rgba(167,139,250,.3)' : 'var(--border2)'}`, background: on ? 'rgba(167,139,250,.1)' : 'var(--subtle)', color: on ? '#a78bfa' : 'var(--text2)', fontFamily: 'inherit' }),
  fselSm:       { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '5px 10px', color: 'var(--text2)', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', height: 30 },
  btn:          { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' },
  btnTeal:      { background: 'rgba(13,148,136,.1)', color: '#0d9488', border: '1px solid rgba(13,148,136,.25)', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' },
  btnSm:        { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger:    { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  btnObs:       { background: 'rgba(167,139,250,.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,.2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDet:       { background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDetTeal:   { background: 'rgba(13,148,136,.08)', color: '#0d9488', border: '1px solid rgba(13,148,136,.2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  tableWrap:    { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px var(--shadow)' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { textAlign: 'left', padding: '10px 14px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  td:           { padding: '11px 14px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal:        { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox:     { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalBoxSm:   { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 420, boxShadow: '0 8px 32px var(--shadow)' },
  modalBoxDet:  { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, padding: 28, width: '90%', maxWidth: 480, boxShadow: '0 8px 40px var(--shadow)' },
  modalTitle:   { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 18 },
  field:        { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label:        { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input:        { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel:         { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  textarea:     { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', minHeight: 70, resize: 'vertical' },
  row:          { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro:         { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  totalBox:     { background: 'var(--blue-dim)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionLbl:   { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
}

const STATUS_NF  = ['Em execução', 'Concluído']
const STATUS_PAG = ['aguardando_abertura_chamado', 'em_andamento', 'ajustes', 'aguardando_desbloqueio', 'concluido', 'cancelado']
const STATUS_PAG_LABEL = {
  aguardando_abertura_chamado: 'Ag. Abertura Chamado',
  em_andamento:                'Em andamento',
  ajustes:                     'Ajustes',
  aguardando_desbloqueio:      'Aguard. Desbloqueio',
  concluido:                   'Concluído',
  cancelado:                   'Cancelado',
}
const STATUS_PAG_COR = {
  aguardando_abertura_chamado: 'var(--purple)',
  em_andamento:                'var(--blue)',
  ajustes:                     'var(--amber)',
  aguardando_desbloqueio:      'var(--red)',
  concluido:                   'var(--green)',
  cancelado:                   'var(--muted)',
}
const STATUS_GRUPO_AREA = {
  aguardando_abertura_chamado: 'Solicitante',
  em_andamento:                'Financeiro',
  ajustes:                     'Solicitante',
  aguardando_desbloqueio:      'Gerência',
  concluido:                   'Financeiro',
  cancelado:                   'Financeiro',
}
const GRUPO_AREA_COR    = { Financeiro: 'var(--blue)', Solicitante: 'var(--amber)', 'Gerência': 'var(--red)' }
const GRUPOS_AREAS_LISTA = [...new Set(Object.values(STATUS_GRUPO_AREA))]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtData(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
function fmtVal(v)  { if (!v && v !== 0) return '—'; return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

function statusNfBadge(s) {
  const cfg = { 'Em execução': ['var(--blue-dim)', 'var(--blue)'], 'Concluído': ['var(--green-dim)', 'var(--green)'] }[s] || ['var(--subtle)', 'var(--muted)']
  return <span style={{ background: cfg[0], color: cfg[1], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>● {s}</span>
}
function statusPagBadge(s) {
  const cor = STATUS_PAG_COR[s] || 'var(--muted)'
  return <span style={{ background: `${cor}18`, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>● {STATUS_PAG_LABEL[s] || s}</span>
}
function responsavelBadge(s) {
  const resp = STATUS_GRUPO_AREA[s] || '—'
  const cor  = GRUPO_AREA_COR[resp]  || 'var(--muted)'
  return <span style={{ background: `${cor}12`, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{resp}</span>
}
function grupoAreaBadge(s) {
  return responsavelBadge(s)
}
function origemBadge(origem) {
  if (!origem) return null
  const map = {
    consultoria: ['rgba(167,139,250,.1)', 'rgba(167,139,250,.2)', '#a78bfa',      'Consultoria'],
    calibracao:  ['rgba(52,211,153,.1)',  'rgba(52,211,153,.2)',  'var(--green)', 'Calibração'],
  }
  const [bg, border, cor, label] = map[origem] || []
  if (!label) return null
  return <span style={{ fontSize: 10, fontWeight: 600, color: cor, background: bg, border: `1px solid ${border}`, borderRadius: 4, padding: '1px 6px', marginLeft: 6, whiteSpace: 'nowrap' }}>{label}</span>
}

// ── Formulários vazios ─────────────────────────────────────────────────────────
const NF_VAZIO     = { id_sgt: '', empresa: '', status_sgt: 'Em execução', data_conclusao_sgt: '', consultor: '', nf_boleto_enviado: false, data_solicitacao_envio: '', numero_nf: '', valor_parcela: '', numero_parcelas: 1, observacoes: '' }
const PAG_VAZIO    = { numero_chamado: '', solicitante: '', responsavel: '', numero_nf_boleto_al: '', descricao: '', razao_social: '', status: 'aguardando_abertura_chamado', valor: '', previsao_pagamento: '', observacoes: '' }
const DIARIA_VAZIO = { numero_chamado: '', op: '', solicitante: '', destino: '', data_inicio: '', data_fim: '', status: 'aguardando_abertura_chamado', valor: '', previsao_pagamento: '', descricao: '', observacoes: '', hospedagem: false, voucher_recebido: false, passagem_aerea: 'nao', chamado_hospedagem: '' }

export default function Financeiro({ isAdmin = false }) {
  const [aba, setAba]               = useState('nf')
  const [emissoes, setEmissoes]     = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [diarias, setDiarias]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [busca, setBusca]               = useState('')
  const [buscaCampo, setBuscaCampo]     = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroResp, setFiltroResp]     = useState('')

  // Modais NF
  const [modalNF, setModalNF]         = useState(false)
  const [editandoNF, setEditandoNF]   = useState(null)
  const [formNF, setFormNF]           = useState(NF_VAZIO)
  // Modais Pagamento
  const [modalPag, setModalPag]       = useState(false)
  const [editandoPag, setEditandoPag] = useState(null)
  const [formPag, setFormPag]         = useState(PAG_VAZIO)
  const [modalObs, setModalObs]       = useState(null)
  const [modalDet, setModalDet]       = useState(null)
  // Modais Diária
  const [modalDiaria, setModalDiaria]       = useState(false)
  const [editandoDiaria, setEditandoDiaria] = useState(null)
  const [formDiaria, setFormDiaria]         = useState(DIARIA_VAZIO)
  const [modalDetDiaria, setModalDetDiaria] = useState(null)
  const [modalObsDiaria, setModalObsDiaria]   = useState(null)
  const [colaboradores, setColaboradores]     = useState([])
  // filtros diárias
  const [filtroPeriodoIni, setFiltroPeriodoIni] = useState('')
  const [filtroPeriodoFim, setFiltroPeriodoFim] = useState('')
  const [filtroSolicitante, setFiltroSolicitante] = useState('')
  const [filtroHospedagem, setFiltroHospedagem] = useState('')
  const [showFiltroPanel, setShowFiltroPanel] = useState(false)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    const [e, p, d, c] = await Promise.all([
      supabase.from('emissoes_nf').select('*').order('created_at', { ascending: false }),
      supabase.from('solicitacoes_pagamento').select('*').order('created_at', { ascending: false }),
      supabase.from('diarias_viagem').select('*').order('created_at', { ascending: false }),
      supabase.from('colaboradores').select('id, nome').eq('ativo', true).order('nome'),
    ])
    setEmissoes(e.data || [])
    setPagamentos(p.data || [])
    setDiarias(d.data || [])
    setColaboradores(c.data || [])
    setLoading(false)
  }

  function trocarAba(nova) { setAba(nova); setBusca(''); setFiltroStatus(''); setFiltroResp(''); setFiltroPeriodoIni(''); setFiltroPeriodoFim(''); setFiltroSolicitante(''); setFiltroHospedagem(''); setShowFiltroPanel(false) }

  // ── NF CRUD ──────────────────────────────────────────────────────────────────
  function abrirNovoNF()    { setEditandoNF(null); setErro(''); setFormNF(NF_VAZIO); setModalNF(true) }
  function abrirEditarNF(r) {
    setEditandoNF(r); setErro('')
    setFormNF({ id_sgt: r.id_sgt, empresa: r.empresa, status_sgt: r.status_sgt || 'Em execução', data_conclusao_sgt: r.data_conclusao_sgt || '', consultor: r.consultor || '', nf_boleto_enviado: r.nf_boleto_enviado || false, data_solicitacao_envio: r.data_solicitacao_envio || '', numero_nf: r.numero_nf || '', valor_parcela: r.valor_parcela || '', numero_parcelas: r.numero_parcelas || 1, observacoes: r.observacoes || '' })
    setModalNF(true)
  }
  async function salvarNF() {
    if (!formNF.id_sgt || !formNF.empresa) { setErro('ID SGT e Empresa são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const parcelas = parseInt(formNF.numero_parcelas) || 1
    const valorParcela = parseFloat(formNF.valor_parcela) || 0
    const dados = { id_sgt: formNF.id_sgt.trim(), empresa: formNF.empresa.trim(), status_sgt: formNF.status_sgt, data_conclusao_sgt: formNF.data_conclusao_sgt || null, consultor: formNF.consultor || null, nf_boleto_enviado: formNF.nf_boleto_enviado, data_solicitacao_envio: formNF.data_solicitacao_envio || null, numero_nf: formNF.numero_nf || null, valor_parcela: valorParcela, numero_parcelas: parcelas, valor_total: valorParcela * parcelas, observacoes: formNF.observacoes || null }
    let error
    if (editandoNF) { ({ error } = await supabase.from('emissoes_nf').update(dados).eq('id', editandoNF.id)) }
    else            { ({ error } = await supabase.from('emissoes_nf').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModalNF(false); init()
  }
  async function excluirNF(id) { if (!confirm('Excluir este registro?')) return; await supabase.from('emissoes_nf').delete().eq('id', id); init() }

  // ── PAGAMENTO CRUD ────────────────────────────────────────────────────────────
  function abrirNovoPag()    { setEditandoPag(null); setErro(''); setFormPag(PAG_VAZIO); setModalPag(true) }
  function abrirEditarPag(r) {
    setEditandoPag(r); setErro('')
    setFormPag({ numero_chamado: r.numero_chamado || '', solicitante: r.solicitante || '', responsavel: r.responsavel || (r.tipo_tarefa && r.tipo_tarefa !== 'Solicitação de Pagamento' ? r.tipo_tarefa : ''), numero_nf_boleto_al: r.numero_nf_boleto_al || '', descricao: r.descricao || '', razao_social: r.razao_social || '', status: r.status || 'aguardando_abertura_chamado', valor: r.valor || '', previsao_pagamento: r.previsao_pagamento || '', observacoes: r.observacoes || '' })
    setModalPag(true)
  }
  async function salvarPag() {
    setSalvando(true); setErro('')
    const dados = { numero_chamado: formPag.numero_chamado.trim() || null, solicitante: formPag.solicitante || null, responsavel: formPag.responsavel || null, tipo_tarefa: 'Solicitação de Pagamento', numero_nf_boleto_al: formPag.numero_nf_boleto_al || null, descricao: formPag.descricao || null, razao_social: formPag.razao_social || null, status: formPag.status, valor: parseFloat(formPag.valor) || null, previsao_pagamento: formPag.previsao_pagamento || null, observacoes: formPag.observacoes || null }
    let error
    if (editandoPag) { ({ error } = await supabase.from('solicitacoes_pagamento').update(dados).eq('id', editandoPag.id)) }
    else             { ({ error } = await supabase.from('solicitacoes_pagamento').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModalPag(false); init()
  }
  async function excluirPag(id) { if (!confirm('Excluir?')) return; await supabase.from('solicitacoes_pagamento').delete().eq('id', id); init() }

  // ── DIÁRIA CRUD ───────────────────────────────────────────────────────────────
  function abrirNovaDiaria()    { setEditandoDiaria(null); setErro(''); setFormDiaria(DIARIA_VAZIO); setModalDiaria(true) }
  function abrirEditarDiaria(r) {
    setEditandoDiaria(r); setErro('')
    setFormDiaria({ numero_chamado: r.numero_chamado || '', op: r.op || '', solicitante: r.solicitante || '', destino: r.destino || '', data_inicio: r.data_inicio || '', data_fim: r.data_fim || '', status: r.status || 'aguardando_abertura_chamado', valor: r.valor || '', previsao_pagamento: r.previsao_pagamento || '', descricao: r.descricao || '', observacoes: r.observacoes || '', hospedagem: r.hospedagem || false, voucher_recebido: r.voucher_recebido || false, passagem_aerea: r.passagem_aerea || 'nao', chamado_hospedagem: r.chamado_hospedagem || '' })
    setModalDiaria(true)
  }
  async function salvarDiaria() {
    if (!formDiaria.destino || !formDiaria.data_inicio || !formDiaria.data_fim) { setErro('Destino e período são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const dados = { numero_chamado: formDiaria.numero_chamado.trim() || null, op: formDiaria.op.trim() || null, solicitante: formDiaria.solicitante || null, destino: formDiaria.destino.trim(), data_inicio: formDiaria.data_inicio, data_fim: formDiaria.data_fim, status: formDiaria.status, valor: parseFloat(formDiaria.valor) || null, previsao_pagamento: formDiaria.previsao_pagamento || null, descricao: formDiaria.descricao || null, observacoes: formDiaria.observacoes || null, hospedagem: formDiaria.hospedagem, voucher_recebido: formDiaria.voucher_recebido, passagem_aerea: formDiaria.passagem_aerea, chamado_hospedagem: formDiaria.chamado_hospedagem.trim() || null }
    let error
    if (editandoDiaria) { ({ error } = await supabase.from('diarias_viagem').update(dados).eq('id', editandoDiaria.id)) }
    else                { ({ error } = await supabase.from('diarias_viagem').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModalDiaria(false); init()
  }
  async function excluirDiaria(id) { if (!confirm('Excluir esta diária?')) return; await supabase.from('diarias_viagem').delete().eq('id', id); init() }

  // ── Derivados ─────────────────────────────────────────────────────────────────
  const totalNF          = (r) => (parseFloat(r.valor_parcela) || 0) * (parseInt(r.numero_parcelas) || 1)
  const valorTotalNFs    = emissoes.reduce((acc, r) => acc + totalNF(r), 0)
  const totalConsultoria = emissoes.filter(e => e.origem === 'consultoria').length
  const totalAgAbChamado = pagamentos.filter(p => p.status === 'aguardando_abertura_chamado').length
  const diariasAbertas   = diarias.filter(d => d.status !== 'concluido' && d.status !== 'cancelado').length
  const totalParcelas    = (parseFloat(formNF.valor_parcela) || 0) * (parseInt(formNF.numero_parcelas) || 1)

  const emissoesFiltradas = emissoes.filter(r => {
    if (filtroStatus === 'consultoria') return r.origem === 'consultoria'
    if (filtroStatus && r.status_sgt !== filtroStatus) return false
    if (busca) { const b = busca.toLowerCase(); return r.id_sgt?.toLowerCase().includes(b) || r.empresa?.toLowerCase().includes(b) || r.consultor?.toLowerCase().includes(b) }
    return true
  })
  const pagamentosFiltrados = pagamentos.filter(r => {
    if (filtroStatus && r.status !== filtroStatus) return false
    if (filtroResp && (STATUS_GRUPO_AREA[r.status] || '') !== filtroResp) return false
    if (busca) {
      const b = busca.toLowerCase()
      const statusLabel = (STATUS_PAG_LABEL[r.status] || r.status || '').toLowerCase()
      const responsavelText = ((r.responsavel || '') || (r.tipo_tarefa && r.tipo_tarefa !== 'Solicitação de Pagamento' ? r.tipo_tarefa : '')).toLowerCase()
      switch (buscaCampo) {
        case 'numero_chamado': return (r.numero_chamado || '').toLowerCase().includes(b)
        case 'numero_nf_boleto_al': return (r.numero_nf_boleto_al || '').toLowerCase().includes(b)
        case 'razao_social': return (r.razao_social || '').toLowerCase().includes(b)
        case 'status': return statusLabel.includes(b)
        case 'responsavel': return responsavelText.includes(b)
        case 'solicitante': return (r.solicitante || '').toLowerCase().includes(b)
        default: return (r.numero_chamado || '').toLowerCase().includes(b) || (r.numero_nf_boleto_al || '').toLowerCase().includes(b) || (r.razao_social || '').toLowerCase().includes(b) || (r.solicitante || '').toLowerCase().includes(b) || statusLabel.includes(b) || responsavelText.includes(b)
      }
    }
    return true
  })
  const diariasFiltradas = diarias.filter(r => {
    if (filtroStatus && r.status !== filtroStatus) return false
    if (filtroResp && (STATUS_GRUPO_AREA[r.status] || '') !== filtroResp) return false
    if (filtroSolicitante && r.solicitante !== filtroSolicitante) return false
    if (filtroHospedagem === 'sim' && !r.hospedagem) return false
    if (filtroHospedagem === 'nao' && r.hospedagem) return false
    if (filtroHospedagem === 'voucher_pendente' && !(r.hospedagem && !r.voucher_recebido)) return false
    if (filtroPeriodoIni) {
      const ini = r.data_inicio ? r.data_inicio.slice(0, 7) : ''
      if (ini < filtroPeriodoIni) return false
    }
    if (filtroPeriodoFim) {
      const ini = r.data_inicio ? r.data_inicio.slice(0, 7) : ''
      if (ini > filtroPeriodoFim) return false
    }
    if (busca) { const b = busca.toLowerCase(); return (r.numero_chamado || '').toLowerCase().includes(b) || (r.destino || '').toLowerCase().includes(b) || (r.solicitante || '').toLowerCase().includes(b) || (r.op || '').toLowerCase().includes(b) }
    return true
  })

  const trHover = { onMouseEnter: e => e.currentTarget.style.background = 'var(--subtle)', onMouseLeave: e => e.currentTarget.style.background = 'transparent' }

  const filtroRespRow = (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Grupo/Área:</span>
      <button style={S.filtro(!filtroResp)} onClick={() => setFiltroResp('')}>Todos</button>
      {GRUPOS_AREAS_LISTA.map(r => {
        const cor = GRUPO_AREA_COR[r] || 'var(--muted)'
        const on  = filtroResp === r
        return <button key={r} onClick={() => setFiltroResp(r)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? `${cor}40` : 'var(--border2)'}`, background: on ? `${cor}18` : 'var(--subtle)', color: on ? cor : 'var(--text2)', fontFamily: 'inherit' }}>{r}</button>
      })}
    </div>
  )

  // chips de filtros ativos nas diárias
  const filtrosAtivos = [
    filtroSolicitante && { label: filtroSolicitante, clear: () => setFiltroSolicitante('') },
    filtroStatus      && { label: STATUS_PAG_LABEL[filtroStatus] || filtroStatus, clear: () => setFiltroStatus('') },
    filtroHospedagem  && { label: filtroHospedagem === 'sim' ? 'Com hospedagem' : filtroHospedagem === 'nao' ? 'Sem hospedagem' : 'Voucher pendente', clear: () => setFiltroHospedagem('') },
    (filtroPeriodoIni || filtroPeriodoFim) && { label: `${filtroPeriodoIni || '…'} → ${filtroPeriodoFim || '…'}`, clear: () => { setFiltroPeriodoIni(''); setFiltroPeriodoFim('') } },
  ].filter(Boolean)

  const limparFiltrosDiarias = () => { setFiltroStatus(''); setFiltroResp(''); setFiltroSolicitante(''); setFiltroHospedagem(''); setFiltroPeriodoIni(''); setFiltroPeriodoFim(''); setBusca('') }

  return (
    <div style={S.wrap}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>Financeiro</div>
          <div style={S.sub}>Emissão de NFs, Solicitações de Pagamento e Diárias de Viagem</div>
        </div>
        {isAdmin && (
          <button style={aba === 'diarias' ? S.btnTeal : S.btn} onClick={() => { if (aba === 'nf') abrirNovoNF(); else if (aba === 'pag') abrirNovoPag(); else abrirNovaDiaria() }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {aba === 'nf' ? 'Nova Emissão NF' : aba === 'pag' ? 'Nova Solicitação' : 'Nova Diária'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={S.stats}>
        {[
          ['var(--blue)',   emissoes.length,                                                                   'Total NFs'],
          ['var(--blue)',   emissoes.filter(e => e.status_sgt === 'Em execução').length,                       'Em Execução'],
          ['var(--green)',  emissoes.filter(e => e.status_sgt === 'Concluído' && e.nf_boleto_enviado).length,  'NFs Concluídas'],
          ['var(--purple)', totalAgAbChamado,                                                                  'Ag. Abertura Chamado'],
          ['#0d9488',       diariasAbertas,                                                                    'Diárias Abertas'],
        ].map(([cor, val, lbl]) => (
          <div key={lbl} style={S.statCard}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={S.tabs}>
        <button style={S.tab(aba === 'nf')} onClick={() => trocarAba('nf')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Emissão de NFs <span style={S.tabCount(aba === 'nf')}>{emissoes.length}</span>
        </button>
        <button style={S.tab(aba === 'pag')} onClick={() => trocarAba('pag')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Solicitações de Pagamento <span style={S.tabCount(aba === 'pag')}>{pagamentos.length}</span>
        </button>
        <button style={{ ...S.tab(aba === 'diarias'), color: aba === 'diarias' ? '#0d9488' : 'var(--muted)', borderBottomColor: aba === 'diarias' ? '#0d9488' : 'transparent' }} onClick={() => trocarAba('diarias')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
          Diárias de Viagem <span style={S.tabCountTeal(aba === 'diarias')}>{diarias.length}</span>
        </button>
      </div>

      {/* ══ ABA NF ══ */}
      {aba === 'nf' && (<>
        <div style={S.toolbar}>
          <input style={S.search} placeholder="Buscar empresa, ID SGT, consultor..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button style={S.filtro(!filtroStatus)} onClick={() => setFiltroStatus('')}>Todos</button>
          {STATUS_NF.map(s => <button key={s} style={S.filtro(filtroStatus === s)} onClick={() => setFiltroStatus(s)}>{s}</button>)}
          <button style={S.filtroConsultoria(filtroStatus === 'consultoria')} onClick={() => setFiltroStatus('consultoria')}>
            Consultoria {totalConsultoria > 0 && <span style={{ background: 'rgba(167,139,250,.2)', color: '#a78bfa', borderRadius: 8, padding: '0 5px', fontSize: 10, fontWeight: 700, marginLeft: 2 }}>{totalConsultoria}</span>}
          </button>
          {valorTotalNFs > 0 && <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>Total geral: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>{fmtVal(valorTotalNFs)}</span></div>}
        </div>
        <div style={S.tableWrap}><table style={S.table}>
          <thead><tr>
            <th style={S.th}>ID SGT</th><th style={S.th}>Empresa</th><th style={S.th}>Status SGT</th>
            <th style={S.th}>Dt. Conclusão</th><th style={S.th}>Consultor</th><th style={S.th}>NF e Boleto</th>
            <th style={S.th}>Dt. Solicitação</th><th style={S.th}>Nº NF</th>
            <th style={S.th}>Valor Parcela</th><th style={S.th}>Parcelas</th><th style={S.th}>Total</th>
            {isAdmin && <th style={S.th}></th>}
          </tr></thead>
          <tbody>
            {emissoesFiltradas.map(r => (
              <tr key={r.id} {...trHover}>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", color: 'var(--blue)', fontWeight: 500 }}>{r.id_sgt}</td>
                <td style={{ ...S.td, color: 'var(--text)', fontWeight: 500, maxWidth: 200 }}><div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>{r.empresa}{origemBadge(r.origem)}</div></td>
                <td style={S.td}>{statusNfBadge(r.status_sgt)}</td>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmtData(r.data_conclusao_sgt)}</td>
                <td style={S.td}>{r.consultor || '—'}</td>
                <td style={S.td}><span style={{ background: r.nf_boleto_enviado ? 'var(--green-dim)' : 'var(--red-dim)', color: r.nf_boleto_enviado ? 'var(--green)' : 'var(--red)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{r.nf_boleto_enviado ? 'SIM' : 'NÃO'}</span></td>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmtData(r.data_solicitacao_envio)}</td>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--purple)' }}>{r.numero_nf || '—'}</td>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmtVal(r.valor_parcela)}</td>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, textAlign: 'center' }}>{r.numero_parcelas || '—'}</td>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{fmtVal(totalNF(r))}</td>
                {isAdmin && <td style={S.td}><div style={{ display: 'flex', gap: 4 }}><button style={S.btnSm} onClick={() => abrirEditarNF(r)}>Editar</button><button style={S.btnDanger} onClick={() => excluirNF(r.id)}>✕</button></div></td>}
              </tr>
            ))}
            {emissoesFiltradas.length === 0 && <tr><td colSpan={isAdmin ? 12 : 11} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{loading ? 'Carregando...' : 'Nenhum registro.'}</td></tr>}
          </tbody>
        </table></div>
      </>)}

      {/* ══ ABA PAGAMENTOS ══ */}
      {aba === 'pag' && (<>
        <div style={S.toolbar}>
              <select style={S.fselSm} value={buscaCampo} onChange={e => setBuscaCampo(e.target.value)}>
            <option value="">Buscar em todos</option>
            <option value="responsavel">Responsável</option>
            <option value="numero_nf_boleto_al">NF / Boleto / AL</option>
            <option value="numero_chamado">Chamado</option>
            <option value="status">Status</option>
            <option value="razao_social">Razão Social</option>
            <option value="solicitante">Unidade</option>
          </select>
          <input style={S.search} placeholder="Buscar por chamado, razão social, unidade, responsável..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button style={S.filtro(!filtroStatus)} onClick={() => setFiltroStatus('')}>Todos</button>
          {STATUS_PAG.map(s => <button key={s} style={S.filtro(filtroStatus === s)} onClick={() => setFiltroStatus(s)}>{STATUS_PAG_LABEL[s]}</button>)}
        </div>
        {filtroRespRow}
        <div style={S.tableWrap}><table style={S.table}>
          <thead><tr>
            <th style={S.th}>Chamado</th><th style={S.th}>Unidade</th>
            <th style={S.th}>Nº NF / Boleto / AL</th><th style={S.th}>Razão Social</th>
            <th style={S.th}>Status</th><th style={S.th}>Grupo/Área</th><th style={S.th}>Responsável</th><th style={S.th}>Valor / Previsão</th>
            {isAdmin && <th style={S.th}></th>}
          </tr></thead>
          <tbody>
            {pagamentosFiltrados.map(r => (
              <tr key={r.id} {...trHover}>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", color: 'var(--blue)', fontWeight: 500 }}>
                  {r.numero_chamado ? r.numero_chamado : <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 11 }}>A abrir</span>}
                </td>
                <td style={S.td}>{r.solicitante || '—'}</td>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--purple)' }}>{r.numero_nf_boleto_al || '—'}</td>
                <td style={{ ...S.td, color: 'var(--text)', fontWeight: 500, maxWidth: 180 }}><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{r.razao_social || '—'}{origemBadge(r.origem)}</div></td>
                <td style={S.td}>{statusPagBadge(r.status)}</td>
                <td style={S.td}>{grupoAreaBadge(r.status)}</td>
                <td style={S.td}>{r.responsavel || (r.tipo_tarefa && r.tipo_tarefa !== 'Solicitação de Pagamento' ? r.tipo_tarefa : '—')}</td>
                <td style={S.td}>
                  {r.valor ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: 'var(--green)', fontWeight: 500 }}>{fmtVal(r.valor)}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: r.previsao_pagamento ? 'var(--muted)' : 'var(--border2)' }}>{r.previsao_pagamento ? `Prev. ${fmtData(r.previsao_pagamento)}` : 'Sem previsão'}</span>
                  </div>) : <span style={{ color: 'var(--border2)', fontSize: 12 }}>—</span>}
                </td>
                {isAdmin && <td style={S.td}><div style={{ display: 'flex', gap: 4 }}>
                  <button style={S.btnDet} onClick={() => setModalDet(r)}>Detalhes</button>
                  {r.observacoes && <button style={S.btnObs} onClick={() => setModalObs(r)}>Obs.</button>}
                  <button style={S.btnSm} onClick={() => abrirEditarPag(r)}>Editar</button>
                  <button style={S.btnDanger} onClick={() => excluirPag(r.id)}>✕</button>
                </div></td>}
              </tr>
            ))}
            {pagamentosFiltrados.length === 0 && <tr><td colSpan={isAdmin ? 9 : 8} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{loading ? 'Carregando...' : 'Nenhum registro.'}</td></tr>}
          </tbody>
        </table></div>
      </>)}

      {/* ══ ABA DIÁRIAS ══ */}
      {aba === 'diarias' && (<>
        {/* Barra principal */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input style={S.search} placeholder="Buscar destino, chamado, OP..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button
            onClick={() => setShowFiltroPanel(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: filtrosAtivos.length > 0 ? '1px solid rgba(13,148,136,.4)' : '1px solid var(--border2)', background: filtrosAtivos.length > 0 ? 'rgba(13,148,136,.08)' : 'var(--subtle)', color: filtrosAtivos.length > 0 ? '#0d9488' : 'var(--text2)', transition: 'all .15s' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Filtros
            {filtrosAtivos.length > 0 && <span style={{ background: 'rgba(13,148,136,.2)', color: '#0d9488', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{filtrosAtivos.length}</span>}
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>{diariasFiltradas.length} de {diarias.length} diárias</span>
        </div>

        {/* Chips de filtros ativos */}
        {filtrosAtivos.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
            {filtrosAtivos.map((f, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(13,148,136,.1)', color: '#0d9488', border: '1px solid rgba(13,148,136,.2)' }}>
                {f.label}
                <span onClick={f.clear} style={{ cursor: 'pointer', fontSize: 13, lineHeight: 1, opacity: .7, marginLeft: 2 }}>×</span>
              </span>
            ))}
            <button onClick={limparFiltrosDiarias} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>limpar tudo</button>
          </div>
        )}

        {/* Painel de filtros recolhível */}
        {showFiltroPanel && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Solicitante</div>
                <select style={S.fsel} value={filtroSolicitante} onChange={e => setFiltroSolicitante(e.target.value)}>
                  <option value="">Todos</option>
                  {[...new Set(diarias.map(d => d.solicitante).filter(Boolean))].sort().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Status</div>
                <select style={S.fsel} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                  <option value="">Todos</option>
                  {STATUS_PAG.map(s => <option key={s} value={s}>{STATUS_PAG_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Hospedagem</div>
                <select style={S.fsel} value={filtroHospedagem} onChange={e => setFiltroHospedagem(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="sim">Com hospedagem</option>
                  <option value="nao">Sem hospedagem</option>
                  <option value="voucher_pendente">Voucher pendente</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Período — início</div>
                <input type="month" style={S.input} value={filtroPeriodoIni} onChange={e => setFiltroPeriodoIni(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Período — fim</div>
                <input type="month" style={S.input} value={filtroPeriodoFim} onChange={e => setFiltroPeriodoFim(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={S.btnSm} onClick={limparFiltrosDiarias}>Limpar tudo</button>
              <button style={{ ...S.btn, background: '#0d9488' }} onClick={() => setShowFiltroPanel(false)}>Aplicar</button>
            </div>
          </div>
        )}
        <div style={S.tableWrap}><table style={S.table}>
          <thead><tr>
            <th style={S.th}>Chamado</th><th style={S.th}>OP</th><th style={S.th}>Solicitante</th>
            <th style={S.th}>Destino</th><th style={S.th}>Período</th>
            <th style={S.th}>Hospedagem</th>
            <th style={S.th}>Status</th><th style={S.th}>Responsável</th><th style={S.th}>Valor / Previsão</th>
            {isAdmin && <th style={S.th}></th>}
          </tr></thead>
          <tbody>
            {diariasFiltradas.map(r => (
              <tr key={r.id} {...trHover}>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", color: 'var(--blue)', fontWeight: 500 }}>
                  {r.numero_chamado ? r.numero_chamado : <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 11 }}>A abrir</span>}
                </td>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--purple)' }}>{r.op || '—'}</td>
                <td style={S.td}>{r.solicitante || '—'}</td>
                <td style={{ ...S.td, color: 'var(--text)', fontWeight: 500 }}>{r.destino}</td>
                <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                  {r.data_inicio && r.data_fim ? <span>{fmtData(r.data_inicio)} – {fmtData(r.data_fim)}</span> : '—'}
                </td>
                <td style={S.td}>
                  {r.hospedagem ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ background: 'rgba(13,148,136,.1)', color: '#0d9488', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, width: 'fit-content' }}>Hospedagem</span>
                      {r.voucher_recebido
                        ? <span style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, width: 'fit-content' }}>Voucher OK</span>
                        : <span style={{ background: 'var(--amber-dim)', color: 'var(--amber)', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, width: 'fit-content' }}>Voucher pend.</span>}
                      {r.passagem_aerea && r.passagem_aerea !== 'nao' && <span style={{ background: 'rgba(99,102,241,.1)', color: 'var(--blue)', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, width: 'fit-content' }}>{r.passagem_aerea === 'pendente' ? 'Passagem pend.' : 'Passagem OK'}</span>}
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
                  )}
                </td>
                <td style={S.td}>{statusPagBadge(r.status)}</td>
                <td style={S.td}>{responsavelBadge(r.status)}</td>
                <td style={S.td}>
                  {r.valor ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: 'var(--green)', fontWeight: 500 }}>{fmtVal(r.valor)}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: r.previsao_pagamento ? 'var(--muted)' : 'var(--border2)' }}>{r.previsao_pagamento ? `Prev. ${fmtData(r.previsao_pagamento)}` : 'Sem previsão'}</span>
                  </div>) : <span style={{ color: 'var(--border2)', fontSize: 12 }}>—</span>}
                </td>
                {isAdmin && <td style={S.td}><div style={{ display: 'flex', gap: 4 }}>
                  <button style={S.btnDetTeal} onClick={() => setModalDetDiaria(r)}>Detalhes</button>
                  {r.observacoes && <button style={S.btnObs} onClick={() => setModalObsDiaria(r)}>Obs.</button>}
                  <button style={S.btnSm} onClick={() => abrirEditarDiaria(r)}>Editar</button>
                  <button style={S.btnDanger} onClick={() => excluirDiaria(r.id)}>✕</button>
                </div></td>}
              </tr>
            ))}
            {diariasFiltradas.length === 0 && <tr><td colSpan={isAdmin ? 10 : 9} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{loading ? 'Carregando...' : 'Nenhum registro de diárias.'}</td></tr>}
          </tbody>
        </table></div>
      </>)}

      {/* ══ MODAL DETALHES PAGAMENTO ══ */}
      {modalDet && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalDet(null)}>
          <div style={S.modalBoxDet}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Detalhes da Solicitação</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>
                  {modalDet.numero_chamado ? `Chamado #${modalDet.numero_chamado}` : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Chamado a abrir</span>}
                </div>
              </div>
              <button onClick={() => setModalDet(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>Solicitante</div><div style={{ fontSize: 13, color: 'var(--text)' }}>{modalDet.solicitante || '—'}</div></div>
              <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>Nº NF / Boleto / AL</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#a78bfa' }}>{modalDet.numero_nf_boleto_al || '—'}</div></div>
              <div style={{ gridColumn: 'span 2' }}><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>Razão Social</div><div style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>{modalDet.razao_social || '—'}{origemBadge(modalDet.origem)}</div></div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 8 }}>Descrição</div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>{modalDet.descricao || '—'}</div>
            <div style={{ background: 'var(--blue-dim)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 6 }}>Valor</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500, color: 'var(--blue)' }}>{fmtVal(modalDet.valor)}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{modalDet.previsao_pagamento ? `Previsão: ${fmtData(modalDet.previsao_pagamento)}` : 'Sem previsão de pagamento'}</div>
              </div>
              <div>{statusPagBadge(modalDet.status)}</div>
            </div>
            {modalDet.observacoes && <div style={{ background: 'rgba(167,139,250,.06)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
              <div style={{ fontSize: 10, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 6 }}>Observações</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{modalDet.observacoes}</div>
            </div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={S.btnSm} onClick={() => setModalDet(null)}>Fechar</button>
              {isAdmin && <button style={S.btn} onClick={() => { setModalDet(null); abrirEditarPag(modalDet) }}>Editar</button>}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL DETALHES DIÁRIA ══ */}
      {modalDetDiaria && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalDetDiaria(null)}>
          <div style={S.modalBoxDet}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Detalhes da Diária</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#0d9488', fontWeight: 500 }}>
                  {modalDetDiaria.numero_chamado ? `Chamado #${modalDetDiaria.numero_chamado}` : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Chamado a abrir</span>}
                </div>
              </div>
              <button onClick={() => setModalDetDiaria(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>Solicitante</div><div style={{ fontSize: 13, color: 'var(--text)' }}>{modalDetDiaria.solicitante || '—'}</div></div>
              <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>OP</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--purple)' }}>{modalDetDiaria.op || '—'}</div></div>
              <div style={{ gridColumn: 'span 2' }}><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>Destino</div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{modalDetDiaria.destino}</div></div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>Período</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text)' }}>{fmtData(modalDetDiaria.data_inicio)} – {fmtData(modalDetDiaria.data_fim)}</div>
              </div>
            </div>
            {modalDetDiaria.descricao && (<>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 8 }}>Descrição</div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>{modalDetDiaria.descricao}</div>
            </>)}
            {(modalDetDiaria.hospedagem || (modalDetDiaria.passagem_aerea && modalDetDiaria.passagem_aerea !== 'nao')) && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 8 }}>Hospedagem e passagens</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {modalDetDiaria.hospedagem && <span style={{ background: 'rgba(13,148,136,.1)', color: '#0d9488', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Hospedagem</span>}
                  {modalDetDiaria.hospedagem && (modalDetDiaria.voucher_recebido
                    ? <span style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Voucher recebido</span>
                    : <span style={{ background: 'var(--amber-dim)', color: 'var(--amber)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Voucher pendente</span>)}
                  {modalDetDiaria.passagem_aerea === 'pendente' && <span style={{ background: 'var(--blue-dim)', color: 'var(--blue)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Passagem pendente</span>}
                  {modalDetDiaria.passagem_aerea === 'emitida'  && <span style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Passagem emitida</span>}
                  {modalDetDiaria.chamado_hospedagem && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--blue)', padding: '2px 8px', borderRadius: 4, background: 'var(--blue-dim)' }}>#{modalDetDiaria.chamado_hospedagem}</span>}
                </div>
              </div>
            )}
            <div style={{ background: 'rgba(13,148,136,.07)', border: '1px solid rgba(13,148,136,.2)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: modalDetDiaria.observacoes ? 14 : 0 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 6 }}>Valor / Previsão</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500, color: '#0d9488' }}>{fmtVal(modalDetDiaria.valor)}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{modalDetDiaria.previsao_pagamento ? `Previsão: ${fmtData(modalDetDiaria.previsao_pagamento)}` : 'Sem previsão de pagamento'}</div>
              </div>
              <div>{statusPagBadge(modalDetDiaria.status)}</div>
            </div>
            {modalDetDiaria.observacoes && <div style={{ background: 'rgba(167,139,250,.06)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 6 }}>Observações</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{modalDetDiaria.observacoes}</div>
            </div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={S.btnSm} onClick={() => setModalDetDiaria(null)}>Fechar</button>
              {isAdmin && <button style={{ ...S.btn, background: '#0d9488' }} onClick={() => { setModalDetDiaria(null); abrirEditarDiaria(modalDetDiaria) }}>Editar</button>}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL OBS PAGAMENTO ══ */}
      {modalObs && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalObs(null)}>
          <div style={S.modalBoxSm}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Observações</div>
                <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--blue)', marginTop: 3 }}>Chamado {modalObs.numero_chamado || '(a abrir)'}</div>
              </div>
              <button onClick={() => setModalObs(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{modalObs.observacoes}</div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{statusPagBadge(modalObs.status)}{responsavelBadge(modalObs.status)}</div>
          </div>
        </div>
      )}

      {/* ══ MODAL OBS DIÁRIA ══ */}
      {modalObsDiaria && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalObsDiaria(null)}>
          <div style={S.modalBoxSm}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Observações</div>
                <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#0d9488', marginTop: 3 }}>{modalObsDiaria.destino}{modalObsDiaria.numero_chamado ? ` · #${modalObsDiaria.numero_chamado}` : ''}</div>
              </div>
              <button onClick={() => setModalObsDiaria(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{modalObsDiaria.observacoes}</div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{statusPagBadge(modalObsDiaria.status)}{responsavelBadge(modalObsDiaria.status)}</div>
          </div>
        </div>
      )}

      {/* ══ MODAL NF ══ */}
      {modalNF && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalNF(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoNF ? 'Editar Emissão NF' : 'Nova Emissão NF'}</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>ID SGT *</label><input style={S.input} value={formNF.id_sgt} onChange={e => setFormNF({ ...formNF, id_sgt: e.target.value })} placeholder="713154" /></div>
              <div style={S.field}><label style={S.label}>Status SGT</label><select style={S.fsel} value={formNF.status_sgt} onChange={e => setFormNF({ ...formNF, status_sgt: e.target.value })}>{STATUS_NF.map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={S.field}><label style={S.label}>Empresa *</label><input style={S.input} value={formNF.empresa} onChange={e => setFormNF({ ...formNF, empresa: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Consultor</label><input style={S.input} value={formNF.consultor} onChange={e => setFormNF({ ...formNF, consultor: e.target.value })} /></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data Conclusão SGT</label><input type="date" style={S.input} value={formNF.data_conclusao_sgt} onChange={e => setFormNF({ ...formNF, data_conclusao_sgt: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Data Solicitação Envio</label><input type="date" style={S.input} value={formNF.data_solicitacao_envio} onChange={e => setFormNF({ ...formNF, data_solicitacao_envio: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>NF e Boleto Enviados?</label><select style={S.fsel} value={formNF.nf_boleto_enviado ? 'sim' : 'nao'} onChange={e => setFormNF({ ...formNF, nf_boleto_enviado: e.target.value === 'sim' })}><option value="nao">NÃO</option><option value="sim">SIM</option></select></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Nº NF</label><input style={S.input} value={formNF.numero_nf} onChange={e => setFormNF({ ...formNF, numero_nf: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Nº de Parcelas</label><input type="number" min="1" style={S.input} value={formNF.numero_parcelas} onChange={e => setFormNF({ ...formNF, numero_parcelas: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Valor por Parcela (R$)</label><input type="number" step="0.01" style={S.input} value={formNF.valor_parcela} onChange={e => setFormNF({ ...formNF, valor_parcela: e.target.value })} placeholder="0,00" /></div>
            {totalParcelas > 0 && <div style={S.totalBox}><span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>Valor total do serviço</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, color: 'var(--blue)' }}>{fmtVal(totalParcelas)}</span></div>}
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={S.textarea} value={formNF.observacoes} onChange={e => setFormNF({ ...formNF, observacoes: e.target.value })} /></div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setModalNF(false)}>Cancelar</button><button style={S.btn} onClick={salvarNF} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}

      {/* ══ MODAL PAGAMENTO ══ */}
      {modalPag && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalPag(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoPag ? 'Editar Solicitação' : 'Nova Solicitação de Pagamento'}</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Nº Chamado <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
                <input style={S.input} value={formPag.numero_chamado} onChange={e => setFormPag({ ...formPag, numero_chamado: e.target.value })} placeholder="Ex: 1346676" />
              </div>
              <div style={S.field}><label style={S.label}>Status</label>
                <select style={S.fsel} value={formPag.status} onChange={e => setFormPag({ ...formPag, status: e.target.value })}>
                  {STATUS_PAG.map(s => <option key={s} value={s}>{STATUS_PAG_LABEL[s]}</option>)}
                </select>
              </div>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Grupo/Área atual</span>{grupoAreaBadge(formPag.status)}
            </div>
            <div style={S.field}><label style={S.label}>Unidade</label><input style={S.input} value={formPag.solicitante} onChange={e => setFormPag({ ...formPag, solicitante: e.target.value })} placeholder="Ex: IST - MPP - Energia" /></div>
            <div style={S.field}><label style={S.label}>Responsável</label><input style={S.input} value={formPag.responsavel} onChange={e => setFormPag({ ...formPag, responsavel: e.target.value })} placeholder="Pessoa responsável pela abertura" /></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Nº NF / Boleto / AL</label><input style={S.input} value={formPag.numero_nf_boleto_al} onChange={e => setFormPag({ ...formPag, numero_nf_boleto_al: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Razão Social</label><input style={S.input} value={formPag.razao_social} onChange={e => setFormPag({ ...formPag, razao_social: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Descrição</label><textarea style={S.textarea} value={formPag.descricao} onChange={e => setFormPag({ ...formPag, descricao: e.target.value })} /></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Valor (R$)</label><input type="number" step="0.01" style={S.input} value={formPag.valor} onChange={e => setFormPag({ ...formPag, valor: e.target.value })} placeholder="0,00" /></div>
              <div style={S.field}><label style={S.label}>Previsão de Pagamento</label><input type="date" style={S.input} value={formPag.previsao_pagamento} onChange={e => setFormPag({ ...formPag, previsao_pagamento: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={S.textarea} value={formPag.observacoes} onChange={e => setFormPag({ ...formPag, observacoes: e.target.value })} /></div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setModalPag(false)}>Cancelar</button><button style={S.btn} onClick={salvarPag} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}

      {/* ══ MODAL DIÁRIA ══ */}
      {modalDiaria && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalDiaria(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoDiaria ? 'Editar Diária de Viagem' : 'Nova Diária de Viagem'}</div>
            {erro && <div style={S.erro}>{erro}</div>}

            <div style={S.sectionLbl}>Identificação</div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Chamado <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
                <input style={S.input} value={formDiaria.numero_chamado} onChange={e => setFormDiaria({ ...formDiaria, numero_chamado: e.target.value })} placeholder="Ex: #1382901" />
              </div>
              <div style={S.field}><label style={S.label}>OP</label><input style={S.input} value={formDiaria.op} onChange={e => setFormDiaria({ ...formDiaria, op: e.target.value })} placeholder="Ex: OP-2026-044" /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Solicitante</label>
                <select style={S.fsel} value={formDiaria.solicitante} onChange={e => setFormDiaria({ ...formDiaria, solicitante: e.target.value })}>
                  <option value="">Selecionar...</option>
                  {colaboradores.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  <option value="IST - MPP - ENERGIA">IST - MPP - ENERGIA</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Tipo de Tarefa</label>
                <input style={{ ...S.input, opacity: .6, cursor: 'not-allowed' }} value="Diárias de Viagem" disabled />
              </div>
            </div>

            <div style={S.sectionLbl}>Viagem</div>
            <div style={S.field}><label style={S.label}>Destino *</label><input style={S.input} value={formDiaria.destino} onChange={e => setFormDiaria({ ...formDiaria, destino: e.target.value })} placeholder="Ex: Garanhuns - PE" /></div>
            <div style={S.field}><label style={S.label}>Descrição</label><textarea style={S.textarea} value={formDiaria.descricao} onChange={e => setFormDiaria({ ...formDiaria, descricao: e.target.value })} placeholder="Detalhes da viagem..." /></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data de início *</label><input type="date" style={S.input} value={formDiaria.data_inicio} onChange={e => setFormDiaria({ ...formDiaria, data_inicio: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Data de fim *</label><input type="date" style={S.input} value={formDiaria.data_fim} onChange={e => setFormDiaria({ ...formDiaria, data_fim: e.target.value })} /></div>
            </div>

            <div style={S.sectionLbl}>Hospedagem e passagens</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={S.field}>
                <label style={S.label}>Hospedagem?</label>
                <select style={S.fsel} value={formDiaria.hospedagem ? 'sim' : 'nao'} onChange={e => setFormDiaria({ ...formDiaria, hospedagem: e.target.value === 'sim', voucher_recebido: false })}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Voucher recebido?</label>
                <select style={S.fsel} value={formDiaria.voucher_recebido ? 'sim' : 'nao'} onChange={e => setFormDiaria({ ...formDiaria, voucher_recebido: e.target.value === 'sim' })} disabled={!formDiaria.hospedagem}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Passagem aérea?</label>
                <select style={S.fsel} value={formDiaria.passagem_aerea} onChange={e => setFormDiaria({ ...formDiaria, passagem_aerea: e.target.value })}>
                  <option value="nao">Não</option>
                  <option value="pendente">Sim — pendente</option>
                  <option value="emitida">Sim — emitida</option>
                </select>
              </div>
            </div>
            {(formDiaria.hospedagem || formDiaria.passagem_aerea !== 'nao') && (
              <div style={S.field}>
                <label style={S.label}>Nº chamado hospedagem / passagem <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
                <input style={S.input} value={formDiaria.chamado_hospedagem} onChange={e => setFormDiaria({ ...formDiaria, chamado_hospedagem: e.target.value })} placeholder="Ex: #1399021" />
              </div>
            )}
            {formDiaria.hospedagem && !formDiaria.voucher_recebido && (
              <div style={{ background: 'rgba(201,125,16,.07)', border: '1px solid rgba(201,125,16,.2)', borderRadius: 7, padding: '9px 12px', marginBottom: 14, fontSize: 11, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Hospedagem confirmada — voucher ainda não recebido
              </div>
            )}

            <div style={S.sectionLbl}>Situação</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Status *</label>
                <select style={S.fsel} value={formDiaria.status} onChange={e => setFormDiaria({ ...formDiaria, status: e.target.value })}>
                  {STATUS_PAG.map(s => <option key={s} value={s}>{STATUS_PAG_LABEL[s]}</option>)}
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Valor (R$)</label><input type="number" step="0.01" style={S.input} value={formDiaria.valor} onChange={e => setFormDiaria({ ...formDiaria, valor: e.target.value })} placeholder="0,00" /></div>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Grupo/Área atual</span>{responsavelBadge(formDiaria.status)}
            </div>
            <div style={S.field}><label style={S.label}>Previsão de pagamento</label><input type="date" style={S.input} value={formDiaria.previsao_pagamento} onChange={e => setFormDiaria({ ...formDiaria, previsao_pagamento: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={S.textarea} value={formDiaria.observacoes} onChange={e => setFormDiaria({ ...formDiaria, observacoes: e.target.value })} placeholder="Informações adicionais sobre a viagem..." /></div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalDiaria(false)}>Cancelar</button>
              <button style={{ ...S.btn, background: '#0d9488' }} onClick={salvarDiaria} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
