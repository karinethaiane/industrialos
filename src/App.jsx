import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Epis from './epis'
import Colaboradores from './colaboradores'
import Veiculos from './veiculos'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState('epis')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return <div style={S.loading}>Carregando...</div>
  if (!session) return <Login />

  return (
    <div style={S.shell}>
      <aside style={S.sidebar}>
        <div style={S.logo}>⬡ Gestão de Processos — Energia</div>
        <nav style={S.nav}>
          <div style={S.navLabel}>Módulos</div>
          {[
            { id: 'epis', icon: '🦺', label: 'EPIs' },
            { id: 'veiculos', icon: '🚗', label: 'Veículos' },
            { id: 'colaboradores', icon: '👷', label: 'Colaboradores' },
          ].map(item => (
            <div key={item.id} style={pagina === item.id ? S.navItemOn : S.navItem} onClick={() => setPagina(item.id)}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={S.sideFooter}>
          <div style={{ fontSize: 11, color: '#3d4d66', marginBottom: 6 }}>{session.user.email}</div>
          <button style={S.btnSair} onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </aside>
      <main style={S.main}>
        {pagina === 'epis' && <Epis />}
        {pagina === 'veiculos' && <Veiculos />}
        {pagina === 'colaboradores' && <Colaboradores />}
      </main>
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setCarregando(false)
  }

  return (
    <div style={S.loginWrap}>
      <div style={S.loginBox}>
        <div style={S.logo}>⬡ Gestão de Processos — Energia</div>
        <div style={S.loginSub}>Plataforma de Gestão Industrial</div>
        <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={S.field}>
            <label style={S.label}>E-mail</label>
            <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div style={S.field}>
            <label style={S.label}>Senha</label>
            <input style={S.input} type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required />
          </div>
          {erro && <div style={S.erro}>{erro}</div>}
          <button style={S.btnLogin} type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const S = {
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07090f', color: '#8892a4' },
  shell: { display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' },
  sidebar: { background: '#0e1117', borderRight: '1px solid #1e2535', display: 'flex', flexDirection: 'column', padding: '20px 0', position: 'sticky', top: 0, height: '100vh' },
  logo: { fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#f97316', padding: '0 16px 20px', lineHeight: 1.4 },
  nav: { flex: 1 },
  navLabel: { fontSize: 10, fontWeight: 700, color: '#3d4d66', letterSpacing: '.1em', textTransform: 'uppercase', padding: '8px 16px 4px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', margin: '1px 8px', borderRadius: 6, cursor: 'pointer', color: '#8892a4', fontSize: 13 },
  navItemOn: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', margin: '1px 8px', borderRadius: 6, cursor: 'pointer', color: '#f97316', fontSize: 13, fontWeight: 600, background: 'rgba(249,115,22,.1)' },
  sideFooter: { padding: '16px', borderTop: '1px solid #1e2535' },
  main: { background: '#07090f', overflowY: 'auto' },
  loginWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07090f' },
  loginBox: { background: '#0e1117', border: '1px solid #1e2535', borderRadius: 14, padding: '40px 36px', width: '100%', maxWidth: 380 },
  loginSub: { color: '#3d4d66', fontSize: 12, marginBottom: 24, fontFamily: 'monospace' },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: '#8892a4' },
  input: { background: '#141824', border: '1px solid #28334a', borderRadius: 7, padding: '10px 14px', color: '#dde4f0', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  erro: { background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.3)', borderRadius: 7, padding: '8px 12px', color: '#f43f5e', fontSize: 13 },
  btnLogin: { background: '#f97316', color: '#000', border: 'none', borderRadius: 7, padding: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 },
  btnSair: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '5px 12px', color: '#8892a4', fontSize: 12, cursor: 'pointer', width: '100%' },
}