import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function calcStatusEpi(dataProx) {
  if (!dataProx) return 'VENCIDO'
  const dias = Math.floor((new Date(dataProx) - new Date()) / 86400000)
  if (dias < 0) return 'VENCIDO'
  if (dias <= 30) return 'VENCENDO'
  return 'VIGENTE'
}

function ultimasEntregas(epis) {
  const map = {}
  epis.forEach(e => {
    const key = `${e.colaborador_id}__${(e.tipo || '').toLowerCase().trim()}`
    if (!map[key] || new Date(e.data_entrega) > new Date(map[key].data_entrega)) map[key] = e
  })
  return Object.values(map)
}

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function fmtDataBR() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

const S = {
  wrap: { padding: 28, background: 'var(--bg)', minHeight: '100vh' },
  hero: { background: 'linear-gradient(135deg, rgba(59,130,246,.07), rgba(6,182,212,.04))', border: '1px solid rgba(59,130,246,.15)', borderRadius: 14, padding: '22px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' },
  heroTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  heroSub: { fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'DM Mono, monospace' },
  pills: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  pill: (cor) => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${cor}33`, background: `${cor}14`, color: cor, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .15s' }),
  sectionTitle: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  sectionLine: { flex: 1, height: 1, background: 'var(--border)' },
  modulos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 22 },
  modulo: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 18, cursor: 'pointer', transition: 'all .2s', position: 'relative', overflow: 'hidden' },
  modIcon: { width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--red-dim)', color: 'var(--red)' },
  modTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  modSub: { fontSize: 11, color: 'var(--muted)', marginBottom: 14 },
  modStats: { display: 'flex', gap: 18 },
  modStatVal: (cor) => ({ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 500, color: cor, lineHeight: 1 }),
  modStatLbl: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 3 },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '110px 1fr 130px 100px', padding: '10px 18px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600 },
  tableRow: { display: 'grid', gridTemplateColumns: '110px 1fr 130px 100px', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text2)', cursor: 'pointer', transition: 'background .12s' },
  tag: (bg, cor) => ({ padding: '2px 9px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: bg, color: cor }),
  prio: (cor) => ({ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, color: cor }),
  prioDot: (cor) => ({ width: 7, height: 7, borderRadius: '50%', background: cor, flexShrink: 0 }),
}

export default function Dashboard({ onNavegar }) {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const hoje = new Date()

    const [episRes, veiculosRes, emissoesRes, pagamentosRes] = await Promise.all([
      supabase.from('epis').select('*, colaboradores(nome)'),
      supabase.from('veiculos').select('*'),
      supabase.from('emissoes_nf').select('*'),
      supabase.from('solicitacoes_pagamento').select('*'),
    ])

    const episRaw = episRes.data || []
    const veiculosData = veiculosRes.data || []
    const emissoesData = emissoesRes.data || []
    const pagamentosData = pagamentosRes.data || []

    // EPIs — usa mesma lógica do epis.jsx
    const ultimas = ultimasEntregas(episRaw)
    const episAtivos  = ultimas.filter(e => calcStatusEpi(e.data_prox_entrega) === 'VIGENTE').length
    const episVencidos = ultimas.filter(e => calcStatusEpi(e.data_prox_entrega) === 'VENCIDO')
    const episAVencer  = ultimas.filter(e => calcStatusEpi(e.data_prox_entrega) === 'VENCENDO')

    // Veículos
    const veiculosEmUso = veiculosData.filter(v => v.status === 'em_uso')
    const veiculosRevisaoVencida = veiculosData.filter(v => {
      const vencidaData = v.data_proxima_revisao && new Date(v.data_proxima_revisao) < hoje
      const vencidaKm = v.km_proxima_revisao && v.km_atual >= v.km_proxima_revisao
      return vencidaData || vencidaKm
    })
    const veiculosRevisaoProxima = veiculosData.filter(v => {
      if (veiculosRevisaoVencida.find(r => r.id === v.id)) return false
      const proxData = v.data_proxima_revisao && new Date(v.data_proxima_revisao) <= new Date(Date.now() + 30 * 86400000)
      const proxKm = v.km_proxima_revisao && v.km_atual >= v.km_proxima_revisao - 500
      return proxData || proxKm
    })

    // Financeiro
    const nfsAbertas = emissoesData.filter(e => e.status_sgt === 'Em execução')
    const pagBloqueados = pagamentosData.filter(p => p.status === 'aguardando_desbloqueio')

    // Pendências
    const pendencias = []
    veiculosRevisaoVencida.slice(0, 2).forEach(v => {
      pendencias.push({ modulo: 'Veículos', desc: `${v.placa} — Revisão preventiva vencida`, status: 'Vencida', prio: 'alta' })
    })
    episVencidos.slice(0, 2).forEach(e => {
      pendencias.push({ modulo: 'EPIs', desc: `${e.tipo}${e.colaboradores?.nome ? ' — ' + e.colaboradores.nome : ''} · Vencido`, status: 'Vencido', prio: 'alta' })
    })
    pagBloqueados.slice(0, 2).forEach(p => {
      pendencias.push({ modulo: 'Financeiro', desc: `Chamado #${p.numero_chamado} — Aguardando desbloqueio`, status: 'Bloqueado', prio: 'media' })
    })
    episAVencer.slice(0, 2).forEach(e => {
      const dias = Math.floor((new Date(e.data_prox_entrega) - hoje) / 86400000)
      pendencias.push({ modulo: 'EPIs', desc: `${e.tipo}${e.colaboradores?.nome ? ' — ' + e.colaboradores.nome : ''} · Vence em ${dias} dias`, status: 'A vencer', prio: 'media' })
    })
    veiculosRevisaoProxima.slice(0, 2).forEach(v => {
      const dias = v.data_proxima_revisao ? Math.floor((new Date(v.data_proxima_revisao) - hoje) / 86400000) : null
      pendencias.push({ modulo: 'Veículos', desc: `${v.placa} — Revisão em ${dias != null ? dias + ' dias' : 'breve'}`, status: 'Próxima', prio: 'baixa' })
    })

    setDados({
      episAtivos,
      episVencidos: episVencidos.length,
      episAVencer: episAVencer.length,
      veiculosTotal: veiculosData.length,
      veiculosEmUso: veiculosEmUso.length,
      veiculosRevisaoVencida: veiculosRevisaoVencida.length,
      veiculosRevisaoProxima: veiculosRevisaoProxima.length,
      nfsAbertas: nfsAbertas.length,
      pagBloqueados: pagBloqueados.length,
      pendencias,
    })
    setLoading(false)
  }

  if (loading) return <div style={{ ...S.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Carregando...</div>

  const d = dados
  const totalAlertas = d.veiculosRevisaoVencida + d.episVencidos + d.pagBloqueados + d.episAVencer

  const prioConfig = {
    alta:  { cor: 'var(--red)',   label: 'Alta' },
    media: { cor: 'var(--amber)', label: 'Média' },
    baixa: { cor: 'var(--blue)',  label: 'Baixa' },
  }
  const statusConfig = {
    'Vencida':  { bg: 'var(--red-dim)',   cor: 'var(--red)' },
    'Vencido':  { bg: 'var(--red-dim)',   cor: 'var(--red)' },
    'Bloqueado':{ bg: 'var(--amber-dim)', cor: 'var(--amber)' },
    'A vencer': { bg: 'var(--amber-dim)', cor: 'var(--amber)' },
    'Próxima':  { bg: 'var(--blue-dim)',  cor: 'var(--blue)' },
  }
  const modTagConfig = {
    'Veículos':   { bg: 'var(--blue-dim)',        cor: 'var(--blue)' },
    'EPIs':       { bg: 'var(--green-dim)',        cor: 'var(--green)' },
    'Financeiro': { bg: 'rgba(167,139,250,.12)',   cor: '#a78bfa' },
  }

  const trHover = {
    onMouseEnter: e => e.currentTarget.style.background = 'var(--subtle)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent',
  }

  return (
    <div style={S.wrap}>
      <div style={S.hero}>
        <div>
          <div style={S.heroTitle}>{saudacao()}</div>
          <div style={S.heroSub}>{capitalize(fmtDataBR())}</div>
        </div>
        <div style={S.pills}>
          {d.veiculosRevisaoVencida > 0 && (
            <div style={S.pill('var(--red)')} onClick={() => onNavegar?.('veiculos')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {d.veiculosRevisaoVencida} {d.veiculosRevisaoVencida === 1 ? 'revisão vencida' : 'revisões vencidas'}
            </div>
          )}
          {d.episVencidos > 0 && (
            <div style={S.pill('var(--red)')} onClick={() => onNavegar?.('epis')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {d.episVencidos} {d.episVencidos === 1 ? 'EPI vencido' : 'EPIs vencidos'}
            </div>
          )}
          {d.episAVencer > 0 && (
            <div style={S.pill('var(--amber)')} onClick={() => onNavegar?.('epis')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {d.episAVencer} {d.episAVencer === 1 ? 'EPI vencendo' : 'EPIs vencendo'} em 30 dias
            </div>
          )}
          {d.pagBloqueados > 0 && (
            <div style={S.pill('var(--amber)')} onClick={() => onNavegar?.('financeiro')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              {d.pagBloqueados} {d.pagBloqueados === 1 ? 'chamado aguardando' : 'chamados aguardando'} desbloqueio
            </div>
          )}
          {totalAlertas === 0 && (
            <div style={S.pill('var(--green)')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Tudo em dia
            </div>
          )}
        </div>
      </div>

      <div style={S.sectionTitle}>Módulos <div style={S.sectionLine} /></div>
      <div style={S.modulos}>

        <div style={{ ...S.modulo, borderLeft: '3px solid var(--green)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = '' }}
          onClick={() => onNavegar?.('epis')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={S.modIcon}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
            {(d.episVencidos + d.episAVencer) > 0 && <span style={S.modBadge}>{d.episVencidos + d.episAVencer} atenção</span>}
          </div>
          <div style={S.modTitle}>EPIs</div>
          <div style={S.modSub}>Equipamentos de proteção individual</div>
          <div style={S.modStats}>
            <div><div style={S.modStatVal('var(--green)')}>{d.episAtivos}</div><div style={S.modStatLbl}>Vigentes</div></div>
            {d.episVencidos > 0 && <div><div style={S.modStatVal('var(--red)')}>{d.episVencidos}</div><div style={S.modStatLbl}>Vencidos</div></div>}
            {d.episAVencer > 0 && <div><div style={S.modStatVal('var(--amber)')}>{d.episAVencer}</div><div style={S.modStatLbl}>Vencendo</div></div>}
          </div>
        </div>

        <div style={{ ...S.modulo, borderLeft: '3px solid var(--blue)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = '' }}
          onClick={() => onNavegar?.('veiculos')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={S.modIcon}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>
            {d.veiculosRevisaoVencida > 0 && <span style={S.modBadge}>{d.veiculosRevisaoVencida} {d.veiculosRevisaoVencida === 1 ? 'revisão' : 'revisões'}</span>}
          </div>
          <div style={S.modTitle}>Veículos</div>
          <div style={S.modSub}>Frota e controle de manutenções</div>
          <div style={S.modStats}>
            <div><div style={S.modStatVal('var(--blue)')}>{d.veiculosTotal}</div><div style={S.modStatLbl}>Total</div></div>
            {d.veiculosEmUso > 0 && <div><div style={S.modStatVal('var(--amber)')}>{d.veiculosEmUso}</div><div style={S.modStatLbl}>Em uso</div></div>}
            {d.veiculosRevisaoVencida > 0 && <div><div style={S.modStatVal('var(--red)')}>{d.veiculosRevisaoVencida}</div><div style={S.modStatLbl}>Vencidas</div></div>}
            {d.veiculosRevisaoVencida === 0 && d.veiculosRevisaoProxima > 0 && <div><div style={S.modStatVal('var(--amber)')}>{d.veiculosRevisaoProxima}</div><div style={S.modStatLbl}>Próximas</div></div>}
          </div>
        </div>

        <div style={{ ...S.modulo, borderLeft: '3px solid #a78bfa' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = '' }}
          onClick={() => onNavegar?.('financeiro')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={S.modIcon}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
          </div>
          <div style={S.modTitle}>Financeiro</div>
          <div style={S.modSub}>Emissão de NFs e pagamentos</div>
          <div style={S.modStats}>
            <div><div style={S.modStatVal('#a78bfa')}>{d.nfsAbertas}</div><div style={S.modStatLbl}>NFs abertas</div></div>
            {d.pagBloqueados > 0 && <div><div style={S.modStatVal('var(--amber)')}>{d.pagBloqueados}</div><div style={S.modStatLbl}>Bloqueado</div></div>}
          </div>
        </div>

      </div>

      {d.pendencias.length > 0 && (
        <>
          <div style={S.sectionTitle}>Pendências do dia <div style={S.sectionLine} /></div>
          <div style={S.tableWrap}>
            <div style={S.tableHeader}>
              <span>Módulo</span><span>Descrição</span><span>Status</span><span>Prioridade</span>
            </div>
            {d.pendencias.map((p, i) => {
              const mt = modTagConfig[p.modulo] || { bg: 'var(--subtle)', cor: 'var(--muted)' }
              const st = statusConfig[p.status] || { bg: 'var(--subtle)', cor: 'var(--muted)' }
              const pr = prioConfig[p.prio]
              return (
                <div key={i} style={{ ...S.tableRow, borderBottom: i === d.pendencias.length - 1 ? 'none' : '1px solid var(--border)' }} {...trHover}>
                  <span><span style={S.tag(mt.bg, mt.cor)}>{p.modulo}</span></span>
                  <span>{p.desc}</span>
                  <span><span style={S.tag(st.bg, st.cor)}>{p.status}</span></span>
                  <span style={S.prio(pr.cor)}><div style={S.prioDot(pr.cor)} />{pr.label}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}