import React from 'react'

export default function Input({ value, onChange, placeholder, style, type='text', ...rest }) {
  const base = {
    background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
  }
  return <input {...rest} type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ ...base, ...style }} />
}
