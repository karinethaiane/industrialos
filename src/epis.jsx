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
  toolbar: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  sbox: { display: 'flex', alignItems: 'center', gap: 7, background: '#0e1117', border: '1px solid #1e2535', borderRadius: 6, padding: '7px 12px', flex: 1, minWidth: 180 },
  sinp: { background: 'none', border: 'none', outline: 'none', color: '#dde4f0', fontSize: 13, fontFamily: 'inherit', width: '100%' },
  sel: { background: '#0e1117', border: '1px solid #1e2535', borderRadius: 6, padding: '7px 10px', color: '#8892a4', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  btn: { background: '#f97316', color: '#000', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSm: { background: '#141824', color: '#8892a4', border: '1px solid #28334a', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#0e1117', borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2535' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#3d4d66', textTransform: 'uppercase', letterSpacing: '.07em', borderBottom: '1px solid #1e2535' },
  td: { padding: '10px 14px', fontSize: 13, color: '#8892a4', borderBottom: '1px solid rgba(30,37,53,.5)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: '#0e1117', border: '1px solid #28334a', borderRadius: 12, padding: 28, width: '90%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#f97316', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: '#8892a4' },
  input: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '9px 12px', color: '#dde4f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '9px 12px', color: '#dde4f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  hint: { fontSize: 11, color: '#3d4d66', marginTop: 2 },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  proxBox: { background: '#141824', border: '1px solid #10d9a033', borderRadius: 7, padding: '10px 14px', marginBottom: 14 },
  proxLbl: { fontSize: 11, color: '#10d9a0', fontWeight: 700, marginBottom: 4 },
  proxVal: { fontFamily: 'monospace', fontSize: 15, color: '#10d9a0', fontWeight: 700 },
  obsBox: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '9px 12px', color: '#dde4f0', fontSize: 13, fontFamily: 'inherit', width: '100%', minHeight: 70, resize: 'vertical', outline: 'none' },
  histBox: { background: '#0e1117', border: '1px solid #1e2535', borderRadius: 10, overflow: 'hidden', marginTop: 20 },
  histTitle: { padding: '12px 16px', borderBottom: '1px solid #1e2535', fontSize: 13, fontWeight: 700, color: '#dde4f0' },
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

export default function Epis() {
  const [epis, setEpis] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [modalHist, setModalHist] = useState(null)
  const [historico, setHistorico] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroColab, setFiltroColab] = useState('')
  const [form, setForm] = useState({ colaborador_id: '', catalogo_id: '', data_entrega: '', quantidade: 1, motivo: '', observacoes: '' })
  const [proxEntrega, setProxEntrega] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    const [e, cat, col] = await Promise.all([
      supabase.from('epis').select('*, colaboradores(nome, matricula)').order('data_prox_entrega'),
      supabase.from('epis_catalogo').select('*').eq('ativo', true).order('nome'),
      supabase.from('colaboradores').select('*').eq('ativo', true).order('nome'),
    ])
    setEpis(e.data || [])
    setCatalogo(cat.data || [])
    setColaboradores(col.data || [])
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
      registrado_por: 'admin',
    })
    setForm({ colaborador_id: '', catalogo_id: '', data_entrega: '', quantidade: 1, motivo: '', observacoes: '' })
    setProxEntrega(null)
    setModal(false)
    setSalvando(false)
    init()
  }

  async function verHistorico(colab) {
    setModalHist(colab)
    const { data } = await supabase.from('epis')
      .select('*')
      .eq('colaborador_id', colab.colaborador_id)
      .order('data_entrega', { ascending: false })
    setHistorico(data || [])
  }

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
        <div style={S.statCard('#f97316')}><div style={S.statVal('#f97316')}>{stats.total}</div><div style={S.statLbl}>Total</div></div>
        <div style={S.statCard('#10d9a0')}><div style={S.statVal('#10d9a0')}>{stats.vigente}</div><div style={S.statLbl}>Vigentes</div></div>
        <div style={S.statCard('#f59e0b')}><div style={S.statVal('#f59e0b')}>{stats.vencendo}</div><div style={S.statLbl}>Vencendo (30d)</div></div>
        <div style={S.statCard('#f43f5e')}><div style={S.statVal('#f43f5e')}>{stats.vencido}</div><div style={S.statLbl}>Vencidos</div></div>
      </div>

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
        <div style={{ ...S.table, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ ...S.table, border: 'none' }}>
            <thead>
              <tr>
                <th style={S.th}>Colaborador</th>
                <th style={S.th}>EPI</th>
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
                  <td style={{ ...S.td, fontFamily: 'monospace' }}>{e.quantidade}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtData(e.data_entrega)}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: calcStatus(e.data_prox_entrega) === 'VENCIDO' ? '#f43f5e' : calcStatus(e.data_prox_entrega) === 'VENCENDO' ? '#f59e0b' : '#8892a4' }}>
                    {fmtData(e.data_prox_entrega)}
                  </td>
                  <td style={S.td}>{statusBadge(calcStatus(e.data_prox_entrega))}</td>
                  <td style={S.td}>
                    <button style={S.btnSm} onClick={() => verHistorico(e)}>Histórico</button>
                  </td>
                </tr>
              ))}
              {filtrado.length === 0 && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#3d4d66' }}>
                  {epis.length === 0 ? 'Nenhuma entrega registrada ainda.' : 'Nenhum resultado para os filtros aplicados.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL REGISTRO */}
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

      {/* MODAL HISTÓRICO */}
      {modalHist && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalHist(null)}>
          <div style={{ ...S.modalBox, maxWidth: 620 }}>
            <div style={S.modalTitle}>Histórico — {modalHist.colaboradores?.nome}</div>
            <div style={{ color: '#3d4d66', fontSize: 12, fontFamily: 'monospace', marginBottom: 16 }}>{modalHist.colaboradores?.matricula}</div>
            {historico.length === 0 ? (
              <div style={{ color: '#3d4d66', textAlign: 'center', padding: 24 }}>Nenhum registro encontrado</div>
            ) : (
              <table style={{ ...S.table, border: 'none' }}>
                <thead><tr>
                  <th style={S.th}>EPI</th>
                  <th style={S.th}>Entrega</th>
                  <th style={S.th}>Próxima</th>
                  <th style={S.th}>Motivo</th>
                  <th style={S.th}>Status</th>
                </tr></thead>
                <tbody>
                  {historico.map(h => (
                    <tr key={h.id}>
                      <td style={{ ...S.td, color: '#dde4f0' }}>{h.tipo}</td>
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