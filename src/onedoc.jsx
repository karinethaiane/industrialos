import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const TIPOS = ['Relatório Final', 'FSF', 'Outro']
const STATUS = ['pendente', 'assinado', 'cancelado']
const STATUS_LABEL = { pendente: 'Pendente', assinado: 'Assinado', cancelado: 'Cancelado' }
const STATUS_COR = { pendente: 'var(--amber)', assinado: 'var(--green)', cancelado: 'var(--muted)' }
const TIPO_COR = { 'Relatório Final': 'var(--blue)', 'FSF': '#a78bfa', 'Outro': 'var(--cyan, #06b6d4)' }

function fmtData(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }

function statusBadge(s) {
  const cor = STATUS_COR[s] || 'var(--muted)'
  return <span style={{ background: `${cor}18`, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>● {STATUS_LABEL[s] || s}</span>
}

function tipoBadge(t) {
  const cor = TIPO_COR[t] || 'var(--muted)'
  return <span style={{ background: `${cor}18`, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{t}</span>
}

const S = {
  wrap: { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub: { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 22 },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' },
  statBar: (cor) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: cor, opacity: .5 }),
  statVal: (cor) => ({ fontFamily: 'DM Mono, monospace', fontSize: 26, fontWeight: 500, color: cor, lineHeight: 1, marginBottom: 5 }),
  statLbl: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },
  toolbar: { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  search: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 280 },
  filtro: (on) => ({ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'rgba(59,130,246,.25)' : 'var(--border2)'}`, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)', fontFamily: 'inherit' }),
  btn: { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  btnSm: { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnObs: { background: 'rgba(167,139,250,.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,.2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalBoxSm: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 400, boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  textarea: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', minHeight: 70, resize: 'vertical' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro: { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 },
}

const formVazio = { numero_1doc: '', tipo: 'Relatório Final', empresa: '', id_sgt: '', solicitante: '', data_envio: '', status: 'pendente', observacoes: '' }

export default function OneDock({ isAdmin = false }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modal, setModal] = useState(false)
  const [modalObs, setModalObs] = useState(null)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from('documentos_1doc').select('*').order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  function abrirNovo() { setEditando(null); setErro(''); setForm(formVazio); setModal(true) }
  function abrirEditar(r) { setEditando(r); setErro(''); setForm({ numero_1doc: r.numero_1doc, tipo: r.tipo, empresa: r.empresa || '', id_sgt: r.id_sgt || '', solicitante: r.solicitante || '', data_envio: r.data_envio || '', status: r.status, observacoes: r.observacoes || '' }); setModal(true) }

  async function salvar() {
    if (!form.numero_1doc.trim()) { setErro('Número 1Doc é obrigatório.'); return }
    setSalvando(true); setErro('')
    const dados = { numero_1doc: form.numero_1doc.trim(), tipo: form.tipo, empresa: form.empresa || null, id_sgt: form.id_sgt || null, solicitante: form.solicitante || null, data_envio: form.data_envio || null, status: form.status, observacoes: form.observacoes || null }
    let error
    if (editando) { ({ error } = await supabase.from('documentos_1doc').update(dados).eq('id', editando.id)) }
    else { ({ error } = await supabase.from('documentos_1doc').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModal(false); carregar()
  }

  async function excluir(id) { if (!confirm('Excluir este documento?')) return; await supabase.from('documentos_1doc').delete().eq('id', id); carregar() }

  const filtrados = docs.filter(r => {
    if (filtroStatus && r.status !== filtroStatus) return false
    if (busca) { const b = busca.toLowerCase(); return r.numero_1doc?.toLowerCase().includes(b) || r.empresa?.toLowerCase().includes(b) || r.solicitante?.toLowerCase().includes(b) || r.id_sgt?.toLowerCase().includes(b) }
    return true
  })

  const pendentes = docs.filter(d => d.status === 'pendente').length
  const assinados = docs.filter(d => d.status === 'assinado').length
  const cancelados = docs.filter(d => d.status === 'cancelado').length

  const trHover = { onMouseEnter: e => e.currentTarget.style.background = 'var(--subtle)', onMouseLeave: e => e.currentTarget.style.background = 'transparent' }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>1Doc</div>
          <div style={S.sub}>Controle de documentos enviados para assinatura</div>
        </div>
        {isAdmin && (
          <button style={S.btn} onClick={abrirNovo}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Documento
          </button>
        )}
      </div>

      <div style={S.stats}>
        {[['var(--blue)', docs.length, 'Total'], ['var(--amber)', pendentes, 'Pendentes'], ['var(--green)', assinados, 'Assinados'], ['var(--muted)', cancelados, 'Cancelados']].map(([cor, val, lbl]) => (
          <div key={lbl} style={S.statCard}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

      <div style={S.toolbar}>
        <input style={S.search} placeholder="Buscar número 1Doc, empresa, solicitante..." value={busca} onChange={e => setBusca(e.target.value)} />
        <button style={S.filtro(!filtroStatus)} onClick={() => setFiltroStatus('')}>Todos</button>
        {STATUS.map(s => <button key={s} style={S.filtro(filtroStatus === s)} onClick={() => setFiltroStatus(s)}>{STATUS_LABEL[s]}</button>)}
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Nº 1Doc</th>
            <th style={S.th}>Tipo</th>
            <th style={S.th}>Empresa / ID SGT</th>
            <th style={S.th}>Solicitante</th>
            <th style={S.th}>Data Envio</th>
            <th style={S.th}>Status</th>
            <th style={S.th}></th>
          </tr></thead>
          <tbody>
            {filtrados.map((r, i) => (
              <tr key={r.id} {...trHover} style={{ borderBottom: i === filtrados.length - 1 ? 'none' : undefined }}>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', color: 'var(--blue)', fontWeight: 500 }}>{r.numero_1doc}</td>
                <td style={S.td}>{tipoBadge(r.tipo)}</td>
                <td style={S.td}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.empresa || '—'}</span>
                  {r.id_sgt && <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>· {r.id_sgt}</span>}
                </td>
                <td style={S.td}>{r.solicitante || '—'}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(r.data_envio)}</td>
                <td style={S.td}>{statusBadge(r.status)}</td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {r.observacoes && <button style={S.btnObs} onClick={() => setModalObs(r)}>Obs.</button>}
                    {isAdmin && <button style={S.btnSm} onClick={() => abrirEditar(r)}>Editar</button>}
                    {isAdmin && <button style={S.btnDanger} onClick={() => excluir(r.id)}>✕</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{loading ? 'Carregando...' : 'Nenhum documento encontrado.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL OBS */}
      {modalObs && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalObs(null)}>
          <div style={S.modalBoxSm}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Observações</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--blue)', marginTop: 3 }}>{modalObs.numero_1doc}</div>
              </div>
              <button onClick={() => setModalObs(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{modalObs.observacoes}</div>
            <div style={{ marginTop: 14 }}>{statusBadge(modalObs.status)}</div>
          </div>
        </div>
      )}

      {/* MODAL FORM */}
      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editando ? 'Editar Documento' : 'Novo Documento 1Doc'}</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Nº 1Doc *</label><input style={S.input} value={form.numero_1doc} onChange={e => setForm({ ...form, numero_1doc: e.target.value })} placeholder="2026/00421" /></div>
              <div style={S.field}><label style={S.label}>Status</label><select style={S.fsel} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
            </div>
            <div style={S.field}><label style={S.label}>Tipo de Documento</label><select style={S.fsel} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Empresa</label><input style={S.input} value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} placeholder="Nome da empresa" /></div>
              <div style={S.field}><label style={S.label}>ID SGT</label><input style={S.input} value={form.id_sgt} onChange={e => setForm({ ...form, id_sgt: e.target.value })} placeholder="713154" /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Solicitante</label><input style={S.input} value={form.solicitante} onChange={e => setForm({ ...form, solicitante: e.target.value })} placeholder="Quem solicitou" /></div>
              <div style={S.field}><label style={S.label}>Data de Envio</label><input type="date" style={S.input} value={form.data_envio} onChange={e => setForm({ ...form, data_envio: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={S.textarea} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="Anotações relevantes..." /></div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setModal(false)}>Cancelar</button><button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
