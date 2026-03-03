import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  wrap: { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub: { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  btn: { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px var(--blue-glow)' },
  btnSm: { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px var(--shadow)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' },
  td: { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 480, boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
}

function badgeAtivo(a) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: a ? 'var(--green-dim)' : 'var(--red-dim)', color: a ? 'var(--green)' : 'var(--red)' }}>{a ? '● Ativo' : '● Inativo'}</span>
}

function badgeKit(nome) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--blue-dim)', color: 'var(--blue)' }}>{nome}</span>
}

export default function Colaboradores() {
  const [lista, setLista] = useState([])
  const [kits, setKits] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: '', setor: '', cargo: '', kit_id: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const [colab, kitsData] = await Promise.all([
      supabase.from('colaboradores').select('*, epi_kits(nome)').order('nome'),
      supabase.from('epi_kits').select('*').eq('ativo', true).order('nome'),
    ])
    setLista(colab.data || [])
    setKits(kitsData.data || [])
    setLoading(false)
  }

  function gerarMatricula() { return 'MAT-' + String(Math.floor(Math.random() * 9000) + 1000) }

  function abrirNovo() { setEditando(null); setForm({ nome: '', setor: '', cargo: '', kit_id: '' }); setModal(true) }
  function abrirEditar(c) { setEditando(c); setForm({ nome: c.nome, setor: c.setor || '', cargo: c.cargo || '', kit_id: c.kit_id || '' }); setModal(true) }

  async function salvar() {
    if (!form.nome.trim()) return
    setSalvando(true)
    if (editando) {
      await supabase.from('colaboradores').update({ nome: form.nome.toUpperCase().trim(), setor: form.setor.trim(), cargo: form.cargo.trim(), kit_id: form.kit_id || null }).eq('id', editando.id)
    } else {
      await supabase.from('colaboradores').insert({ nome: form.nome.toUpperCase().trim(), matricula: gerarMatricula(), setor: form.setor.trim(), cargo: form.cargo.trim(), kit_id: form.kit_id || null, ativo: true })
    }
    setForm({ nome: '', setor: '', cargo: '', kit_id: '' })
    setModal(false); setEditando(null); setSalvando(false); carregar()
  }

  async function toggleAtivo(id, ativo) {
    await supabase.from('colaboradores').update({ ativo: !ativo }).eq('id', id)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir este colaborador?')) return
    await supabase.from('colaboradores').delete().eq('id', id)
    carregar()
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Colaboradores</div>
          <div style={S.sub}>Cadastro e gestão de equipe</div>
        </div>
        <button style={S.btn} onClick={abrirNovo}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Colaborador
        </button>
      </div>

      {loading ? <div style={{ color: 'var(--muted)', padding: 40, textAlign: 'center' }}>Carregando...</div> : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Nome</th>
                <th style={S.th}>Matrícula</th>
                <th style={S.th}>Setor</th>
                <th style={S.th}>Cargo</th>
                <th style={S.th}>Kit EPI</th>
                <th style={S.th}>Status</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {lista.map(c => (
                <tr key={c.id} style={{ transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...S.td, color: 'var(--text)', fontWeight: 600 }}>{c.nome}</td>
                  <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', color: 'var(--blue)', fontSize: 12 }}>{c.matricula}</td>
                  <td style={S.td}>{c.setor || '—'}</td>
                  <td style={S.td}>{c.cargo || '—'}</td>
                  <td style={S.td}>{c.epi_kits ? badgeKit(c.epi_kits.nome) : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                  <td style={S.td}>{badgeAtivo(c.ativo)}</td>
                  <td style={{ ...S.td, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button style={S.btnSm} onClick={() => abrirEditar(c)}>Editar</button>
                      <button style={S.btnSm} onClick={() => toggleAtivo(c.id, c.ativo)}>{c.ativo ? 'Desativar' : 'Reativar'}</button>
                      <button style={S.btnDanger} onClick={() => excluir(c.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Nenhum colaborador cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editando ? 'Editar Colaborador' : 'Novo Colaborador'}</div>
            <div style={S.field}><label style={S.label}>Nome completo *</label><input style={S.input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: JOÃO DA SILVA" /></div>
            <div style={S.field}><label style={S.label}>Função / Kit de EPIs</label>
              <select style={S.fsel} value={form.kit_id} onChange={e => setForm({ ...form, kit_id: e.target.value })}>
                <option value="">Selecione a função...</option>
                {kits.map(k => <option key={k.id} value={k.id}>{k.nome}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Setor</label><input style={S.input} value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} placeholder="Ex: Energia" /></div>
            <div style={S.field}><label style={S.label}>Cargo</label><input style={S.input} value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Técnico de Campo" /></div>
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