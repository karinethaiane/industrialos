import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  wrap: { padding: 24, background: '#07090f', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#f97316' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 20 },
  statCard: (cor) => ({ background: '#0e1117', border: `1px solid ${cor}33`, borderRadius: 10, padding: '14px 16px' }),
  statVal: (cor) => ({ fontFamily: 'monospace', fontSize: 26, fontWeight: 800, color: cor, lineHeight: 1 }),
  statLbl: { fontSize: 11, color: '#3d4d66', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 4 },
  tabs: { display: 'flex', gap: 2, background: '#0e1117', border: '1px solid #1e2535', borderRadius: 8, padding: 3, marginBottom: 18, width: 'fit-content' },
  tab: (on) => ({ padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: on ? 600 : 400, cursor: 'pointer', color: on ? '#f97316' : '#8892a4', background: on ? 'rgba(249,115,22,.1)' : 'transparent', border: 'none' }),
  toolbar: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  sbox: { display: 'flex', alignItems: 'center', gap: 7, background: '#0e1117', border: '1px solid #1e2535', borderRadius: 6, padding: '7px 12px', flex: 1, minWidth: 180 },
  sinp: { background: 'none', border: 'none', outline: 'none', color: '#dde4f0', fontSize: 13, fontFamily: 'inherit', width: '100%' },
  sel: { background: '#0e1117', border: '1px solid #1e2535', borderRadius: 6, padding: '7px 10px', color: '#8892a4', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  btn: { background: '#f97316', color: '#000', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSm: { background: '#141824', color: '#8892a4', border: '1px solid #28334a', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  btnDanger: { background: 'rgba(244,63,94,.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#0e1117', borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2535' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#3d4d66', textTransform: 'uppercase', letterSpacing: '.07em', borderBottom: '1px solid #1e2535' },
  td: { padding: '10px 14px', fontSize: 13, color: '#8892a4', borderBottom: '1px solid rgba(30,37,53,.5)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: '#0e1117', border: '1px solid #28334a', borderRadius: 12, padding: 28, width: '90%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#f97316', marginBottom: 6 },
  modalSub: { fontSize: 12, color: '#3d4d66', fontFamily: 'monospace', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: '#8892a4' },
  input: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '9px 12px', color: '#dde4f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '9px 12px', color: '#dde4f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  proxBox: { background: '#141824', border: '1px solid #10d9a033', borderRadius: 7, padding: '10px 14px', marginBottom: 14 },
  proxLbl: { fontSize: 11, color: '#10d9a0', fontWeight: 700, marginBottom: 4 },
  proxVal: { fontFamily: 'monospace', fontSize: 15, color: '#10d9a0', fontWeight: 700 },
  colabCard: { background: '#0e1117', border: '1px solid #1e2535', borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
  colabCardHeader: { padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid #1e2535' },
  colabCardName: { fontWeight: 600, fontSize: 14, color: '#dde4f0' },
  colabCardMat: { fontSize: 11, color: '#3d4d66', fontFamily: 'monospace', marginTop: 2 },
  checkItem: (ok) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid rgba(30,37,53,.4)', background: ok ? 'transparent' : 'rgba(244,63,94,.04)' }),
  checkIcon: (ok) => ({ width: 20, height: 20, borderRadius: '50%', background: ok ? 'rgba(16,217,160,.15)' : 'rgba(244,63,94,.15)', color: ok ? '#10d9a0' : '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }),
  checkName: (ok) => ({ fontSize: 13, color: ok ? '#8892a4' : '#dde4f0', flex: 1 }),
  checkDate: { fontSize: 11, fontFamily: 'monospace', color: '#3d4d66' },
}

function statusBadge(status) {
  const cfg = {
    VIGENTE: { bg: 'rgba(16,217,160,.12)', color: '#10d9a0', label: '● Vigente' },
    VENCENDO: { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', label: '⚠ Vencendo' },
    VENCIDO: { bg: 'rgba(244,63,94,.12)', color: '#f43f5e', label: '✕ Vencido' },
  }[status] || { bg: '#1e2535', color: '#3d4d66', label: status }
  return <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>
}

function calcStatus(dataProx) {
  if (!dataProx) return 'VENCIDO'
  const hoje = new Date()
  const prox = new Date(dataProx)
  const dias = Math.floor((prox - hoje) / 86400000)
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
  const a = normalizar(entregue)
  const b = normalizar(kitItem)
  return a.includes(b) || b.includes(a) || a === b
}

export default function Epis() {
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
    setEditForm({
      data_entrega: epi.data_entrega || '',
      quantidade: epi.quantidade || 1,
      ca: epi.ca || '',
      motivo: epi.motivo || '',
      data_prox_entrega: epi.data_prox_entrega || '',
    })
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    await supabase.from('epis').update({
      data_entrega: editForm.data_entrega,
      quantidade: editForm.quantidade,
      ca: editForm.ca || null,
      motivo: editForm.motivo,
      data_prox_entrega: editForm.data_prox_entrega,
      data_vencimento: editForm.data_prox_entrega,
    }).eq('id', editando.id)
    setEditando(null)
    setSalvando(false)
    init()
  }

  async function salvar() {
    if (!form.colaborador_id || !form.catalogo_id || !form.data_entrega) return
    setSalvando(true)
    const item = catalogo.find(c => c.id === form.catalogo_id)
    await supabase.from('epis').insert({
      colaborador_id: form.colaborador_id,
      tipo: item.nome,
      quantidade: form.quantidade,
      data_entrega: form.data_entrega,
      data_vencimento: proxEntrega,
      data_prox_entrega: proxEntrega,
      motivo: form.motivo,
      ca: form.ca || null,
      registrado_por: 'admin',
    })
    setForm({ colaborador_id: '', catalogo_id: '', data_entrega: '', quantidade: 1, motivo: '', ca: '' })
    setProxEntrega(null)
    setModal(false)
    setSalvando(false)
    init()
  }

  async function excluirEpi(id) {
    if (!confirm('Excluir este registro?')) return
    await supabase.from('epis').delete().eq('id', id)
    init()
  }

  async function verHistorico(epi) {
    setModalHist(epi)
    const { data } = await supabase.from('epis')
      .select('*')
      .eq('colaborador_id', epi.colaborador_id)
      .order('data_entrega', { ascending: false })
    setHistorico(data || [])
  }

  function montarChecklist() {
    return colaboradores
      .filter(c => c.epi_kits)
      .filter(c => !buscaCheck || normalizar(c.nome).includes(normalizar(buscaCheck)))
      .map(c => {
        const itensDoKit = kitItens.filter(k => k.kit_id === c.epi_kits.id)
        const episDoColab = epis.filter(e => e.colaborador_id === c.id)
        const itens = itensDoKit.map(kitItem => {
          const entrega = episDoColab.find(e => epiMatch(e.tipo, kitItem.epi_nome))
          return {
            nome: kitItem.epi_nome,
            entregue: !!entrega,
            dataEntrega: entrega?.data_entrega,
            dataProx: entrega?.data_prox_entrega,
            status: entrega ? calcStatus(entrega.data_prox_entrega) : null,
          }
        })
        const pendentes = itens.filter(i => !i.entregue).length
        const vencidos = itens.filter(i => i.status === 'VENCIDO').length
        const vencendo = itens.filter(i => i.status === 'VENCENDO').length
        return { ...c, itens, pendentes, vencidos, vencendo }
      })
  }

  const checklist = montarChecklist()
  const totalPendentes = checklist.reduce((a, c) => a + c.pendentes, 0)
  const totalVencidos = checklist.reduce((a, c) => a + c.vencidos, 0)
  const colabsOk = checklist.filter(c => c.pendentes === 0 && c.vencidos === 0 && c.vencendo === 0).length

  const filtrado = epis.filter(e => {
    const nome = e.colaboradores?.nome || ''
    const tipo = e.tipo || ''
    const status = calcStatus(e.data_prox_entrega)
    const buscaOk = !busca || nome.toLowerCase().includes(busca.toLowerCase()) || tipo.toLowerCase().includes(busca.toLowerCase())
    const statusOk = !filtroStatus || status === filtroStatus
    const colabOk = !filtroColab || e.colaborador_id === filtroColab
    return buscaOk && statusOk && colabOk
  })

  const stats = {
    total: epis.length,
    vigente: epis.filter(e => calcStatus(e.data_prox_entrega) === 'VIGENTE').length,
    vencendo: epis.filter(e => calcStatus(e.data_prox_entrega) === 'VENCENDO').length,
    vencido: epis.filter(e => calcStatus(e.data_prox_entrega) === 'VENCIDO').length,
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.title}>🦺 Gestão de EPIs</div>
        <button style={S.btn} onClick={() => setModal(true)}>+ Registrar Entrega</button>
      </div>

      <div style={S.stats}>
        <div style={S.statCard('#f97316')}><div style={S.statVal('#f97316')}>{stats.total}</div><div style={S.statLbl}>Entregas</div></div>
        <div style={S.statCard('#10d9a0')}><div style={S.statVal('#10d9a0')}>{stats.vigente}</div><div style={S.statLbl}>Vigentes</div></div>
        <div style={S.statCard('#f59e0b')}><div style={S.statVal('#f59e0b')}>{stats.vencendo}</div><div style={S.statLbl}>Vencendo (30d)</div></div>
        <div style={S.statCard('#f43f5e')}><div style={S.statVal('#f43f5e')}>{stats.vencido}</div><div style={S.statLbl}>Vencidos</div></div>
        <div style={S.statCard('#a78bfa')}><div style={S.statVal('#a78bfa')}>{totalPendentes}</div><div style={S.statLbl}>Pendências Kit</div></div>
      </div>

      <div style={S.tabs}>
        <button style={S.tab(aba === 'entregas')} onClick={() => setAba('entregas')}>Entregas</button>
        <button style={S.tab(aba === 'checklist')} onClick={() => setAba('checklist')}>
          Checklist de Kits {totalPendentes > 0 && <span style={{ color: '#f43f5e', marginLeft: 4 }}>({totalPendentes})</span>}
        </button>
      </div>

      {aba === 'entregas' && (
        <>
          <div style={S.toolbar}>
            <div style={S.sbox}>
              <svg width="13" height="13" fill="none" stroke="#3d4d66" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
          {loading ? <div style={{ color: '#3d4d66', textAlign: 'center', padding: 40 }}>Carregando...</div> : (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2535' }}>
              <table style={{ ...S.table, border: 'none' }}>
                <thead>
                  <tr>
                    <th style={S.th}>Colaborador</th>
                    <th style={S.th}>EPI</th>
                    <th style={S.th}>CA</th>
                    <th style={S.th}>Qtd</th>
                    <th style={S.th}>Última Entrega</th>
                    <th style={S.th}>Próxima Entrega</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map(e => (
                    <tr key={e.id}>
                      <td style={{ ...S.td, color: '#dde4f0', fontWeight: 500 }}>
                        {e.colaboradores?.nome}
                        <div style={{ fontSize: 11, color: '#3d4d66', fontFamily: 'monospace' }}>{e.colaboradores?.matricula}</div>
                      </td>
                      <td style={S.td}>{e.tipo}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: '#f97316' }}>{e.ca || '—'}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace' }}>{e.quantidade}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtData(e.data_entrega)}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: calcStatus(e.data_prox_entrega) === 'VENCIDO' ? '#f43f5e' : calcStatus(e.data_prox_entrega) === 'VENCENDO' ? '#f59e0b' : '#8892a4' }}>
                        {fmtData(e.data_prox_entrega)}
                      </td>
                      <td style={S.td}>{statusBadge(calcStatus(e.data_prox_entrega))}</td>
                      <td style={{ ...S.td, display: 'flex', gap: 5 }}>
                        <button style={S.btnSm} onClick={() => abrirEditar(e)}>Editar</button>
                        <button style={S.btnSm} onClick={() => verHistorico(e)}>Histórico</button>
                        <button style={S.btnDanger} onClick={() => excluirEpi(e.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {filtrado.length === 0 && (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#3d4d66' }}>
                      {epis.length === 0 ? 'Nenhuma entrega registrada ainda.' : 'Nenhum resultado para os filtros aplicados.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {aba === 'checklist' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ background: '#0e1117', border: '1px solid rgba(244,63,94,.3)', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              <span style={{ color: '#f43f5e', fontWeight: 700, fontFamily: 'monospace', fontSize: 18 }}>{totalPendentes}</span>
              <span style={{ color: '#8892a4', marginLeft: 6 }}>itens sem registro</span>
            </div>
            <div style={{ background: '#0e1117', border: '1px solid rgba(245,158,11,.3)', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              <span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: 18 }}>{totalVencidos}</span>
              <span style={{ color: '#8892a4', marginLeft: 6 }}>itens vencidos</span>
            </div>
            <div style={{ background: '#0e1117', border: '1px solid rgba(16,217,160,.3)', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              <span style={{ color: '#10d9a0', fontWeight: 700, fontFamily: 'monospace', fontSize: 18 }}>{colabsOk}</span>
              <span style={{ color: '#8892a4', marginLeft: 6 }}>colaboradores 100% ok</span>
            </div>
          </div>
          <div style={S.toolbar}>
            <div style={S.sbox}>
              <svg width="13" height="13" fill="none" stroke="#3d4d66" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={S.sinp} placeholder="Buscar colaborador..." value={buscaCheck} onChange={e => setBuscaCheck(e.target.value)} />
            </div>
          </div>
          {checklist.length === 0 && (
            <div style={{ color: '#3d4d66', textAlign: 'center', padding: 40 }}>Nenhum colaborador com kit atribuído.</div>
          )}
          {checklist.map(c => (
            <div key={c.id} style={S.colabCard}>
              <div style={S.colabCardHeader} onClick={() => setExpandido(expandido === c.id ? null : c.id)}>
                <div>
                  <div style={S.colabCardName}>{c.nome}</div>
                  <div style={S.colabCardMat}>{c.matricula} · {c.epi_kits?.nome}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.pendentes > 0 && <span style={{ background: 'rgba(244,63,94,.12)', color: '#f43f5e', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.pendentes} pendente{c.pendentes > 1 ? 's' : ''}</span>}
                  {c.vencidos > 0 && <span style={{ background: 'rgba(244,63,94,.12)', color: '#f43f5e', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.vencidos} vencido{c.vencidos > 1 ? 's' : ''}</span>}
                  {c.vencendo > 0 && <span style={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.vencendo} vencendo</span>}
                  {c.pendentes === 0 && c.vencidos === 0 && c.vencendo === 0 && <span style={{ background: 'rgba(16,217,160,.12)', color: '#10d9a0', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>✓ Tudo ok</span>}
                  <span style={{ color: '#3d4d66', fontSize: 16 }}>{expandido === c.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandido === c.id && (
                <div>
                  {c.itens.map((item, i) => (
                    <div key={i} style={S.checkItem(item.entregue)}>
                      <div style={S.checkIcon(item.entregue)}>{item.entregue ? '✓' : '!'}</div>
                      <div style={S.checkName(item.entregue)}>{item.nome}</div>
                      {item.entregue ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={S.checkDate}>Entregue: {fmtData(item.dataEntrega)}</div>
                          <div style={{ marginTop: 2 }}>{statusBadge(item.status)}</div>
                        </div>
                      ) : (
                        <span style={{ background: 'rgba(244,63,94,.12)', color: '#f43f5e', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Sem registro</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* MODAL NOVO REGISTRO */}
      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Registrar Entrega de EPI</div>
            <div style={S.field}>
              <label style={S.label}>Colaborador *</label>
              <select style={S.fsel} value={form.colaborador_id} onChange={e => setForm({ ...form, colaborador_id: e.target.value })}>
                <option value="">Selecione...</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>EPI *</label>
              <select style={S.fsel} value={form.catalogo_id} onChange={e => onChangeCatalogo(e.target.value)}>
                <option value="">Selecione...</option>
                {catalogo.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.prazo_dias}d)</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Data da Entrega *</label>
              <input type="date" style={S.input} value={form.data_entrega} onChange={e => onChangeData(e.target.value)} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Quantidade</label>
              <input type="number" min="1" style={S.input} value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
            </div>
            {proxEntrega && (
              <div style={S.proxBox}>
                <div style={S.proxLbl}>Próxima entrega calculada automaticamente</div>
                <div style={S.proxVal}>{fmtData(proxEntrega)}</div>
                <div style={{ fontSize: 11, color: '#3d4d66', marginTop: 3 }}>
                  {catalogo.find(c => c.id === form.catalogo_id)?.prazo_dias} dias a partir da entrega
                </div>
              </div>
            )}
            <div style={S.field}>
              <label style={S.label}>Nº CA (Certificado de Aprovação)</label>
              <input style={S.input} placeholder="Ex: CA-12345" value={form.ca || ''} onChange={e => setForm({ ...form, ca: e.target.value })} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Motivo</label>
              <select style={S.fsel} value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })}>
                <option value="">Selecione...</option>
                <option>1ª Entrega</option>
                <option>Substituição por vencimento</option>
                <option>Substituição por desgaste</option>
                <option>Substituição por perda</option>
                <option>Substituição por dano</option>
              </select>
            </div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => { setModal(false); setProxEntrega(null) }}>Cancelar</button>
              <button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar Entrega'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR ENTREGA */}
      {editando && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setEditando(null)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Editar Entrega</div>
            <div style={S.modalSub}>{editando.colaboradores?.nome} · {editando.tipo}</div>
            <div style={S.field}>
              <label style={S.label}>Data da Entrega</label>
              <input type="date" style={S.input} value={editForm.data_entrega} onChange={e => setEditForm({ ...editForm, data_entrega: e.target.value })} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Próxima Entrega</label>
              <input type="date" style={S.input} value={editForm.data_prox_entrega} onChange={e => setEditForm({ ...editForm, data_prox_entrega: e.target.value })} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Nº CA (Certificado de Aprovação)</label>
              <input style={S.input} placeholder="Ex: CA-12345" value={editForm.ca} onChange={e => setEditForm({ ...editForm, ca: e.target.value })} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Quantidade</label>
              <input type="number" min="1" style={S.input} value={editForm.quantidade} onChange={e => setEditForm({ ...editForm, quantidade: e.target.value })} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Motivo</label>
              <select style={S.fsel} value={editForm.motivo} onChange={e => setEditForm({ ...editForm, motivo: e.target.value })}>
                <option value="">Selecione...</option>
                <option>1ª Entrega</option>
                <option>Substituição por vencimento</option>
                <option>Substituição por desgaste</option>
                <option>Substituição por perda</option>
                <option>Substituição por dano</option>
              </select>
            </div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setEditando(null)}>Cancelar</button>
              <button style={S.btn} onClick={salvarEdicao} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO */}
      {modalHist && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalHist(null)}>
          <div style={{ ...S.modalBox, maxWidth: 620 }}>
            <div style={S.modalTitle}>Histórico — {modalHist.colaboradores?.nome}</div>
            <div style={S.modalSub}>{modalHist.colaboradores?.matricula}</div>
            {historico.length === 0 ? (
              <div style={{ color: '#3d4d66', textAlign: 'center', padding: 24 }}>Nenhum registro encontrado</div>
            ) : (
              <table style={{ ...S.table, border: 'none' }}>
                <thead><tr>
                  <th style={S.th}>EPI</th>
                  <th style={S.th}>CA</th>
                  <th style={S.th}>Entrega</th>
                  <th style={S.th}>Próxima</th>
                  <th style={S.th}>Motivo</th>
                  <th style={S.th}>Status</th>
                </tr></thead>
                <tbody>
                  {historico.map(h => (
                    <tr key={h.id}>
                      <td style={{ ...S.td, color: '#dde4f0' }}>{h.tipo}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: '#f97316' }}>{h.ca || '—'}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtData(h.data_entrega)}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtData(h.data_prox_entrega)}</td>
                      <td style={{ ...S.td, fontSize: 12 }}>{h.motivo || '—'}</td>
                      <td style={S.td}>{statusBadge(calcStatus(h.data_prox_entrega))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalHist(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}