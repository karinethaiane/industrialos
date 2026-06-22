import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { exportarTudo } from './exportacaoUnificada'
import Epis from './epis'
import Colaboradores from './colaboradores'
import Veiculos from './veiculos'
import Financeiro from './financeiro'
import OneDock from './onedoc'
import Patrimonio from './patrimonio'

// ── Ícones ──────────────────────────────────────────────────────────────
const IC = {
  inicio:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  financeiro:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  patrimonio:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  epis:          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  veiculos:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  onedoc:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  colaboradores: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  sun:           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  sair:          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bolt:          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
}

// ── Paleta dos ícones dos módulos ────────────────────────────────────────
const MOD_ICON_COR = {
  financeiro:    { bg: 'rgba(5,150,105,.12)',   color: '#34d399' },
  patrimonio:    { bg: 'rgba(217,119,6,.12)',   color: '#fbbf24' },
  colaboradores: { bg: 'rgba(124,58,237,.12)',  color: '#c4b5fd' },
  epis:          { bg: 'rgba(225,29,72,.12)',   color: '#fb7185' },
  veiculos:      { bg: 'rgba(13,148,136,.12)',  color: '#5eead4' },
  onedoc:        { bg: 'rgba(37,99,235,.12)',   color: '#93c5fd' },
}
// Light overrides
const MOD_ICON_COR_LIGHT = {
  financeiro:    { bg: '#ecfdf5', color: '#059669' },
  patrimonio:    { bg: '#fffbeb', color: '#d97706' },
  colaboradores: { bg: '#f5f3ff', color: '#7c3aed' },
  epis:          { bg: '#fff1f2', color: '#e11d48' },
  veiculos:      { bg: '#f0fdfa', color: '#0d9488' },
  onedoc:        { bg: '#eff6ff', color: '#2563eb' },
}

