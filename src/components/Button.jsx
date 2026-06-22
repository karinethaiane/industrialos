import React from 'react'

export default function Button({ children, onClick, primary, disabled, style, className, type='button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap:8, padding: '10px 14px', borderRadius:8, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', fontWeight:600,
  }
  const primaryStyle = primary ? { background: 'var(--a)', color: '#fff' } : { background: 'var(--surface2)', color: 'var(--text)' }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={{ ...base, ...primaryStyle, ...style }}>
      {children}
    </button>
  )
}
