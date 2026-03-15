import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ── helpers ──────────────────────────────────────────────────────────────────
function calcStatusEpi(dataProx) {
  if (!dataProx) return 'VENCIDO'
  const dias = Math.floor((new Date(dataProx) - new Date()) / 86400000)
  if (dias < 0)  return 'VENCIDO'
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
  return new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }
function fmtData(d)    { if (!d) return null; return new Date(d).toLocaleDateString('pt-BR', { timeZone:'UTC' }) }
function fmtVal(v)     { if (!v && v !== 0) return null; return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits:2 })}` }

// ── estilos ───────────────────────────────────────────────────────────────────
const S = {
  wrap:      { padding:32, background:'var(--bg)', minHeight:'100vh' },
  // Hero
  heroTitle: { fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-.02em' },
  heroSub:   { fontFamily:'DM Mono, monospace', fontSize:11, color:'var(--text3)', marginTop:4 },
  // Alertas
  alerts:    { display:'flex', flexDirection:'column', gap:6, marginBottom:24 },
  al:        (tipo) => ({
    display:'flex', alignItems:'flex-start', gap:14,
    padding:'10px 14px', borderLeft:`2px solid ${tipo==='crit'?'var(--danger)':'var(--warn)'}`,
    borderRadius:'0 6px 6px 0', fontSize:12,
    background: tipo==='crit' ? 'var(--danger-dim)' : 'var(--warn-dim)',
  }),
  alLbl:  (tipo) => ({ fontWeight:600, color: tipo==='crit'?'var(--danger)':'var(--warn)', whiteSpace:'nowrap', paddingTop:1, flexShrink:0 }),
  alChips:   { display:'flex', gap:6, flexWrap:'wrap' },
  alc:       { fontFamily:'DM Mono, monospace', fontSize:10, padding:'2px 7px', borderRadius:3, background:'var(--surface2)', color:'var(--text2)', border:'1px solid var(--border2)' },
  // Seção
  sec:       { fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.09em', color:'var(--text3)', marginBottom:12, display:'flex', alignItems:'center', gap:10 },
  secLine:   { flex:1, height:1, background:'var(--border)' },
  // Cards módulo
  mods:      { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:8, marginBottom:28 },
  mod:       (tipo) => ({
    background:'var(--surface)', borderRadius:8, padding:16, cursor:'pointer',
    transition:'border-color .15s, transform .15s',
    borderTop: `2px solid ${tipo==='crit'?'var(--danger)':tipo==='warn'?'var(--warn)':tipo==='blue'?'var(--a)':'var(--border2)'}`,
    border: `1px solid var(--border)`,
    borderTopColor: tipo==='crit'?'var(--danger)':tipo==='warn'?'var(--warn)':tipo==='blue'?'var(--a)':'var(--border2)',
  }),
  modTop:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 },
  modIcon:   { width:32, height:32, borderRadius:7, background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' },
  modCnt:    (tipo) => ({
    fontFamily:'DM Mono, monospace', fontSize:10, padding:'2px 6px', borderRadius:3,
    background: tipo==='crit'?'var(--danger-dim)':tipo==='warn'?'var(--warn-dim)':'var(--surface2)',
    color:      tipo==='crit'?'var(--danger)':tipo==='warn'?'var(--warn)':'var(--text3)',
    border:     `1px solid ${tipo==='crit'?'rgba(224,82,82,.2)':tipo==='warn'?'rgba(232,162,68,.2)':'var(--border)'}`,
  }),
  modName:   { fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 },
  modSub:    { fontSize:11, color:'var(--text3)', marginBottom:12 },
  modStats:  { display:'flex', gap:16 },
  msV:       (cor) => ({ fontFamily:'DM Mono, monospace', fontSize:18, fontWeight:500, lineHeight:1, marginBottom:3, color: cor==='a'?'var(--a)':cor==='crit'?'var(--danger)':cor==='warn'?'var(--warn)':'var(--text2)' }),
  msL:       { fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em' },
  // Tabela pendências
  ptable:    { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' },
  ptHead:    { display:'grid', gridTemplateColumns:'100px 1fr 100px 130px 80px', padding:'9px 16px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600 },
  ptRow:     { display:'grid', gridTemplateColumns:'100px 1fr 100px 130px 80px', alignItems:'center', padding:'11px 16px', borderBottom:'1px solid var(--border)', fontSize:12.5, color:'var(--text2)', cursor:'pointer', transition:'background .1s' },
  tag:       (tipo) => ({
    display:'inline-flex', padding:'2px 7px', borderRadius:3, fontSize:10, fontWeight:500,
    background: tipo==='crit'?'var(--danger-dim)':tipo==='warn'?'var(--warn-dim)':tipo==='a'?'var(--a-dim)':'var(--surface2)',
    color:      tipo==='crit'?'var(--danger)':tipo==='warn'?'var(--warn)':tipo==='a'?'var(--a)':'var(--text2)',
    border:     `1px solid ${tipo==='crit'?'rgba(224,82,82,.2)':tipo==='warn'?'rgba(232,162,68,.2)':tipo==='a'?'var(--a-border)':'var(--border2)'}`,
  }),
  stCrit:    { fontSize:12, color:'var(--danger)', fontWeight:500 },
  stWarn:    { fontSize:12, color:'var(--warn)',   fontWeight:500 },
  stMuted:   { fontSize:12, color:'var(--text3)' },
  prio:      { display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text3)' },
  pb:        (w) => ({ height:3, width:w, borderRadius:2, background:'var(--text3)' }),
  // Modal
  modal:     { position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(4px)' },
  modalBox:  { background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:12, padding:28, width:'90%', maxWidth:480, boxShadow:'0 8px 40px var(--shadow)' },
}

const STATUS_PAG_COR   = { em_andamento:'var(--a)', ajustes:'var(--warn)', aguardando_desbloqueio:'var(--danger)', concluido:'var(--ok)', cancelado:'var(--text3)' }
const STATUS_PAG_LABEL = { em_andamento:'Em andamento', ajustes:'Ajustes', aguardando_desbloqueio:'Aguard. Desbloqueio', concluido:'Concluído', cancelado:'Cancelado' }

export default function Dashboard({ onNavegar }) {
  const [dados, setDados]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalPag, setModalPag] = useState(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const hoje = new Date()

    const [episRes, veicRes, emisRes, pagRes, kickRes, sebRes, dirRes, patrimRes, docRes] = await Promise.all([
      supabase.from('epis').select('*, colaboradores(nome)'),
      supabase.from('veiculos').select('*'),
      supabase.from('emissoes_nf').select('*'),
      supabase.from('solicitacoes_pagamento').select('*'),
      supabase.from('kickoffs').select('*'),
      supabase.from('sebraetec').select('id, status'),
      supabase.from('diretas').select('id, status, status_nf'),
      supabase.from('patrimonios').select('id'),
      supabase.from('documentos_1doc').select('id, status'),
    ])

    const episRaw  = episRes.data  || []
    const veics    = veicRes.data  || []
    const emissoes = emisRes.data  || []
    const pagamentos = pagRes.data || []
    const kickoffs = kickRes.data  || []
    const sebraetec = sebRes.data  || []
    const diretas   = dirRes.data  || []
    const patrimonios = patrimRes.data || []
    const docs      = docRes.data  || []

    // EPIs
    const ultimas      = ultimasEntregas(episRaw)
    const episVigentes = ultimas.filter(e => calcStatusEpi(e.data_prox_entrega) === 'VIGENTE').length
    const episVencidos = ultimas.filter(e => calcStatusEpi(e.data_prox_entrega) === 'VENCIDO')
    const episAVencer  = ultimas.filter(e => calcStatusEpi(e.data_prox_entrega) === 'VENCENDO')

    // Veículos
    const veicRevVencida = veics.filter(v => {
      const vd = v.data_proxima_revisao && new Date(v.data_proxima_revisao) < hoje
      const vk = v.km_proxima_revisao   && v.km_atual >= v.km_proxima_revisao
      return vd || vk
    })
    const veicRevProxima = veics.filter(v => {
      if (veicRevVencida.find(r => r.id === v.id)) return false
      const pd = v.data_proxima_revisao && new Date(v.data_proxima_revisao) <= new Date(Date.now() + 30*86400000)
      const pk = v.km_proxima_revisao   && v.km_atual >= v.km_proxima_revisao - 500
      return pd || pk
    })
    const veicEmUso = veics.filter(v => v.status === 'em_uso')

    // Financeiro
    const nfsAbertas   = emissoes.filter(e => e.status_sgt === 'Em execução')
    const pagBloqueados = pagamentos.filter(p => p.status === 'aguardando_desbloqueio')

    // Consultoria
    const bpAgCron  = kickoffs.filter(k => k.status === 'aguardando_cronograma')
    const nfPendente = diretas.filter(d => d.status === 'concluido' && d.status_nf === 'pendente')

    // Docs
    const docsPendentes = docs.filter(d => d.status === 'pendente')
    const docsAssinados = docs.filter(d => d.status === 'assinado')

    // Pendências
    const pendencias = []
    veicRevVencida.slice(0,2).forEach(v => pendencias.push({ modulo:'Veículos', tipo:'crit', desc:`${v.placa} — Revisão preventiva vencida`, stTipo:'crit', st:'Vencida', valor:null, previsao:null, pagObj:null }))
    episVencidos.slice(0,2).forEach(e => pendencias.push({ modulo:'EPIs', tipo:'crit', desc:`${e.tipo}${e.colaboradores?.nome?' — '+e.colaboradores.nome:''} · Vencido`, stTipo:'crit', st:'Vencido', valor:null, previsao:null, pagObj:null }))
    pagBloqueados.slice(0,2).forEach(p => pendencias.push({ modulo:'Financeiro', tipo:'warn', desc:`Chamado #${p.numero_chamado} — Aguardando desbloqueio`, stTipo:'warn', st:'Bloqueado', valor:p.valor, previsao:p.previsao_pagamento, pagObj:p }))
    bpAgCron.slice(0,2).forEach(k => pendencias.push({ modulo:'Consultoria', tipo:'a', desc:`${k.empresa} — ${k.id_sgt} · Ag. cronograma`, stTipo:'warn', st:'Aguardando', valor:null, previsao:null, pagObj:null }))
    episAVencer.slice(0,2).forEach(e => { const dias=Math.floor((new Date(e.data_prox_entrega)-hoje)/86400000); pendencias.push({ modulo:'EPIs', tipo:'warn', desc:`${e.tipo}${e.colaboradores?.nome?' — '+e.colaboradores.nome:''} · Vence em ${dias} dias`, stTipo:'warn', st:'A vencer', valor:null, previsao:null, pagObj:null }) })
    veicRevProxima.slice(0,1).forEach(v => { const dias=v.data_proxima_revisao?Math.floor((new Date(v.data_proxima_revisao)-hoje)/86400000):null; pendencias.push({ modulo:'Veículos', tipo:'', desc:`${v.placa} — Revisão em ${dias!=null?dias+' dias':'breve'}`, stTipo:'', st:'Próxima', valor:null, previsao:null, pagObj:null }) })
    docsPendentes.slice(0,1).forEach(_ => pendencias.push({ modulo:'1Doc', tipo:'', desc:'Documentos aguardando assinatura', stTipo:'', st:'Pendente', valor:null, previsao:null, pagObj:null }))

    setDados({
      episVigentes, episVencidos:episVencidos.length, episAVencer:episAVencer.length,
      veicsTotal:veics.length, veicEmUso:veicEmUso.length, veicRevVencida:veicRevVencida.length, veicRevProxima:veicRevProxima.length,
      nfsAbertas:nfsAbertas.length, pagBloqueados:pagBloqueados.length,
      bpTotal:kickoffs.length, bpAgCron:bpAgCron.length, sebTotal:sebraetec.length, dirTotal:diretas.length, nfPendente:nfPendente.length,
      patrimoniosTotal:patrimonios.length,
      docsTotal:docs.length, docsPendentes:docsPendentes.length, docsAssinados:docsAssinados.length,
      pendencias,
    })
    setLoading(false)
  }

  const trHover = { onMouseEnter:e=>e.currentTarget.style.background='var(--subtle)', onMouseLeave:e=>e.currentTarget.style.background='transparent' }

  if (loading) return <div style={{...S.wrap, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)'}}>Carregando...</div>

  const d = dados
  const critCount = d.episVencidos + d.veicRevVencida
  const warnCount = d.pagBloqueados + d.bpAgCron + d.episAVencer + d.nfPendente

  return (
    <div style={S.wrap}>
      {/* Hero */}
      <div style={{ marginBottom:24 }}>
        <div style={S.heroTitle}>{saudacao()}</div>
        <div style={S.heroSub}>{capitalize(fmtDataBR())}</div>
      </div>

      {/* Alertas */}
      {(critCount > 0 || warnCount > 0) && (
        <div style={S.alerts}>
          {critCount > 0 && (
            <div style={S.al('crit')}>
              <span style={S.alLbl('crit')}>Atenção imediata</span>
              <div style={S.alChips}>
                {d.veicRevVencida > 0 && <span style={S.alc}>{d.veicRevVencida} revisão{d.veicRevVencida>1?'ões':''} de veículo{d.veicRevVencida>1?'s':''} vencida{d.veicRevVencida>1?'s':''}</span>}
                {d.episVencidos  > 0 && <span style={S.alc}>{d.episVencidos} EPI{d.episVencidos>1?'s':''} vencido{d.episVencidos>1?'s':''}</span>}
              </div>
            </div>
          )}
          {warnCount > 0 && (
            <div style={S.al('warn')}>
              <span style={S.alLbl('warn')}>Requer acompanhamento</span>
              <div style={S.alChips}>
                {d.bpAgCron   > 0 && <span style={S.alc}>{d.bpAgCron} empresa{d.bpAgCron>1?'s':''} ag. cronograma</span>}
                {d.nfPendente > 0 && <span style={S.alc}>{d.nfPendente} NF{d.nfPendente>1?'s':''} pendente{d.nfPendente>1?'s':''}</span>}
                {d.pagBloqueados > 0 && <span style={S.alc}>{d.pagBloqueados} chamado{d.pagBloqueados>1?'s':''} bloqueado{d.pagBloqueados>1?'s':''}</span>}
                {d.episAVencer > 0 && <span style={S.alc}>{d.episAVencer} EPI{d.episAVencer>1?'s':''} vencendo em 30 dias</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cards módulos */}
      <div style={{...S.sec}}>
        Módulos <div style={S.secLine} />
      </div>
      <div style={S.mods}>

        {/* Consultoria */}
        <div style={{...S.mod('blue'), ':hover':{transform:'translateY(-1px)'}}} onClick={()=>onNavegar?.('consultoria')}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 16px var(--shadow)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
          <div style={S.modTop}>
            <div style={S.modIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
            {d.bpAgCron > 0 && <span style={S.modCnt('warn')}>{d.bpAgCron} ag. cronograma</span>}
          </div>
          <div style={S.modName}>Consultoria</div>
          <div style={S.modSub}>B+P · Sebraetec · Diretas</div>
          <div style={S.modStats}>
            <div><div style={S.msV('a')}>{d.bpTotal}</div><div style={S.msL}>B+P</div></div>
            <div><div style={S.msV('')}>{d.sebTotal}</div><div style={S.msL}>Sebraetec</div></div>
            <div><div style={S.msV('')}>{d.dirTotal}</div><div style={S.msL}>Diretas</div></div>
          </div>
        </div>

        {/* Financeiro */}
        <div style={S.mod(d.pagBloqueados>0?'warn':'')} onClick={()=>onNavegar?.('financeiro')}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 16px var(--shadow)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
          <div style={S.modTop}>
            <div style={S.modIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
            {d.pagBloqueados > 0 && <span style={S.modCnt('warn')}>{d.pagBloqueados} bloqueado</span>}
          </div>
          <div style={S.modName}>Financeiro</div>
          <div style={S.modSub}>NFs e solicitações</div>
          <div style={S.modStats}>
            <div><div style={S.msV('')}>{d.nfsAbertas}</div><div style={S.msL}>NFs abertas</div></div>
            {d.pagBloqueados > 0 && <div><div style={S.msV('warn')}>{d.pagBloqueados}</div><div style={S.msL}>Bloqueado</div></div>}
          </div>
        </div>

        {/* EPIs */}
        <div style={S.mod(d.episVencidos>0?'crit':d.episAVencer>0?'warn':'')} onClick={()=>onNavegar?.('epis')}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 16px var(--shadow)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
          <div style={S.modTop}>
            <div style={S.modIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
            {d.episVencidos > 0 && <span style={S.modCnt('crit')}>{d.episVencidos} vencido{d.episVencidos>1?'s':''}</span>}
            {d.episVencidos === 0 && d.episAVencer > 0 && <span style={S.modCnt('warn')}>{d.episAVencer} a vencer</span>}
          </div>
          <div style={S.modName}>EPIs</div>
          <div style={S.modSub}>Equipamentos de proteção</div>
          <div style={S.modStats}>
            <div><div style={S.msV('a')}>{d.episVigentes}</div><div style={S.msL}>Vigentes</div></div>
            {d.episVencidos > 0 && <div><div style={S.msV('crit')}>{d.episVencidos}</div><div style={S.msL}>Vencidos</div></div>}
            {d.episAVencer  > 0 && <div><div style={S.msV('warn')}>{d.episAVencer}</div><div style={S.msL}>A vencer</div></div>}
          </div>
        </div>

        {/* Veículos */}
        <div style={S.mod(d.veicRevVencida>0?'crit':d.veicRevProxima>0?'warn':'')} onClick={()=>onNavegar?.('veiculos')}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 16px var(--shadow)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
          <div style={S.modTop}>
            <div style={S.modIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>
            {d.veicRevVencida > 0 && <span style={S.modCnt('crit')}>{d.veicRevVencida} rev. vencida</span>}
            {d.veicRevVencida === 0 && d.veicRevProxima > 0 && <span style={S.modCnt('warn')}>{d.veicRevProxima} rev. próxima</span>}
          </div>
          <div style={S.modName}>Veículos</div>
          <div style={S.modSub}>Frota e manutenções</div>
          <div style={S.modStats}>
            <div><div style={S.msV('')}>{d.veicsTotal}</div><div style={S.msL}>Total</div></div>
            <div><div style={S.msV('')}>{d.veicEmUso}</div><div style={S.msL}>Em uso</div></div>
            {d.veicRevVencida > 0 && <div><div style={S.msV('crit')}>{d.veicRevVencida}</div><div style={S.msL}>Rev. vencida</div></div>}
          </div>
        </div>

        {/* Patrimônio */}
        <div style={S.mod('')} onClick={()=>onNavegar?.('patrimonio')}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 16px var(--shadow)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
          <div style={S.modTop}>
            <div style={S.modIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/></svg></div>
          </div>
          <div style={S.modName}>Patrimônio</div>
          <div style={S.modSub}>Bens e ocorrências</div>
          <div style={S.modStats}>
            <div><div style={S.msV('a')}>{d.patrimoniosTotal}</div><div style={S.msL}>Total</div></div>
          </div>
        </div>

        {/* 1Doc */}
        <div style={S.mod(d.docsPendentes>0?'warn':'')} onClick={()=>onNavegar?.('onedoc')}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 16px var(--shadow)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
          <div style={S.modTop}>
            <div style={S.modIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
            {d.docsPendentes > 0 && <span style={S.modCnt('warn')}>{d.docsPendentes} pendente{d.docsPendentes>1?'s':''}</span>}
          </div>
          <div style={S.modName}>1Doc</div>
          <div style={S.modSub}>Documentos para assinatura</div>
          <div style={S.modStats}>
            <div><div style={S.msV('')}>{d.docsTotal}</div><div style={S.msL}>Total</div></div>
            {d.docsPendentes > 0 && <div><div style={S.msV('warn')}>{d.docsPendentes}</div><div style={S.msL}>Pendentes</div></div>}
            {d.docsAssinados > 0 && <div><div style={S.msV('')}>{d.docsAssinados}</div><div style={S.msL}>Assinados</div></div>}
          </div>
        </div>

      </div>

      {/* Pendências */}
      {d.pendencias.length > 0 && (<>
        <div style={S.sec}>Pendências prioritárias <div style={S.secLine} /></div>
        <div style={S.ptable}>
          <div style={S.ptHead}>
            <span>Módulo</span><span>Descrição</span><span>Status</span><span>Valor / Previsão</span><span>Prioridade</span>
          </div>
          {d.pendencias.map((p, i) => (
            <div key={i} style={{ ...S.ptRow, borderBottom: i===d.pendencias.length-1?'none':'1px solid var(--border)' }} {...trHover}
              onClick={() => p.pagObj && setModalPag(p.pagObj)}>
              <span><span style={S.tag(p.tipo)}>{p.modulo}</span></span>
              <span style={{ color: p.stTipo==='crit'?'var(--text)':'var(--text2)', fontWeight: p.stTipo==='crit'?500:400 }}>{p.desc}</span>
              <span style={p.stTipo==='crit'?S.stCrit:p.stTipo==='warn'?S.stWarn:S.stMuted}>{p.st}</span>
              <span>
                {p.valor ? (
                  <div>
                    <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'var(--text)' }}>{fmtVal(p.valor)}</div>
                    <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:'var(--text3)' }}>{p.previsao?`Prev. ${fmtData(p.previsao)}`:'Sem previsão'}</div>
                  </div>
                ) : <span style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'var(--text3)' }}>—</span>}
              </span>
              <span>
                <div style={S.prio}>
                  <div style={S.pb(p.stTipo==='crit'?20:p.stTipo==='warn'?13:7)} />
                  {p.stTipo==='crit'?'Alta':p.stTipo==='warn'?'Média':'Baixa'}
                </div>
              </span>
            </div>
          ))}
        </div>
      </>)}

      {/* Modal pagamento */}
      {modalPag && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModalPag(null)}>
          <div style={S.modalBox}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:3 }}>Detalhes da Solicitação</div>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:12, color:'var(--a)' }}>Chamado #{modalPag.numero_chamado}</div>
              </div>
              <button onClick={()=>setModalPag(null)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:20, lineHeight:1, padding:0 }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              {[['Solicitante',modalPag.solicitante],['Razão Social',modalPag.razao_social],['Nº NF/Boleto',modalPag.numero_nf_boleto_al]].map(([lbl,val])=>(
                <div key={lbl}>
                  <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>{lbl}</div>
                  <div style={{ fontSize:13, color:'var(--text)' }}>{val||'—'}</div>
                </div>
              ))}
            </div>
            {modalPag.descricao && (
              <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:7, padding:'10px 12px', fontSize:12, color:'var(--text2)', lineHeight:1.6, marginBottom:14 }}>{modalPag.descricao}</div>
            )}
            <div style={{ background:'var(--a-dim)', border:'1px solid var(--a-border)', borderRadius:8, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:20, fontWeight:500, color:'var(--a)' }}>{fmtVal(modalPag.valor)||'—'}</div>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'var(--text3)', marginTop:3 }}>{modalPag.previsao_pagamento?`Previsão: ${fmtData(modalPag.previsao_pagamento)}`:'Sem previsão'}</div>
              </div>
              <span style={{ background:`${STATUS_PAG_COR[modalPag.status]||'var(--text3)'}18`, color:STATUS_PAG_COR[modalPag.status]||'var(--text3)', padding:'3px 10px', borderRadius:5, fontSize:11, fontWeight:600 }}>
                ● {STATUS_PAG_LABEL[modalPag.status]||modalPag.status}
              </span>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
              <button onClick={()=>setModalPag(null)} style={{ background:'var(--subtle)', color:'var(--text2)', border:'1px solid var(--border2)', borderRadius:6, padding:'6px 14px', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Fechar</button>
              <button onClick={()=>{setModalPag(null);onNavegar?.('financeiro')}} style={{ background:'var(--a)', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Ver no Financeiro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
