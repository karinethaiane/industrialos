import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  wrap: { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub: { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 22 },
  statCard: (cor) => ({ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px var(--shadow)', '--accent': cor }),
  statBar: (cor) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: cor, opacity: .5 }),
  statVal: (cor) => ({ fontFamily: 'DM Mono, monospace', fontSize: 26, fontWeight: 500, color: cor, lineHeight: 1, marginBottom: 5 }),
  statLbl: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 },
  tab: (on) => ({ padding: '9px 18px', fontSize: 13, fontWeight: on ? 600 : 500, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: on ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, fontFamily: 'inherit', transition: 'all .15s' }),
  toolbar: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  sbox: { display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 12px', flex: 1, minWidth: 180 },
  sinp: { background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', width: '100%' },
  sel: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', color: 'var(--text2)', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  btn: { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px var(--blue-glow)', whiteSpace: 'nowrap' },
  btnSm: { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px var(--shadow)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' },
  td: { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 6 },
  modalSub: { fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  proxBox: { background: 'var(--surface2)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 14 },
  proxLbl: { fontSize: 11, color: 'var(--blue)', fontWeight: 700, marginBottom: 4 },
  proxVal: { fontFamily: 'DM Mono, monospace', fontSize: 15, color: 'var(--blue)', fontWeight: 500 },
  colabCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 10, overflow: 'hidden' },
  colabCardHeader: { padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' },
  colabCardName: { fontWeight: 600, fontSize: 14, color: 'var(--text)' },
  colabCardMat: { fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', marginTop: 2 },
  checkItem: (ok) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderTop: '1px solid var(--border)', background: ok ? 'transparent' : 'rgba(239,68,68,.03)' }),
  checkIcon: (ok) => ({ width: 20, height: 20, borderRadius: '50%', background: ok ? 'var(--green-dim)' : 'var(--red-dim)', color: ok ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }),
  checkName: (ok) => ({ fontSize: 13, color: ok ? 'var(--text2)' : 'var(--text)', flex: 1 }),
  checkDate: { fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' },
}

function badge(status) {
  const cfg = {
    VIGENTE: { bg: 'var(--green-dim)', c: 'var(--green)', l: '● Vigente' },
    VENCENDO: { bg: 'var(--amber-dim)', c: 'var(--amber)', l: '⚠ Vencendo' },
    VENCIDO: { bg: 'var(--red-dim)', c: 'var(--red)', l: '✕ Vencido' },
  }[status] || { bg: 'var(--subtle)', c: 'var(--muted)', l: status }
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.c }}>{cfg.l}</span>
}

function calcStatus(dataProx) {
  if (!dataProx) return 'VENCIDO'
  const dias = Math.floor((new Date(dataProx) - new Date()) / 86400000)
  if (dias < 0) return 'VENCIDO'
  if (dias <= 30) return 'VENCENDO'
  return 'VIGENTE'
}

function fmtData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function normalizar(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function epiMatch(entregue, kitItem) {
  const a = normalizar(entregue), b = normalizar(kitItem)
  return a.includes(b) || b.includes(a) || a === b
}

export default function Epis({ isAdmin = false }) {
  const [epis, setEpis] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [kitItens, setKitItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('entregas')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [modalHist, setModalHist] = useState(null)
  const [historico, setHistorico] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroColab, setFiltroColab] = useState('')
  const [buscaCheck, setBuscaCheck] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [form, setForm] = useState({ colaborador_id: '', catalogo_id: '', data_entrega: '', quantidade: 1, motivo: '', ca: '' })
  const [editForm, setEditForm] = useState({ data_entrega: '', quantidade: 1, ca: '', motivo: '', data_prox_entrega: '' })
  const [proxEntrega, setProxEntrega] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    const [e, cat, col, ki] = await Promise.all([
      supabase.from('epis').select('*, colaboradores(nome, matricula)').order('data_prox_entrega'),
      supabase.from('epis_catalogo').select('*').eq('ativo', true).order('nome'),
      supabase.from('colaboradores').select('*, epi_kits(id, nome)').eq('ativo', true).order('nome'),
      supabase.from('epi_kit_itens').select('*'),
    ])
    setEpis(e.data || [])
    setCatalogo(cat.data || [])
    setColaboradores(col.data || [])
    setKitItens(ki.data || [])
    setLoading(false)
  }

  function calcProxEntrega(catalogoId, dataEntrega) {
    const item = catalogo.find(c => c.id === catalogoId)
    if (!item || !dataEntrega) return null
    const d = new Date(dataEntrega)
    d.setDate(d.getDate() + item.prazo_dias)
    return d.toISOString().split('T')[0]
  }

  function onChangeCatalogo(id) {
    setForm(f => ({ ...f, catalogo_id: id }))
    if (form.data_entrega) setProxEntrega(calcProxEntrega(id, form.data_entrega))
  }

  function onChangeData(d) {
    setForm(f => ({ ...f, data_entrega: d }))
    if (form.catalogo_id) setProxEntrega(calcProxEntrega(form.catalogo_id, d))
  }

  function abrirEditar(epi) {
    setEditando(epi)
    setEditForm({ data_entrega: epi.data_entrega || '', quantidade: epi.quantidade || 1, ca: epi.ca || '', motivo: epi.motivo || '', data_prox_entrega: epi.data_prox_entrega || '' })
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    await supabase.from('epis').update({ data_entrega: editForm.data_entrega, quantidade: editForm.quantidade, ca: editForm.ca || null, motivo: editForm.motivo, data_prox_entrega: editForm.data_prox_entrega, data_vencimento: editForm.data_prox_entrega }).eq('id', editando.id)
    setEditando(null); setSalvando(false); init()
  }

  async function salvar() {
    if (!form.colaborador_id || !form.catalogo_id || !form.data_entrega) return
    setSalvando(true)
    const item = catalogo.find(c => c.id === form.catalogo_id)
    await supabase.from('epis').insert({ colaborador_id: form.colaborador_id, tipo: item.nome, quantidade: form.quantidade, data_entrega: form.data_entrega, data_vencimento: proxEntrega, data_prox_entrega: proxEntrega, motivo: form.motivo, ca: form.ca || null, registrado_por: 'admin' })
    setForm({ colaborador_id: '', catalogo_id: '', data_entrega: '', quantidade: 1, motivo: '', ca: '' })
    setProxEntrega(null); setModal(false); setSalvando(false); init()
  }

  async function excluirEpi(id) {
    if (!confirm('Excluir este registro?')) return
    await supabase.from('epis').delete().eq('id', id)
    init()
  }

  async function verHistorico(epi) {
    setModalHist(epi)
    const { data } = await supabase.from('epis').select('*').eq('colaborador_id', epi.colaborador_id).order('data_entrega', { ascending: false })
    setHistorico(data || [])
  }

  function montarChecklist() {
    return colaboradores.filter(c => c.epi_kits).filter(c => !buscaCheck || normalizar(c.nome).includes(normalizar(buscaCheck))).map(c => {
      const itensDoKit = kitItens.filter(k => k.kit_id === c.epi_kits.id)
      const episDoColab = epis.filter(e => e.colaborador_id === c.id)
      const itens = itensDoKit.map(kitItem => {
        const entrega = episDoColab.find(e => epiMatch(e.tipo, kitItem.epi_nome))
        return { nome: kitItem.epi_nome, entregue: !!entrega, dataEntrega: entrega?.data_entrega, dataProx: entrega?.data_prox_entrega, status: entrega ? calcStatus(entrega.data_prox_entrega) : null }
      })
      return { ...c, itens, pendentes: itens.filter(i => !i.entregue).length, vencidos: itens.filter(i => i.status === 'VENCIDO').length, vencendo: itens.filter(i => i.status === 'VENCENDO').length }
    })
  }

  const checklist = montarChecklist()
  const totalPendentes = checklist.reduce((a, c) => a + c.pendentes, 0)
  const totalVencidos = checklist.reduce((a, c) => a + c.vencidos, 0)
  const colabsOk = checklist.filter(c => c.pendentes === 0 && c.vencidos === 0 && c.vencendo === 0).length

  const filtrado = epis.filter(e => {
    const nome = e.colaboradores?.nome || '', tipo = e.tipo || '', status = calcStatus(e.data_prox_entrega)
    return (!busca || nome.toLowerCase().includes(busca.toLowerCase()) || tipo.toLowerCase().includes(busca.toLowerCase())) && (!filtroStatus || status === filtroStatus) && (!filtroColab || e.colaborador_id === filtroColab)
  })

  const stats = { total: epis.length, vigente: epis.filter(e => calcStatus(e.data_prox_entrega) === 'VIGENTE').length, vencendo: epis.filter(e => calcStatus(e.data_prox_entrega) === 'VENCENDO').length, vencido: epis.filter(e => calcStatus(e.data_prox_entrega) === 'VENCIDO').length }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Gestão de EPIs</div>
          <div style={S.sub}>Controle de entregas e validades</div>
        </div>
        {isAdmin && <button style={S.btn} onClick={() => setModal(true)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Registrar Entrega</button>}
      </div>

      <div style={S.stats}>
        {[['var(--blue)', stats.total, 'Entregas'], ['var(--green)', stats.vigente, 'Vigentes'], ['var(--amber)', stats.vencendo, 'Vencendo 30d'], ['var(--red)', stats.vencido, 'Vencidos'], ['var(--purple)', totalPendentes, 'Pendências Kit']].map(([cor, val, lbl]) => (
          <div key={lbl} style={S.statCard(cor)}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

      <div style={S.tabs}>
        <button style={S.tab(aba === 'entregas')} onClick={() => setAba('entregas')}>Entregas</button>
        <button style={S.tab(aba === 'checklist')} onClick={() => setAba('checklist')}>
          Checklist de Kits {totalPendentes > 0 && <span style={{ color: 'var(--red)', marginLeft: 4 }}>({totalPendentes})</span>}
        </button>
      </div>

      {aba === 'entregas' && (
        <>
          <div style={S.toolbar}>
            <div style={S.sbox}>
              <svg width="13" height="13" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={S.sinp} placeholder="Buscar colaborador ou EPI..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <select style={S.sel} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os Status</option>
              <option value="VIGENTE">Vigente</option>
              <option value="VENCENDO">Vencendo</option>
              <option value="VENCIDO">Vencido</option>
            </select>
            <select style={S.sel} value={filtroColab} onChange={e => setFiltroColab(e.target.value)}>
              <option value="">Todos os Colaboradores</option>
              {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          {loading ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Carregando...</div> : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Colaborador</th><th style={S.th}>EPI</th><th style={S.th}>CA</th>
                    <th style={S.th}>Qtd</th><th style={S.th}>Última Entrega</th>
                    <th style={S.th}>Próxima Entrega</th><th style={S.th}>Status</th>
                    {isAdmin && <th style={S.th}></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map(e => (
                    <tr key={e.id} onMouseEnter={ev => ev.currentTarget.style.background = 'var(--subtle)'} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...S.td, color: 'var(--text)', fontWeight: 500 }}>
                        {e.colaboradores?.nome}
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{e.colaboradores?.matricula}</div>
                      </td>
                      <td style={S.td}>{e.tipo}</td>
                      <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--blue)' }}>{e.ca || '—'}</td>
                      <td style={{ ...S.td, fontFamily: 'DM Mono, monospace' }}>{e.quantidade}</td>
                      <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(e.data_entrega)}</td>
                      <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, color: calcStatus(e.data_prox_entrega) === 'VENCIDO' ? 'var(--red)' : calcStatus(e.data_prox_entrega) === 'VENCENDO' ? 'var(--amber)' : 'var(--text2)' }}>{fmtData(e.data_prox_entrega)}</td>
                      <td style={S.td}>{badge(calcStatus(e.data_prox_entrega))}</td>
                      {isAdmin && <td style={{ ...S.td }}><div style={{ display: 'flex', gap: 4 }}><button style={S.btnSm} onClick={() => abrirEditar(e)}>Editar</button><button style={S.btnSm} onClick={() => verHistorico(e)}>Histórico</button><button style={S.btnDanger} onClick={() => excluirEpi(e.id)}>✕</button></div></td>}
                    </tr>
                  ))}
                  {filtrado.length === 0 && <tr><td colSpan={isAdmin ? 8 : 7} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{epis.length === 0 ? 'Nenhuma entrega registrada ainda.' : 'Nenhum resultado.'}</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {aba === 'checklist' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['var(--red)', totalPendentes, 'itens sem registro'], ['var(--amber)', totalVencidos, 'itens vencidos'], ['var(--green)', colabsOk, 'colaboradores 100% ok']].map(([cor, val, lbl]) => (
              <div key={lbl} style={{ background: 'var(--surface)', border: `1px solid ${cor}33`, borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
                <span style={{ color: cor, fontWeight: 700, fontFamily: 'DM Mono, monospace', fontSize: 18 }}>{val}</span>
                <span style={{ color: 'var(--text2)', marginLeft: 6 }}>{lbl}</span>
              </div>
            ))}
          </div>
          <div style={S.toolbar}>
            <div style={S.sbox}>
              <svg width="13" height="13" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={S.sinp} placeholder="Buscar colaborador..." value={buscaCheck} onChange={e => setBuscaCheck(e.target.value)} />
            </div>
          </div>
          {checklist.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Nenhum colaborador com kit atribuído.</div>}
          {checklist.map(c => (
            <div key={c.id} style={S.colabCard}>
              <div style={S.colabCardHeader} onClick={() => setExpandido(expandido === c.id ? null : c.id)}>
                <div><div style={S.colabCardName}>{c.nome}</div><div style={S.colabCardMat}>{c.matricula} · {c.epi_kits?.nome}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {c.pendentes > 0 && <span style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.pendentes} pendente{c.pendentes > 1 ? 's' : ''}</span>}
                  {c.vencidos > 0 && <span style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.vencidos} vencido{c.vencidos > 1 ? 's' : ''}</span>}
                  {c.vencendo > 0 && <span style={{ background: 'var(--amber-dim)', color: 'var(--amber)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.vencendo} vencendo</span>}
                  {c.pendentes === 0 && c.vencidos === 0 && c.vencendo === 0 && <span style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>✓ Tudo ok</span>}
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>{expandido === c.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandido === c.id && c.itens.map((item, i) => (
                <div key={i} style={S.checkItem(item.entregue)}>
                  <div style={S.checkIcon(item.entregue)}>{item.entregue ? '✓' : '!'}</div>
                  <div style={S.checkName(item.entregue)}>{item.nome}</div>
                  {item.entregue ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={S.checkDate}>Entregue: {fmtData(item.dataEntrega)}</div>
                      <div style={{ marginTop: 2 }}>{badge(item.status)}</div>
                    </div>
                  ) : <span style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Sem registro</span>}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Registrar Entrega de EPI</div>
            <div style={S.field}><label style={S.label}>Colaborador *</label>
              <select style={S.fsel} value={form.colaborador_id} onChange={e => setForm({ ...form, colaborador_id: e.target.value })}>
                <option value="">Selecione...</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>EPI *</label>
              <select style={S.fsel} value={form.catalogo_id} onChange={e => onChangeCatalogo(e.target.value)}>
                <option value="">Selecione...</option>
                {catalogo.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.prazo_dias}d)</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Data da Entrega *</label><input type="date" style={S.input} value={form.data_entrega} onChange={e => onChangeData(e.target.value)} /></div>
            <div style={S.field}><label style={S.label}>Quantidade</label><input type="number" min="1" style={S.input} value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></div>
            {proxEntrega && (
              <div style={S.proxBox}>
                <div style={S.proxLbl}>Próxima entrega calculada automaticamente</div>
                <div style={S.proxVal}>{fmtData(proxEntrega)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{catalogo.find(c => c.id === form.catalogo_id)?.prazo_dias} dias a partir da entrega</div>
              </div>
            )}
            <div style={S.field}><label style={S.label}>Nº CA</label><input style={S.input} placeholder="Ex: CA-12345" value={form.ca || ''} onChange={e => setForm({ ...form, ca: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Motivo</label>
              <select style={S.fsel} value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })}>
                <option value="">Selecione...</option>
                <option>1ª Entrega</option><option>Substituição por vencimento</option><option>Substituição por desgaste</option><option>Substituição por perda</option><option>Substituição por dano</option>
              </select>
            </div>
            <div style={S.row}><button style={S.btnSm} onClick={() => { setModal(false); setProxEntrega(null) }}>Cancelar</button><button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar Entrega'}</button></div>
          </div>
        </div>
      )}

      {editando && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setEditando(null)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Editar Entrega</div>
            <div style={S.modalSub}>{editando.colaboradores?.nome} · {editando.tipo}</div>
            <div style={S.field}><label style={S.label}>Data da Entrega</label><input type="date" style={S.input} value={editForm.data_entrega} onChange={e => setEditForm({ ...editForm, data_entrega: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Próxima Entrega</label><input type="date" style={S.input} value={editForm.data_prox_entrega} onChange={e => setEditForm({ ...editForm, data_prox_entrega: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Nº CA</label><input style={S.input} placeholder="Ex: CA-12345" value={editForm.ca} onChange={e => setEditForm({ ...editForm, ca: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Quantidade</label><input type="number" min="1" style={S.input} value={editForm.quantidade} onChange={e => setEditForm({ ...editForm, quantidade: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Motivo</label>
              <select style={S.fsel} value={editForm.motivo} onChange={e => setEditForm({ ...editForm, motivo: e.target.value })}>
                <option value="">Selecione...</option>
                <option>1ª Entrega</option><option>Substituição por vencimento</option><option>Substituição por desgaste</option><option>Substituição por perda</option><option>Substituição por dano</option>
              </select>
            </div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setEditando(null)}>Cancelar</button><button style={S.btn} onClick={salvarEdicao} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}

      {modalHist && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalHist(null)}>
          <div style={{ ...S.modalBox, maxWidth: 620 }}>
            <div style={S.modalTitle}>Histórico — {modalHist.colaboradores?.nome}</div>
            <div style={S.modalSub}>{modalHist.colaboradores?.matricula}</div>
            {historico.length === 0 ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>Nenhum registro encontrado</div> : (
              <table style={{ ...S.table, border: 'none' }}>
                <thead><tr><th style={S.th}>EPI</th><th style={S.th}>CA</th><th style={S.th}>Entrega</th><th style={S.th}>Próxima</th><th style={S.th}>Motivo</th><th style={S.th}>Status</th></tr></thead>
                <tbody>
                  {historico.map(h => (
                    <tr key={h.id}>
                      <td style={{ ...S.td, color: 'var(--text)' }}>{h.tipo}</td>
                      <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--blue)' }}>{h.ca || '—'}</td>
                      <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(h.data_entrega)}</td>
                      <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(h.data_prox_entrega)}</td>
                      <td style={{ ...S.td, fontSize: 12 }}>{h.motivo || '—'}</td>
                      <td style={S.td}>{badge(calcStatus(h.data_prox_entrega))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={S.row}><button style={S.btnSm} onClick={() => setModalHist(null)}>Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}