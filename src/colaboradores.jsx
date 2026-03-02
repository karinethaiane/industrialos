import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  wrap: { padding: 24, background: '#07090f', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#f97316' },
  btn: { background: '#f97316', color: '#000', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnSm: { background: '#141824', color: '#8892a4', border: '1px solid #28334a', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  btnDanger: { background: 'rgba(244,63,94,.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#0e1117', borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2535' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#3d4d66', textTransform: 'uppercase', letterSpacing: '.07em', borderBottom: '1px solid #1e2535' },
  td: { padding: '10px 14px', fontSize: 13, color: '#8892a4', borderBottom: '1px solid rgba(30,37,53,.5)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: '#0e1117', border: '1px solid #28334a', borderRadius: 12, padding: 28, width: '90%', maxWidth: 440 },
  modalTitle: { fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#f97316', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: '#8892a4' },
  input: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '9px 12px', color: '#dde4f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  badge: (a) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: a ? 'rgba(16,217,160,.12)' : 'rgba(244,63,94,.12)', color: a ? '#10d9a0' : '#f43f5e' }),
}

export default function Colaboradores() {
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: '', setor: '', cargo: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from('colaboradores').select('*').order('nome')
    setLista(data || [])
    setLoading(false)
  }

  function gerarMatricula() {
    return 'MAT-' + String(Math.floor(Math.random() * 9000) + 1000)
  }

  async function salvar() {
    if (!form.nome.trim()) return
    setSalvando(true)
    await supabase.from('colaboradores').insert({
      nome: form.nome.toUpperCase().trim(),
      matricula: gerarMatricula(),
      setor: form.setor.trim(),
      cargo: form.cargo.trim(),
      ativo: true,
    })
    setForm({ nome: '', setor: '', cargo: '' })
    setModal(false)
    setSalvando(false)
    carregar()
  }

  async function toggleAtivo(id, ativo) {
    await supabase.from('colaboradores').update({ ativo: !ativo }).eq('id', id)
    carregar()
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.title}>👷 Colaboradores</div>
        <button style={S.btn} onClick={() => setModal(true)}>+ Novo Colaborador</button>
      </div>

      {loading ? <div style={{ color: '#3d4d66', padding: 40, textAlign: 'center' }}>Carregando...</div> : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Nome</th>
              <th style={S.th}>Matrícula</th>
              <th style={S.th}>Setor</th>
              <th style={S.th}>Cargo</th>
              <th style={S.th}>Status</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {lista.map(c => (
              <tr key={c.id}>
                <td style={{ ...S.td, color: '#dde4f0', fontWeight: 500 }}>{c.nome}</td>
                <td style={{ ...S.td, fontFamily: 'monospace', color: '#f97316', fontSize: 12 }}>{c.matricula}</td>
                <td style={S.td}>{c.setor || '—'}</td>
                <td style={S.td}>{c.cargo || '—'}</td>
                <td style={S.td}><span style={S.badge(c.ativo)}>{c.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td style={S.td}>
                  <button style={c.ativo ? S.btnDanger : S.btnSm} onClick={() => toggleAtivo(c.id, c.ativo)}>
                    {c.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#3d4d66' }}>Nenhum colaborador cadastrado</td></tr>
            )}
          </tbody>
        </table>
      )}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Novo Colaborador</div>
            <div style={S.field}>
              <label style={S.label}>Nome completo *</label>
              <input style={S.input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: JOÃO DA SILVA" />
            </div>
            <div style={S.field}>
              <label style={S.label}>Setor</label>
              <input style={S.input} value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} placeholder="Ex: Energia" />
            </div>
            <div style={S.field}>
              <label style={S.label}>Cargo</label>
              <input style={S.input} value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Técnico de Campo" />
            </div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModal(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}