// ── Saudação ─────────────────────────────────────────────────────────────
function getSaudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}
function getDataExtenso() {
  const dias  = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const d = new Date()
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

// ── Tela Início ───────────────────────────────────────────────────────────
function Inicio({ onNavegar, tema, nomeUsuario }) {
  const [exportando, setExportando]         = useState(false)
  const [progressoExport, setProgressoExport] = useState('')

  async function handleExportar() {
    setExportando(true)
    try {
      await exportarTudo(msg => setProgressoExport(msg))
    } catch (err) {
      alert('Erro ao exportar: ' + err.message)
    }
    setExportando(false)
    setProgressoExport('')
  }

  const modulos = [
   // { id: 'consultoria',   nome: 'Consultoria',   desc: 'B+P, Sebraetec e Diretas' },
    { id: 'financeiro',    nome: 'Financeiro',    desc: 'NFs e solicitações de pagamento' },
    { id: 'patrimonio',    nome: 'Patrimônio',    desc: 'Bens, ocorrências e calibrações' },
    { id: 'colaboradores', nome: 'Colaboradores', desc: 'Equipe, férias e controle' },
    { id: 'epis',          nome: 'EPIs',          desc: 'Equipamentos de proteção' },
    { id: 'veiculos',      nome: 'Veículos',      desc: 'Frota e controle de uso' },
    { id: 'onedoc',        nome: 'Administrativo', desc: '1Doc e documentação administrativa' },
  ]

  const isDark = tema === 'dark'
  const icCor = id => isDark ? MOD_ICON_COR[id] : MOD_ICON_COR_LIGHT[id]

  const nome = nomeUsuario
    ? nomeUsuario.split(' ')[0]
    : 'Karine'

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Saudação */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
          {getSaudacao()}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.03em', lineHeight: 1.2 }}>
          {nome}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 7 }}>
          {getDataExtenso()}
        </div>
      </div>

      {/* Grid de módulos */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
        Módulos
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {modulos.map(m => {
          const cor = icCor(m.id) || { bg: 'var(--blue-dim)', color: 'var(--blue)' }
          return (
            <div
              key={m.id}
              onClick={() => onNavegar(m.id)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '20px 18px', cursor: 'pointer',
                transition: 'all .18s', display: 'flex', flexDirection: 'column', gap: 14,
                boxShadow: '0 1px 4px var(--shadow)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 10px 28px var(--shadow)'
                e.currentTarget.style.borderColor = 'var(--border2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = '0 1px 4px var(--shadow)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: cor.bg, color: cor.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {IC[m.id]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{m.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>{m.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Exportação unificada */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
          Exportação de Dados
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={handleExportar}
            disabled={exportando}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 10, padding: '11px 20px', fontWeight: 600, fontSize: 13, cursor: exportando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: exportando ? .7 : 1 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {exportando ? 'Exportando...' : 'Exportar tudo — Excel completo'}
          </button>
          {exportando && progressoExport && (
            <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {progressoExport}
            </span>
          )}
          {!exportando && (
            <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              Patrimônio · Ocorrências · Calibrações · EPIs · NFs · Pagamentos · Diárias · Consultoria<br/>
              + abas em branco para PCP, SGT, Tratativas e Atendimentos
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── App principal ─────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]   = useState(null)
  const [perfil, setPerfil]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [pagina, setPagina]     = useState('inicio')
  const [tema, setTema]         = useState(() => localStorage.getItem('tema') || 'light')
  const [sbOpen, setSbOpen]     = useState(false)

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) carregarPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function carregarPerfil(userId) {
    const { data } = await supabase.from('perfis').select('*').eq('id', userId).single()
    setPerfil(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13 }}>
      Carregando...
    </div>
  )

  if (!session) return <Login tema={tema} toggleTema={() => setTema(t => t === 'dark' ? 'light' : 'dark')} />

  const isAdmin        = perfil?.role === 'admin'
  const isEspecialista = perfil?.role === 'especialista'
  const initials       = (perfil?.nome || session.user.email || '').slice(0, 2).toUpperCase()
  const nomeUsuario    = perfil?.nome || session.user.email || ''

  const navItems = [
    { id: 'inicio',       label: 'Início',       badge: null },
   // { id: 'consultoria',  label: 'Consultoria',  badge: null },
    { id: 'financeiro',   label: 'Financeiro',   badge: null },
    { id: 'patrimonio',   label: 'Patrimônio',   badge: null },
    { id: 'epis',         label: 'EPIs',         badge: null },
    { id: 'veiculos',     label: 'Veículos',     badge: null },
    { id: 'onedoc',       label: 'Administrativo', badge: null },
    ...(isAdmin ? [{ id: 'colaboradores', label: 'Colaboradores', badge: null }] : []),
  ]

  // ── Estilos da sidebar ─────────────────────────────────────────────────
  const sbItemBase = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', cursor: 'pointer', width: '100%',
    border: 'none', background: 'none', fontFamily: 'inherit',
    borderLeft: '2px solid transparent', transition: 'all .12s',
    position: 'relative', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      <aside
        style={{
          width: sbOpen ? 220 : 56, flexShrink: 0,
          background: 'var(--sb-bg)', borderRight: '1px solid var(--sb-border)',
          display: 'flex', flexDirection: 'column',
          height: '100vh', position: 'sticky', top: 0,
          transition: 'width .22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden', zIndex: 20,
        }}
        onMouseEnter={() => setSbOpen(true)}
        onMouseLeave={() => setSbOpen(false)}
      >
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '18px 15px 16px', borderBottom: '1px solid var(--sb-border)', flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 14px rgba(99,102,241,.4)' }}>
              {IC.bolt}
            </div>
            <div style={{ opacity: sbOpen ? 1 : 0, transition: 'opacity .15s .06s' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sb-text)', letterSpacing: '.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>IndustrialOS</div>
              <div style={{ fontSize: 9, color: 'var(--sb-muted)', marginTop: 1, whiteSpace: 'nowrap' }}>IST · MPP · Energia</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0', scrollbarWidth: 'none' }}>
            {navItems.map(item => {
              const on = pagina === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setPagina(item.id)}
                  style={{
                    ...sbItemBase,
                    color: on ? 'var(--sb-active)' : 'var(--sb-text2)',
                    background: on ? 'var(--sb-active-bg)' : 'none',
                    borderLeftColor: on ? 'var(--sb-active)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'var(--sb-hover)' }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'none' }}
                >
                  <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: 7, background: on ? 'rgba(165,180,252,.1)' : 'none' }}>
                    {IC[item.id]}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, opacity: sbOpen ? 1 : 0, transition: 'opacity .12s .06s', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  {/* Tooltip quando recolhida */}
                  {!sbOpen && (
                    <div style={{ position: 'absolute', left: 56, top: '50%', transform: 'translateY(-50%)', background: 'var(--sb-tooltip-bg)', color: '#e0e7ff', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.3)', opacity: 0, transition: 'opacity .1s' }} className="sb-tooltip">
                      {item.label}
                    </div>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: '12px 8px', borderTop: '1px solid var(--sb-border)', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            {/* Toggle tema */}
            <button
              onClick={() => setTema(t => t === 'dark' ? 'light' : 'dark')}
              style={{ ...sbItemBase, color: 'var(--sb-text2)', padding: '7px 6px', borderRadius: 7, borderLeft: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sb-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: 7, background: 'rgba(255,255,255,.06)' }}>
                {tema === 'dark' ? IC.sun : IC.moon}
              </div>
              <span style={{ fontSize: 11, opacity: sbOpen ? 1 : 0, transition: 'opacity .12s .06s', whiteSpace: 'nowrap', color: 'var(--sb-text2)' }}>
                {tema === 'dark' ? 'Modo claro' : 'Modo escuro'}
              </span>
            </button>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ opacity: sbOpen ? 1 : 0, transition: 'opacity .12s .06s', minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{nomeUsuario}</div>
                <div style={{ fontSize: 10, color: 'var(--sb-muted)', marginTop: 1 }}>{perfil?.role || 'Usuário'}</div>
              </div>
            </div>
            {/* Sair */}
            <button
              onClick={() => supabase.auth.signOut()}
              style={{ ...sbItemBase, color: 'var(--sb-text2)', padding: '7px 6px', borderRadius: 7, borderLeft: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sb-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: 7, background: 'rgba(255,255,255,.06)' }}>
                {IC.sair}
              </div>
              <span style={{ fontSize: 11, opacity: sbOpen ? 1 : 0, transition: 'opacity .12s .06s', whiteSpace: 'nowrap', color: 'var(--sb-text2)' }}>Sair</span>
            </button>
          </div>

        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', minWidth: 0 }}>
        {pagina === 'inicio'        && <Inicio onNavegar={setPagina} tema={tema} nomeUsuario={nomeUsuario} />}
       // {pagina === 'consultoria'   && <Consultoria isAdmin={isAdmin} isEspecialista={isEspecialista} />}
        {pagina === 'financeiro'    && <Financeiro isAdmin={isAdmin} />}
        {pagina === 'patrimonio'    && <Patrimonio isAdmin={isAdmin} />}
        {pagina === 'epis'          && <Epis isAdmin={isAdmin} />}
        {pagina === 'veiculos'      && <Veiculos isAdmin={isAdmin} />}
        {pagina === 'onedoc'        && <OneDock isAdmin={isAdmin} />}
        {pagina === 'colaboradores' && isAdmin && <Colaboradores />}
      </main>

    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────
function Login({ tema, toggleTema }) {
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [erro, setErro]           = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setCarregando(true); setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setCarregando(false)
  }

  const inp = {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
    fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative' }}>
      <button onClick={toggleTema} style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {tema === 'dark' ? IC.sun : IC.moon}
      </button>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 4px 24px var(--shadow)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 0 28px rgba(99,102,241,.3)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>Gestão de Processos</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Energia · Plataforma Industrial</div>
        </div>

        <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>E-mail</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@empresa.com" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Senha</label>
            <input style={inp} type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required />
          </div>
          {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 7, padding: '8px 12px', color: 'var(--red)', fontSize: 12 }}>{erro}</div>}
          <button type="submit" disabled={carregando} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 16px rgba(99,102,241,.3)', marginTop: 4, transition: 'opacity .15s' }}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
