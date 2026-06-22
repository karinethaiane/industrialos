import React from 'react'

export default function Card({ children, onClick, style, className }) {
  const base = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, boxShadow: '0 1px 4px var(--shadow)', cursor: onClick ? 'pointer' : 'default',
  }
  return (
    <div onClick={onClick} className={className} style={{ ...base, ...style }}>
      {children}
    </div>
  )
}
