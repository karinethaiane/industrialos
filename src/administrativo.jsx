import { useState } from 'react'
import OneDoc from './onedoc'
import AlocacaoHoras from './alocacaoHoras/AlocacaoHoras'

// Tela "Administrativo": abas (mesmo padrão do Financeiro)
//  1) Documentos (1Doc)  → o componente que já existia (onedoc.jsx)
//  2) Alocação de Horas  → a nova aba
//
// As duas abas ficam sempre "montadas" e só se escondem. Assim, ao trocar de aba,
// as planilhas importadas na Alocação de Horas não se perdem.

const S = {
  wrap:   { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' },
  title:  { fontSize: 21, fontWeight: 700, letterSpacing: '-.02em' },
  sub:    { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  tabs:   { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 18 },
  tab:    (on) => ({
    padding: '9px 20px', fontSize: 13, fontWeight: on ? 600 : 500, cursor: 'pointer',
    color: on ? 'var(--teal)' : 'var(--muted)', background: 'none', border: 'none',
    borderBottom: on ? '2px solid var(--teal)' : '2px solid transparent',
    marginBottom: -1, fontFamily: 'inherit', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 7,
  }),
}

export default function Administrativo({ isAdmin = false }) {
  const [aba, setAba] = useState('onedoc')   // 'onedoc' | 'alocacao'

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Administrativo</div>
          <div style={S.sub}>1Doc, documentos internos e Alocação de Horas</div>
        </div>
      </div>

      <div style={S.tabs}>
        <button style={S.tab(aba === 'onedoc')} onClick={() => setAba('onedoc')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          Documentos (1Doc)
        </button>
        <button style={S.tab(aba === 'alocacao')} onClick={() => setAba('alocacao')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
          Alocação de Horas
        </button>
      </div>

      <div style={{ display: aba === 'onedoc' ? 'block' : 'none' }}>
        <OneDoc isAdmin={isAdmin} embutido />
      </div>
      <div style={{ display: aba === 'alocacao' ? 'block' : 'none' }}>
        <AlocacaoHoras isAdmin={isAdmin} />
      </div>
    </div>
  )
}
