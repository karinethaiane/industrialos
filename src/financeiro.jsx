import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  wrap: { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub: { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 22 },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px var(--shadow)' },
  statBar: (cor) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: cor, opacity: .5 }),
  statVal: (cor) => ({ fontFamily: 'DM Mono, monospace', fontSize: 26, fontWeight: 500, color: cor, lineHeight: 1, marginBottom: 5 }),
  statLbl: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 },
  tab: (on) => ({ padding: '9px 20px', fontSize: 13, fontWeight: on ? 600 : 500, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: on ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, fontFamily: 'inherit', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 7 }),
  tabCount: (on) => ({ padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)' }),
  toolbar: { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  search: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 260 },
  filtro: (on) => ({ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'rgba(59,130,246,.25)' : 'var(--border2)'}`, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)', fontFamily: 'inherit' }),
  btn: { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' },
  btnSm: { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  btnObs: { background: 'rgba(167,139,250,.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,.2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDet: { background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px var(--shadow)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalBoxSm: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 420, boxShadow: '0 8px 32px var(--shadow)' },
  modalBoxDet: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, padding: 28, width: '90%', maxWidth: 480, boxShadow: '0 8px 40px var(--shadow)' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  textarea: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', minHeight: 70, resize: 'vertical' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro: { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  totalBox: { background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
}

const STATUS_NF = ['Em execução', 'Concluído']
const STATUS_PAG = ['em_andamento', 'ajustes', 'aguardando_desbloqueio', 'concluido', 'cancelado']
const STATUS_PAG_LABEL = { em_andamento: 'Em andamento', ajustes: 'Ajustes', aguardando_desbloqueio: 'Aguard. Desbloqueio', concluido: 'Concluído', cancelado: 'Cancelado' }
const STATUS_PAG_COR = { em_andamento: 'var(--blue)', ajustes: 'var(--amber)', aguardando_desbloqueio: 'var(--red)', concluido: 'var(--green)', cancelado: 'var(--muted)' }
const STATUS_RESPONSAVEL = { em_andamento: 'Financeiro', ajustes: 'Solicitante', aguardando_desbloqueio: 'Gerência', concluido: 'Financeiro', cancelado: 'Financeiro' }
const RESPONSAVEL_COR = { Financeiro: 'var(--blue)', Solicitante: 'var(--amber)', Gerência: 'var(--red)' }

function statusNfBadge(s) {
  const cfg = { 'Em execução': ['var(--blue-dim)', 'var(--blue)'], 'Concluído': ['var(--green-dim)', 'var(--green)'] }[s] || ['var(--subtle)', 'var(--muted)']
  return <span style={{ background: cfg[0], color: cfg[1], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>● {s}</span>
}

function statusPagBadge(s) {
  const cor = STATUS_PAG_COR[s] || 'var(--muted)'
  return <span style={{ background: `${cor}18`, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>● {STATUS_PAG_LABEL[s] || s}</span>
}

function responsavelBadge(s) {
  const resp = STATUS_RESPONSAVEL[s] || '—'
  const cor = RESPONSAVEL_COR[resp] || 'var(--muted)'
  return <span style={{ background: `${cor}12`, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{resp}</span>
}

function fmtData(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
function fmtVal(v) { if (!v && v !== 0) return '—'; return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

export default function Financeiro({ isAdmin = false }) {
  const [aba, setAba] = useState('nf')
  const [emissoes, setEmissoes] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalNF, setModalNF] = useState(false)
  const [modalPag, setModalPag] = useState(false)
  const [modalObs, setModalObs] = useState(null)
  const [modalDet, setModalDet] = useState(null)
  const [editandoNF, setEditandoNF] = useState(null)
  const [editandoPag, setEditandoPag] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [formNF, setFormNF] = useState({ id_sgt: '', empresa: '', status_sgt: 'Em execução', data_conclusao_sgt: '', consultor: '', nf_boleto_enviado: false, data_solicitacao_envio: '', numero_nf: '', valor_parcela: '', numero_parcelas: 1, observacoes: '' })
  const [formPag, setFormPag] = useState({ numero_chamado: '', tipo_tarefa: 'Solicitação de Pagamento', solicitante: '', numero_nf_boleto_al: '', descricao: '', razao_social: '', status: 'em_andamento', valor: '', previsao_pagamento: '', observacoes: '' })

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    const [e, p] = await Promise.all([
      supabase.from('emissoes_nf').select('*').order('created_at', { ascending: false }),
      supabase.from('solicitacoes_pagamento').select('*').order('created_at', { ascending: false }),
    ])
    setEmissoes(e.data || [])
    setPagamentos(p.data || [])
    setLoading(false)
  }

  function abrirNovoNF() { setEditandoNF(null); setErro(''); setFormNF({ id_sgt: '', empresa: '', status_sgt: 'Em execução', data_conclusao_sgt: '', consultor: '', nf_boleto_enviado: false, data_solicitacao_envio: '', numero_nf: '', valor_parcela: '', numero_parcelas: 1, observacoes: '' }); setModalNF(true) }
  function abrirEditarNF(r) { setEditandoNF(r); setErro(''); setFormNF({ id_sgt: r.id_sgt, empresa: r.empresa, status_sgt: r.status_sgt || 'Em execução', data_conclusao_sgt: r.data_conclusao_sgt || '', consultor: r.consultor || '', nf_boleto_enviado: r.nf_boleto_enviado || false, data_solicitacao_envio: r.data_solicitacao_envio || '', numero_nf: r.numero_nf || '', valor_parcela: r.valor_parcela || '', numero_parcelas: r.numero_parcelas || 1, observacoes: r.observacoes || '' }); setModalNF(true) }
  function abrirNovoPag() { setEditandoPag(null); setErro(''); setFormPag({ numero_chamado: '', tipo_tarefa: 'Solicitação de Pagamento', solicitante: '', numero_nf_boleto_al: '', descricao: '', razao_social: '', status: 'em_andamento', valor: '', previsao_pagamento: '', observacoes: '' }); setModalPag(true) }
  function abrirEditarPag(r) { setEditandoPag(r); setErro(''); setFormPag({ numero_chamado: r.numero_chamado, tipo_tarefa: r.tipo_tarefa || 'Solicitação de Pagamento', solicitante: r.solicitante || '', numero_nf_boleto_al: r.numero_nf_boleto_al || '', descricao: r.descricao || '', razao_social: r.razao_social || '', status: r.status || 'em_andamento', valor: r.valor || '', previsao_pagamento: r.previsao_pagamento || '', observacoes: r.observacoes || '' }); setModalPag(true) }

  async function salvarNF() {
    if (!formNF.id_sgt || !formNF.empresa) { setErro('ID SGT e Empresa são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const parcelas = parseInt(formNF.numero_parcelas) || 1
    const valorParcela = parseFloat(formNF.valor_parcela) || 0
    const dados = { id_sgt: formNF.id_sgt.trim(), empresa: formNF.empresa.trim(), status_sgt: formNF.status_sgt, data_conclusao_sgt: formNF.data_conclusao_sgt || null, consultor: formNF.consultor || null, nf_boleto_enviado: formNF.nf_boleto_enviado, data_solicitacao_envio: formNF.data_solicitacao_envio || null, numero_nf: formNF.numero_nf || null, valor_parcela: valorParcela, numero_parcelas: parcelas, valor_total: valorParcela * parcelas, observacoes: formNF.observacoes || null }
    let error
    if (editandoNF) { ({ error } = await supabase.from('emissoes_nf').update(dados).eq('id', editandoNF.id)) }
    else { ({ error } = await supabase.from('emissoes_nf').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModalNF(false); init()
  }

  async function salvarPag() {
    if (!formPag.numero_chamado) { setErro('Número do chamado é obrigatório.'); return }
    setSalvando(true); setErro('')
    const dados = { numero_chamado: formPag.numero_chamado.trim(), tipo_tarefa: formPag.tipo_tarefa, solicitante: formPag.solicitante || null, numero_nf_boleto_al: formPag.numero_nf_boleto_al || null, descricao: formPag.descricao || null, razao_social: formPag.razao_social || null, status: formPag.status, valor: parseFloat(formPag.valor) || null, previsao_pagamento: formPag.previsao_pagamento || null, observacoes: formPag.observacoes || null }
    let error
    if (editandoPag) { ({ error } = await supabase.from('solicitacoes_pagamento').update(dados).eq('id', editandoPag.id)) }
    else { ({ error } = await supabase.from('solicitacoes_pagamento').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModalPag(false); init()
  }

  async function excluirNF(id) { if (!confirm('Excluir este registro?')) return; await supabase.from('emissoes_nf').delete().eq('id', id); init() }
  async function excluirPag(id) { if (!confirm('Excluir este registro?')) return; await supabase.from('solicitacoes_pagamento').delete().eq('id', id); init() }

  const totalNF = (r) => (parseFloat(r.valor_parcela) || 0) * (parseInt(r.numero_parcelas) || 1)

  const emissoesFiltradas = emissoes.filter(r => {
    if (filtroStatus && r.status_sgt !== filtroStatus) return false
    if (busca) { const b = busca.toLowerCase(); return r.id_sgt?.toLowerCase().includes(b) || r.empresa?.toLowerCase().includes(b) || r.consultor?.toLowerCase().includes(b) }
    return true
  })

  const pagamentosFiltrados = pagamentos.filter(r => {
    if (filtroStatus && r.status !== filtroStatus) return false
    if (busca) { const b = busca.toLowerCase(); return r.numero_chamado?.toLowerCase().includes(b) || r.razao_social?.toLowerCase().includes(b) || r.solicitante?.toLowerCase().includes(b) }
    return true
  })

  const trHover = { onMouseEnter: e => e.currentTarget.style.background = 'var(--subtle)', onMouseLeave: e => e.currentTarget.style.background = 'transparent' }
  const valorTotalNFs = emissoes.reduce((acc, r) => acc + totalNF(r), 0)
  const totalParcelas = (parseFloat(formNF.valor_parcela) || 0) * (parseInt(formNF.numero_parcelas) || 1)

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div><div style={S.title}>Financeiro</div><div style={S.sub}>Emissão de NFs e Solicitações de Pagamento</div></div>
        {isAdmin && (
          <button style={S.btn} onClick={() => aba === 'nf' ? abrirNovoNF() : abrirNovoPag()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {aba === 'nf' ? 'Nova Emissão NF' : 'Nova Solicitação'}
          </button>
        )}
      </div>

      <div style={S.stats}>
        {[
          ['var(--blue)', emissoes.length, 'Total NFs'],
          ['var(--blue)', emissoes.filter(e => e.status_sgt === 'Em execução').length, 'Em Execução'],
          ['var(--green)', emissoes.filter(e => e.status_sgt === 'Concluído' && e.nf_boleto_enviado).length, 'NFs Concluídas'],
          ['var(--purple)', pagamentos.length, 'Total Pagamentos'],
          ['var(--amber)', pagamentos.filter(p => p.status === 'aguardando_desbloqueio').length, 'Aguard. Desbloqueio'],
        ].map(([cor, val, lbl]) => (
          <div key={lbl} style={S.statCard}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

      <div style={S.tabs}>
        <button style={S.tab(aba === 'nf')} onClick={() => { setAba('nf'); setBusca(''); setFiltroStatus('') }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Emissão de NFs <span style={S.tabCount(aba === 'nf')}>{emissoes.length}</span>
        </button>
        <button style={S.tab(aba === 'pag')} onClick={() => { setAba('pag'); setBusca(''); setFiltroStatus('') }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Solicitações de Pagamento <span style={S.tabCount(aba === 'pag')}>{pagamentos.length}</span>
        </button>
      </div>

      {aba === 'nf' && (
        <>
          <div style={S.toolbar}>
            <input style={S.search} placeholder="Buscar empresa, ID SGT, consultor..." value={busca} onChange={e => setBusca(e.target.value)} />
            <button style={S.filtro(!filtroStatus)} onClick={() => setFiltroStatus('')}>Todos</button>
            {STATUS_NF.map(s => <button key={s} style={S.filtro(filtroStatus === s)} onClick={() => setFiltroStatus(s)}>{s}</button>)}
            {valorTotalNFs > 0 && (
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Total geral: <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>{fmtVal(valorTotalNFs)}</span>
              </div>
            )}
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
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', color: 'var(--blue)', fontWeight: 500 }}>{r.id_sgt}</td>
                  <td style={{ ...S.td, color: 'var(--text)', fontWeight: 500, maxWidth: 180 }}>{r.empresa}</td>
                  <td style={S.td}>{statusNfBadge(r.status_sgt)}</td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(r.data_conclusao_sgt)}</td>
                  <td style={S.td}>{r.consultor || '—'}</td>
                  <td style={S.td}><span style={{ background: r.nf_boleto_enviado ? 'var(--green-dim)' : 'var(--red-dim)', color: r.nf_boleto_enviado ? 'var(--green)' : 'var(--red)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{r.nf_boleto_enviado ? 'SIM' : 'NÃO'}</span></td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(r.data_solicitacao_envio)}</td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--purple)' }}>{r.numero_nf || '—'}</td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtVal(r.valor_parcela)}</td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, textAlign: 'center' }}>{r.numero_parcelas || '—'}</td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{fmtVal(totalNF(r))}</td>
                  {isAdmin && <td style={S.td}><div style={{ display: 'flex', gap: 4 }}><button style={S.btnSm} onClick={() => abrirEditarNF(r)}>Editar</button><button style={S.btnDanger} onClick={() => excluirNF(r.id)}>✕</button></div></td>}
                </tr>
              ))}
              {emissoesFiltradas.length === 0 && <tr><td colSpan={isAdmin ? 12 : 11} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{loading ? 'Carregando...' : 'Nenhum registro.'}</td></tr>}
            </tbody>
          </table></div>
        </>
      )}

      {aba === 'pag' && (
        <>
          <div style={S.toolbar}>
            <input style={S.search} placeholder="Buscar chamado, razão social, solicitante..." value={busca} onChange={e => setBusca(e.target.value)} />
            <button style={S.filtro(!filtroStatus)} onClick={() => setFiltroStatus('')}>Todos</button>
            {STATUS_PAG.map(s => <button key={s} style={S.filtro(filtroStatus === s)} onClick={() => setFiltroStatus(s)}>{STATUS_PAG_LABEL[s]}</button>)}
          </div>
          <div style={S.tableWrap}><table style={S.table}>
            <thead><tr>
              <th style={S.th}>Chamado</th>
              <th style={S.th}>Tipo de Tarefa</th>
              <th style={S.th}>Solicitante</th>
              <th style={S.th}>Nº NF / Boleto / AL</th>
              <th style={S.th}>Razão Social</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Responsável</th>
              <th style={S.th}>Valor / Previsão</th>
              {isAdmin && <th style={S.th}></th>}
            </tr></thead>
            <tbody>
              {pagamentosFiltrados.map(r => (
                <tr key={r.id} {...trHover}>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', color: 'var(--blue)', fontWeight: 500 }}>{r.numero_chamado}</td>
                  <td style={S.td}>{r.tipo_tarefa}</td>
                  <td style={S.td}>{r.solicitante || '—'}</td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--purple)' }}>{r.numero_nf_boleto_al || '—'}</td>
                  <td style={{ ...S.td, color: 'var(--text)', fontWeight: 500, maxWidth: 180 }}>{r.razao_social || '—'}</td>
                  <td style={S.td}>{statusPagBadge(r.status)}</td>
                  <td style={S.td}>{responsavelBadge(r.status)}</td>
                  <td style={S.td}>
                    {r.valor ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12.5, color: 'var(--green)', fontWeight: 500 }}>{fmtVal(r.valor)}</span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: r.previsao_pagamento ? 'var(--muted)' : 'var(--border2)' }}>
                          {r.previsao_pagamento ? `Prev. ${fmtData(r.previsao_pagamento)}` : 'Sem previsão'}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--border2)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={S.btnDet} onClick={() => setModalDet(r)}>Detalhes</button>
                        {r.observacoes && <button style={S.btnObs} onClick={() => setModalObs(r)}>Obs.</button>}
                        <button style={S.btnSm} onClick={() => abrirEditarPag(r)}>Editar</button>
                        <button style={S.btnDanger} onClick={() => excluirPag(r.id)}>✕</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {pagamentosFiltrados.length === 0 && <tr><td colSpan={isAdmin ? 9 : 8} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{loading ? 'Carregando...' : 'Nenhum registro.'}</td></tr>}
            </tbody>
          </table></div>
        </>
      )}

      {/* MODAL DETALHES */}
      {modalDet && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalDet(null)}>
          <div style={S.modalBoxDet}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Detalhes da Solicitação</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>Chamado #{modalDet.numero_chamado}</div>
              </div>
              <button onClick={() => setModalDet(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>Solicitante</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{modalDet.solicitante || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>Nº NF / Boleto / AL</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#a78bfa' }}>{modalDet.numero_nf_boleto_al || '—'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 5 }}>Razão Social</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{modalDet.razao_social || '—'}</div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 8 }}>Descrição</div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>
              {modalDet.descricao || '—'}
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.07), rgba(6,182,212,.04))', border: '1px solid rgba(59,130,246,.2)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 6 }}>Valor</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 500, color: 'var(--blue)' }}>{fmtVal(modalDet.valor)}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {modalDet.previsao_pagamento ? `Previsão: ${fmtData(modalDet.previsao_pagamento)}` : 'Sem previsão de pagamento'}
                </div>
              </div>
              <div>{statusPagBadge(modalDet.status)}</div>
            </div>

            {modalDet.observacoes && (
              <div style={{ background: 'rgba(167,139,250,.06)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
                <div style={{ fontSize: 10, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, marginBottom: 6 }}>Observações</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{modalDet.observacoes}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={S.btnSm} onClick={() => setModalDet(null)}>Fechar</button>
              {isAdmin && <button style={S.btn} onClick={() => { setModalDet(null); abrirEditarPag(modalDet) }}>Editar</button>}
            </div>
          </div>
        </div>
      )}

      {/* MODAL OBSERVAÇÕES */}
      {modalObs && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalObs(null)}>
          <div style={S.modalBoxSm}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Observações</div>
                <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--blue)', marginTop: 3 }}>Chamado {modalObs.numero_chamado}</div>
              </div>
              <button onClick={() => setModalObs(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {modalObs.observacoes}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {statusPagBadge(modalObs.status)}
              {responsavelBadge(modalObs.status)}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NF */}
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
            {totalParcelas > 0 && <div style={S.totalBox}><span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>Valor total do serviço</span><span style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 600, color: 'var(--blue)' }}>{fmtVal(totalParcelas)}</span></div>}
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={S.textarea} value={formNF.observacoes} onChange={e => setFormNF({ ...formNF, observacoes: e.target.value })} /></div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setModalNF(false)}>Cancelar</button><button style={S.btn} onClick={salvarNF} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}

      {/* MODAL PAGAMENTO */}
      {modalPag && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalPag(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoPag ? 'Editar Solicitação' : 'Nova Solicitação de Pagamento'}</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Nº Chamado *</label><input style={S.input} value={formPag.numero_chamado} onChange={e => setFormPag({ ...formPag, numero_chamado: e.target.value })} placeholder="1346676" /></div>
              <div style={S.field}><label style={S.label}>Status</label><select style={S.fsel} value={formPag.status} onChange={e => setFormPag({ ...formPag, status: e.target.value })}>{STATUS_PAG.map(s => <option key={s} value={s}>{STATUS_PAG_LABEL[s]}</option>)}</select></div>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Responsável atual</span>
              {responsavelBadge(formPag.status)}
            </div>
            <div style={S.field}><label style={S.label}>Tipo de Tarefa</label><input style={S.input} value={formPag.tipo_tarefa} onChange={e => setFormPag({ ...formPag, tipo_tarefa: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Solicitante</label><input style={S.input} value={formPag.solicitante} onChange={e => setFormPag({ ...formPag, solicitante: e.target.value })} placeholder="Ex: IST - MPP - Energia" /></div>
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
    </div>
  )
}