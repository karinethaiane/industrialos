import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Epis from './epis'
import Colaboradores from './colaboradores'
import Veiculos from './veiculos'

const ICONS = {
  epis: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  veiculos: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  colaboradores: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  sun: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  sair: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

export default function App() {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState('epis')
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema)
    localStorage.setItem('tema', tema)
  }, [tema])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) carregarPerfil(session.user.id)
      else setLoading(false)
    })
    supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) carregarPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })
  }, [])

  async function carregarPerfil(userId) {
    const { data } = await supabase.from('perfis').select('*').eq('id', userId).single()
    setPerfil(data)
    setLoading(false)
  }

  function toggleTema() { setTema(t => t === 'dark' ? 'light' : 'dark') }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
      Carregando...
    </div>
  )

  if (!session) return <Login tema={tema} toggleTema={toggleTema} />

  const isAdmin = perfil?.role === 'admin'
  const initials = (session.user.email || '').slice(0, 2).toUpperCase()

  const navItems = [
    { id: 'epis', label: 'EPIs', icon: ICONS.epis },
    { id: 'veiculos', label: 'Veículos', icon: ICONS.veiculos },
    ...(isAdmin ? [{ id: 'colaboradores', label: 'Colaboradores', icon: ICONS.colaboradores }] : []),
  ]

  const navBtn = (item) => ({
    width: 40, height: 40, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: 'none', transition: 'all .15s', position: 'relative',
    color: pagina === item.id ? 'var(--blue)' : 'var(--muted)',
    background: pagina === item.id ? 'var(--blue-dim)' : 'none',
  })

  const iconBtn = {
    width: 32, height: 32, borderRadius: 8,
    background: 'var(--subtle)', border: '1px solid var(--border)',
    color: 'var(--muted)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', transition: 'all .15s',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', background: 'var(--bg)', color: 'var(--text)' }}>
      <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', position: 'sticky', top: 0, padding: '16px 0', boxShadow: '2px 0 12px var(--shadow)', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 0 18px rgba(59,130,246,.25)', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, width: '100%', padding: '0 8px' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setPagina(item.id)} style={navBtn(item)}
              onMouseEnter={e => { if (pagina !== item.id) e.currentTarget.style.background = 'var(--subtle)'; e.currentTarget.querySelector('.tip').style.opacity = '1' }}
              onMouseLeave={e => { if (pagina !== item.id) e.currentTarget.style.background = 'none'; e.currentTarget.querySelector('.tip').style.opacity = '0' }}>
              {item.icon}
              <span className="tip" style={{ position: 'absolute', left: 52, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', opacity: 0, pointerEvents: 'none', transition: 'opacity .15s', boxShadow: '0 4px 12px var(--shadow)', zIndex: 100 }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 8px 4px' }}>
          <button onClick={toggleTema} title={tema === 'dark' ? 'Modo claro' : 'Modo escuro'} style={iconBtn}>
            {tema === 'dark' ? ICONS.sun : ICONS.moon}
          </button>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }} title={session.user.email}>
            {initials}
          </div>
          <button onClick={() => supabase.auth.signOut()} title="Sair" style={iconBtn}>
            {ICONS.sair}
          </button>
        </div>
      </aside>

      <main style={{ background: 'var(--bg)', overflowY: 'auto' }}>
        {pagina === 'epis' && <Epis isAdmin={isAdmin} />}
        {pagina === 'veiculos' && <Veiculos isAdmin={isAdmin} />}
        {pagina === 'colaboradores' && isAdmin && <Colaboradores />}
      </main>
    </div>
  )
}

function Login({ tema, toggleTema }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setCarregando(true); setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setCarregando(false)
  }

  const inputStyle = { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: 'DM Sans, sans-serif', position: 'relative' }}>
      <button onClick={toggleTema} style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {tema === 'dark' ? ICONS.sun : ICONS.moon}
      </button>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 4px 24px var(--shadow)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 28px rgba(59,130,246,.25)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>Gestão de Processos</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.08em' }}>Energia · Plataforma Industrial</div>
        </div>

        <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>E-mail</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@empresa.com" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Senha</label>
            <input style={inputStyle} type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required />
          </div>
          {erro && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 7, padding: '8px 12px', color: '#ef4444', fontSize: 13 }}>{erro}</div>}
          <button type="submit" disabled={carregando} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 16px rgba(59,130,246,.3)', marginTop: 4 }}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}