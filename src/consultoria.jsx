import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const PORTES = ['Micro', 'Pequeno', 'Médio']
const HORAS_POR_PORTE = { Micro: 2, Pequeno: 4, Médio: 6 }
const PORTE_COR = { Micro: 'var(--green)', Pequeno: 'var(--amber)', Médio: 'var(--blue)' }
const STATUS_COR = { pendente: 'var(--red)', apropriado: 'var(--green)' }
const STATUS_LABEL = { pendente: 'Pendente', apropriado: 'Apropriado' }

function fmtData(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }

function isHoje(d) {
  if (!d) return false
  const hoje = new Date()
  const data = new Date(d + 'T00:00:00')
  return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth() && data.getDate() === hoje.getDate()
}

function isFuturo(d) {
  if (!d) return false
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  return new Date(d + 'T00:00:00') > hoje
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
  alerta: { background: 'linear-gradient(135deg, rgba(245,158,11,.08), rgba(239,68,68,.04))', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12 },
  alertaIcon: { width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  toolbar: { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  search: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 280 },
  filtro: (on) => ({ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'rgba(59,130,246,.25)' : 'var(--border2)'}`, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)', fontFamily: 'inherit' }),
  btn: { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  btnSm: { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnApropriar: { background: 'rgba(16,185,129,.1)', color: 'var(--green)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 },
  btnDanger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro: { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  hintBox: { background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: 7, padding: '8px 14px', marginBottom: 14, fontSize: 12, color: 'var(--blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
}

const formVazio = { id_sgt: '', empresa: '', consultor: '', data_kickoff: '', horas: '', porte: 'Médio', status: 'pendente' }

const CARGOS_CONSULTOR = ['consultor técnico', 'consultora técnica']

export default function Consultoria({ isAdmin = false }) {
  const [kickoffs, setKickoffs] = useState([])
  const [consultores, setConsultores] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const [kickRes, colabRes] = await Promise.all([
      supabase.from('kickoffs').select('*').order('data_kickoff', { ascending: false }),
      supabase.from('colaboradores').select('id, nome, cargo').eq('ativo', true).order('nome'),
    ])
    setKickoffs(kickRes.data || [])
    // filtra só consultores técnicos
    const lista = (colabRes.data || []).filter(c =>
      CARGOS_CONSULTOR.includes((c.cargo || '').toLowerCase().trim())
    )
    setConsultores(lista)
    setLoading(false)
  }

  function abrirNovo() { setEditando(null); setErro(''); setForm(formVazio); setModal(true) }
  function abrirEditar(r) { setEditando(r); setErro(''); setForm({ id_sgt: r.id_sgt, empresa: r.empresa, consultor: r.consultor || '', data_kickoff: r.data_kickoff || '', horas: r.horas || '', porte: r.porte || 'Médio', status: r.status }); setModal(true) }

  function setPorte(p) { setForm(f => ({ ...f, porte: p, horas: HORAS_POR_PORTE[p] || f.horas })) }

  async function salvar() {
    if (!form.id_sgt.trim() || !form.empresa.trim() || !form.data_kickoff) { setErro('ID SGT, Empresa e Data são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const dados = { id_sgt: form.id_sgt.trim(), empresa: form.empresa.trim(), consultor: form.consultor || null, data_kickoff: form.data_kickoff, horas: parseFloat(form.horas) || null, porte: form.porte, status: form.status }
    let error
    if (editando) { ({ error } = await supabase.from('kickoffs').update(dados).eq('id', editando.id)) }
    else { ({ error } = await supabase.from('kickoffs').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModal(false); carregar()
  }

  async function apropriar(r) {
    await supabase.from('kickoffs').update({ status: 'apropriado' }).eq('id', r.id)
    carregar()
  }

  async function excluir(id) { if (!confirm('Excluir este kick off?')) return; await supabase.from('kickoffs').delete().eq('id', id); carregar() }

  const hoje = kickoffs.filter(k => isHoje(k.data_kickoff) && k.status === 'pendente')
  const proximos = kickoffs.filter(k => isFuturo(k.data_kickoff) && !isHoje(k.data_kickoff))
  const totalHoje = hoje.reduce((a, k) => a + (parseFloat(k.horas) || 0), 0)

  const filtrados = kickoffs.filter(r => {
    if (filtro === 'hoje' && !isHoje(r.data_kickoff)) return false
    if (filtro === 'pendente' && r.status !== 'pendente') return false
    if (filtro === 'apropriado' && r.status !== 'apropriado') return false
    if (filtro === 'proximos' && !isFuturo(r.data_kickoff)) return false
    if (busca) { const b = busca.toLowerCase(); return r.id_sgt?.toLowerCase().includes(b) || r.empresa?.toLowerCase().includes(b) || r.consultor?.toLowerCase().includes(b) }
    return true
  })

  const trHover = { onMouseEnter: e => e.currentTarget.style.background = 'var(--subtle)', onMouseLeave: e => e.currentTarget.style.background = 'transparent' }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Consultoria</div>
          <div style={S.sub}>Acompanhamento de kick offs e apropriação de horas</div>
        </div>
        {isAdmin && (
          <button style={S.btn} onClick={abrirNovo}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Kick Off
          </button>
        )}
      </div>

      {hoje.length > 0 && (
        <div style={S.alerta}>
          <div style={S.alertaIcon}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--amber, #f59e0b)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber, #f59e0b)', marginBottom: 3 }}>
              {hoje.length} kick off{hoje.length > 1 ? 's' : ''} hoje — apropriar {totalHoje}h
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Não esqueça de registrar as horas e atualizar a planilha</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {hoje.map(k => (
                <span key={k.id} style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--amber, #f59e0b)', fontWeight: 500 }}>
                  {k.empresa}{k.consultor ? ` · ${k.consultor}` : ''} · {k.horas}h
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={S.stats}>
        {[['var(--blue)', kickoffs.length, 'Total'], ['var(--amber)', hoje.length, 'Hoje'], ['var(--red)', kickoffs.filter(k => k.status === 'pendente').length, 'Pendentes'], ['var(--green)', kickoffs.filter(k => k.status === 'apropriado').length, 'Apropriados'], ['var(--blue)', proximos.length, 'Próximos']].map(([cor, val, lbl]) => (
          <div key={lbl} style={S.statCard}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

      <div style={S.toolbar}>
        <input style={S.search} placeholder="Buscar empresa, ID SGT, consultor..." value={busca} onChange={e => setBusca(e.target.value)} />
        <button style={S.filtro(!filtro)} onClick={() => setFiltro('')}>Todos</button>
        <button style={S.filtro(filtro === 'hoje')} onClick={() => setFiltro('hoje')}>Hoje</button>
        <button style={S.filtro(filtro === 'proximos')} onClick={() => setFiltro('proximos')}>Próximos</button>
        <button style={S.filtro(filtro === 'pendente')} onClick={() => setFiltro('pendente')}>Pendente</button>
        <button style={S.filtro(filtro === 'apropriado')} onClick={() => setFiltro('apropriado')}>Apropriado</button>
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>ID SGT</th>
            <th style={S.th}>Empresa</th>
            <th style={S.th}>Consultor</th>
            <th style={S.th}>Data Kick Off</th>
            <th style={S.th}>Horas</th>
            <th style={S.th}>Porte</th>
            <th style={S.th}>Status</th>
            <th style={S.th}></th>
          </tr></thead>
          <tbody>
            {filtrados.map((r) => {
              const hoje_ = isHoje(r.data_kickoff)
              const cor = STATUS_COR[r.status] || 'var(--muted)'
              const porteCor = PORTE_COR[r.porte] || 'var(--muted)'
              return (
                <tr key={r.id} {...trHover} style={{ background: hoje_ ? 'rgba(245,158,11,.03)' : undefined }}>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', color: 'var(--blue)', fontWeight: 500 }}>{r.id_sgt}</td>
                  <td style={{ ...S.td, color: 'var(--text)', fontWeight: 500 }}>{r.empresa}</td>
                  <td style={S.td}>{r.consultor || '—'}</td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                    {hoje_ ? <span style={{ color: 'var(--amber, #f59e0b)', fontWeight: 700, fontSize: 13 }}>Hoje</span> : fmtData(r.data_kickoff)}
                  </td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', color: '#a78bfa', fontWeight: 500 }}>{r.horas ? `${r.horas}h` : '—'}</td>
                  <td style={S.td}><span style={{ background: `${porteCor}18`, color: porteCor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{r.porte || '—'}</span></td>
                  <td style={S.td}><span style={{ background: `${cor}18`, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>● {STATUS_LABEL[r.status] || r.status}</span></td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.status === 'pendente' && (
                        <button style={S.btnApropriar} onClick={() => apropriar(r)}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          Apropriar
                        </button>
                      )}
                      {isAdmin && <button style={S.btnSm} onClick={() => abrirEditar(r)}>Editar</button>}
                      {isAdmin && <button style={S.btnDanger} onClick={() => excluir(r.id)}>✕</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{loading ? 'Carregando...' : 'Nenhum kick off encontrado.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editando ? 'Editar Kick Off' : 'Novo Kick Off'}</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>ID SGT *</label><input style={S.input} value={form.id_sgt} onChange={e => setForm({ ...form, id_sgt: e.target.value })} placeholder="713154" /></div>
              <div style={S.field}><label style={S.label}>Porte</label>
                <select style={S.fsel} value={form.porte} onChange={e => setPorte(e.target.value)}>
                  {PORTES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={S.field}><label style={S.label}>Empresa *</label><input style={S.input} value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} placeholder="Nome da empresa" /></div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Consultor</label>
                <select style={S.fsel} value={form.consultor} onChange={e => setForm({ ...form, consultor: e.target.value })}>
                  <option value="">Selecione o consultor...</option>
                  {consultores.length > 0
                    ? consultores.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)
                    : <option disabled>Nenhum consultor técnico cadastrado</option>
                  }
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Data do Kick Off *</label><input type="date" style={S.input} value={form.data_kickoff} onChange={e => setForm({ ...form, data_kickoff: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Horas a Apropriar</label><input type="number" step="0.5" min="0.5" style={S.input} value={form.horas} onChange={e => setForm({ ...form, horas: e.target.value })} placeholder="Ex: 4" /></div>
            {form.horas && <div style={S.hintBox}><span>Carga a apropriar</span><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{form.horas}h</span></div>}
            <div style={S.field}><label style={S.label}>Status</label><select style={S.fsel} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="pendente">Pendente</option><option value="apropriado">Apropriado</option></select></div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setModal(false)}>Cancelar</button><button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}