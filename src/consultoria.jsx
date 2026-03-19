import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const CARGOS_CONSULTOR  = ['consultor técnico', 'consultora técnica']
const CARGO_ESPECIALISTA = 'especialista técnico'
const CARGO_COORDENADOR  = 'coordenador'

const CONFIG_PORTE = {
  'Micro/Pequeno — 80h':  { horasTotal: 80,  horasCT: 68,  horasEsp: 8,  horasEdu: 4, duracaoMin: 90,  label: '80h'  },
  'Médio — 120h':         { horasTotal: 120, horasCT: 104, horasEsp: 12, horasEdu: 4, duracaoMin: 75,  label: '120h' },
  'Médio — 110h':         { horasTotal: 110, horasCT: 94,  horasEsp: 8,  horasEdu: 4, duracaoMin: 75,  label: '110h' },
}
const HORAS_KO_PORTE = { 'Micro/Pequeno — 80h': 4, 'Médio — 120h': 4, 'Médio — 110h': 4 }

// Status kick off B+P
const STATUS_KO_LABEL = { aguardando_cronograma: 'Ag. Cronograma', pendente: 'Pendente', apropriado: 'Apropriado' }
const STATUS_KO_COR   = { aguardando_cronograma: 'var(--blue)', pendente: 'var(--amber)', apropriado: 'var(--green)' }

// Status atendimento (B+P, Sebraetec, Diretas)
const STATUS_AT_LABEL = { aguardando: 'Aguardando', nao_iniciado: 'Não iniciado', em_execucao: 'Em execução', concluido: 'Concluído', cancelado: 'Cancelado' }
const STATUS_AT_COR   = { aguardando: '#fb923c', nao_iniciado: 'var(--muted)', em_execucao: 'var(--blue)', concluido: 'var(--green)', cancelado: 'var(--red)' }

// Status NF (Diretas)
const STATUS_NF_LABEL = { pendente: 'NF Pendente', solicitada: 'NF Solicitada', emitida: 'NF Emitida' }
const STATUS_NF_COR   = { pendente: 'var(--muted)', solicitada: 'var(--purple)', emitida: 'var(--green)' }

const PORTES = ['Micro', 'Pequeno', 'Médio']
const PORTE_COR = { Micro: 'var(--green)', Pequeno: 'var(--amber)', Médio: 'var(--blue)' }

// Feriados nacionais Brasil 2025-2027
const FERIADOS_NACIONAIS = [
  '2025-01-01','2025-04-18','2025-04-19','2025-04-21','2025-05-01','2025-06-19',
  '2025-09-07','2025-10-12','2025-11-02','2025-11-15','2025-11-20','2025-12-25',
  '2026-01-01','2026-02-16','2026-02-17','2026-04-03','2026-04-21','2026-05-01',
  '2026-06-04','2026-09-07','2026-10-12','2026-11-02','2026-11-15','2026-11-20','2026-12-25',
  '2027-01-01','2027-02-08','2027-02-09','2027-03-26','2027-04-21','2027-05-01',
  '2027-05-27','2027-09-07','2027-10-12','2027-11-02','2027-11-15','2027-11-20','2027-12-25',
]
const FERIADOS_NOME = {
  '01-01':'Confraternização Universal','02-16':'Carnaval','02-17':'Carnaval',
  '04-03':'Sexta-feira Santa','04-18':'Sexta-feira Santa','04-19':'Paixão de Cristo',
  '04-21':'Tiradentes','05-01':'Dia do Trabalho','06-04':'Corpus Christi',
  '06-19':'Corpus Christi','05-27':'Corpus Christi','09-07':'Independência do Brasil',
  '10-12':'Nossa Sra. Aparecida','11-02':'Finados','11-15':'Proclamação da República',
  '11-20':'Consciência Negra','12-25':'Natal',
}
function nomeFeriado(dateStr) {
  const mmdd = dateStr.slice(5)
  return FERIADOS_NOME[mmdd] || 'Feriado Nacional'
}
function isFeriado(dateStr) { return FERIADOS_NACIONAIS.includes(dateStr) }

// Atividades
const ATIVIDADES_80H = [
  { etapa:'Preparação',            atividade:'Reunião de Kick Off: apresentar o programa, visita no Gemba, definir focal point', resp:'CT',  horas:4 },
  { etapa:'Preparação',            atividade:'Reunião de Kick Off: apresentar o programa de formação profissional',               resp:'EDU', horas:4 },
  { etapa:'Preparação',            atividade:'Análise Tarifária',                                                                resp:'CT',  horas:2 },
  { etapa:'Mapeamento energético', atividade:'Identificação da Carga Alvo.',                                                    resp:'CT',  horas:4 },
  { etapa:'Mapeamento energético', atividade:'Validação da Oportunidade',                                                       resp:'CT',  horas:8 },
  { etapa:'Mapeamento energético', atividade:'Inspeção Termográfica/Inspeção com Drone',                                        resp:'CT',  horas:8 },
  { etapa:'Mapeamento energético', atividade:'Medição Inicial da Carga Alvo',                                                   resp:'CT',  horas:8 },
  { etapa:'Mapeamento energético', atividade:'Acompanhamento Operacional',                                                      resp:'CT',  horas:8 },
  { etapa:'Mapeamento energético', atividade:'Análise de Tecnologia e Otimização',                                              resp:'CT',  horas:4 },
  { etapa:'Implementação',         atividade:'Elaboração do Plano de Implementação',                                            resp:'CT',  horas:6 },
  { etapa:'Implementação',         atividade:'Monitoramento das Ações em Implementação',                                        resp:'CT',  horas:4 },
  { etapa:'Implementação',         atividade:'Controle e Gestão da Consultoria',                                                resp:'ESP', horas:8 },
  { etapa:'Implementação',         atividade:'Medição Final das Cargas Alvo.',                                                  resp:'CT',  horas:4 },
  { etapa:'Implementação',         atividade:'Medição Final das Cargas Alvo.',                                                  resp:'CT',  horas:4 },
  { etapa:'Reunião Final',         atividade:'Análise e Validação do Relatório e Reunião de Encerramento.',                     resp:'CT',  horas:4 },
]
const ATIVIDADES_120H = [
  { etapa:'Preparação',            atividade:'Reunião de Kick Off: apresentar o programa, visita no Gemba, definir focal point', resp:'CT',  horas:4 },
  { etapa:'Preparação',            atividade:'Reunião de Kick Off: apresentar o programa de formação profissional',               resp:'EDU', horas:4 },
  { etapa:'Preparação',            atividade:'Análise Tarifária',                                                                resp:'CT',  horas:4 },
  { etapa:'Mapeamento energético', atividade:'Identificação da Carga Alvo',                                                     resp:'CT',  horas:8 },
  { etapa:'Mapeamento energético', atividade:'Validação da Oportunidade',                                                       resp:'CT',  horas:8 },
  { etapa:'Mapeamento energético', atividade:'Inspeção Termográfica/Inspeção com Drone',                                        resp:'CT',  horas:8 },
  { etapa:'Mapeamento energético', atividade:'Medição Inicial da Carga Alvo',                                                   resp:'CT',  horas:8 },
  { etapa:'Mapeamento energético', atividade:'Medição Inicial da Carga Alvo',                                                   resp:'CT',  horas:8 },
  { etapa:'Implementação',         atividade:'Acompanhamento Operacional',                                                      resp:'ESP', horas:8 },
  { etapa:'Implementação',         atividade:'Análise de Tecnologia e Otimização',                                              resp:'CT',  horas:8 },
  { etapa:'Implementação',         atividade:'Elaboração do Plano de Implementação',                                            resp:'CT',  horas:8 },
  { etapa:'Implementação',         atividade:'Monitoramento das Ações em Implementação',                                        resp:'CT',  horas:8 },
  { etapa:'Implementação',         atividade:'Monitoramento das Ações em Implementação',                                        resp:'CT',  horas:8 },
  { etapa:'Implementação',         atividade:'Controle e Gestão da Consultoria',                                                resp:'ESP', horas:4 },
  { etapa:'Implementação',         atividade:'Medição Final das Cargas Alvo.',                                                  resp:'CT',  horas:8 },
  { etapa:'Implementação',         atividade:'Medição Final das Cargas Alvo.',                                                  resp:'CT',  horas:8 },
  { etapa:'Reunião Final',         atividade:'Análise e validação do Relatório e Reunião de encerramento.',                     resp:'CT',  horas:8 },
]
const ATIVIDADES_110H = [
  ...ATIVIDADES_120H.filter((_,i) => i !== 7),
].map(a => a.atividade === 'Acompanhamento Operacional' ? { ...a, horas:4 } : a)

const REGIOES_PE = {
  rmr:      ['recife','olinda','jaboatão','jaboatao','paulista','camaragibe','são lourenço','sao lourenco','cabo de santo agostinho','cabo','ipojuca','moreno','abreu e lima','igarassu','itamaracá','itamaraca','araçoiaba','aracoiaba'],
  caruaru:  ['caruaru','garanhuns','belo jardim','arcoverde','pesqueira','bezerros','santa cruz','caetes','caetés','aguas belas','águas belas','buíque','buique','venturosa','lajedo','palmares','catende','barreiros','rio formoso','sirinhaem','sirinhaém','escada'],
  araripina:['araripina','petrolina','salgueiro','ouricuri','exu','bodoco','ipubi','trindade','cedro','serrita','verdejante','mirandiba','parnamirim','floresta','tacaratu','cabrobó','cabrobo'],
}
const ESTADOS_FORA_PE = ['bahia','ceará','ceara','paraíba','paraiba','maranhão','maranhao','tocantins','piauí','piaui','rio grande do norte','alagoas','sergipe','são paulo','sao paulo','rio de janeiro','minas gerais','goiás','goias','mato grosso','amazonas','pará','para','acre','rondônia','rondonia','amapá','amapa','roraima']

function detectarRegiao(loc) {
  if (!loc) return null
  const l = loc.toLowerCase()
  if (ESTADOS_FORA_PE.some(e => l.includes(e))) return 'fora_pe'
  for (const [r, cids] of Object.entries(REGIOES_PE)) {
    if (cids.some(c => l.includes(c))) return r
  }
  return null
}

function scoreConsultor(c, regiao, kickoffs) {
  const setor = (c.setor || '').toLowerCase()
  let score = 0
  if (regiao === 'rmr'       && setor.includes('rmr'))       score += 10
  else if (regiao === 'caruaru'   && setor.includes('caruaru'))   score += 10
  else if (regiao === 'araripina' && setor.includes('araripina')) score += 10
  else if (regiao === 'fora_pe') score += 3
  else score += 1
  const ativas = kickoffs.filter(k => k.consultor === c.nome && k.status !== 'apropriado').length
  score -= ativas * 2
  return score
}

function proximasDatasKickoff(dataAssinatura) {
  const base  = new Date(dataAssinatura + 'T00:00:00')
  const limite = new Date(base); limite.setDate(limite.getDate() + 60)
  const sugestoes = []
  for (const off of [14, 28, 42]) {
    const d = new Date(base); d.setDate(d.getDate() + off)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    if (d <= limite) sugestoes.push(d.toISOString().split('T')[0])
  }
  return sugestoes
}

function gerarSessoes(dataKickoff, dataEncerramento, configPorte, nomeConsultor, nomeEsp) {
  const inicio    = new Date(dataKickoff    + 'T00:00:00')
  const fim       = new Date(dataEncerramento + 'T00:00:00')
  const totalDias = Math.round((fim - inicio) / (1000*60*60*24))
  const ativs     = configPorte.horasTotal <= 80 ? ATIVIDADES_80H
                  : configPorte.horasTotal === 110 ? ATIVIDADES_110H
                  : ATIVIDADES_120H
  const n = ativs.length
  const sessoes = ativs.map((a, i) => {
    const progresso  = i / Math.max(n - 1, 1)
    const diasOffset = Math.round(progresso * totalDias)
    const d = new Date(inicio); d.setDate(d.getDate() + diasOffset)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    const nomeReal = a.resp === 'CT'  ? nomeConsultor
                   : a.resp === 'ESP' ? (nomeEsp || 'ESPECIALISTA OU COORDENADOR')
                   : 'EDUCAÇÃO'
    return {
      id: i, data: d.toISOString().split('T')[0],
      etapa: a.etapa, atividade: a.atividade, tipoResp: a.resp,
      responsavel: nomeReal, horas: a.horas,
      horario: a.horas <= 4 ? '08:00 as 12:00' : '08:00 as 17:00',
      formato: 'Presencial',
    }
  })
  const dataKO = sessoes[0]?.data
  sessoes.forEach(s => { if (s.tipoResp === 'EDU') s.data = dataKO })
  return sessoes
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmtData(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR', { timeZone:'UTC' }) }
function addDias(ds, n) { const d = new Date(ds+'T00:00:00'); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0] }
function isHoje(d) { if (!d) return false; const h=new Date(),dt=new Date(d+'T00:00:00'); return dt.getFullYear()===h.getFullYear()&&dt.getMonth()===h.getMonth()&&dt.getDate()===h.getDate() }
function isFuturo(d) { if (!d) return false; const h=new Date(); h.setHours(0,0,0,0); return new Date(d+'T00:00:00')>h }
function fmtMoeda(v) { if (!v&&v!==0) return '—'; return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const S = {
  wrap:        { padding:32, background:'var(--bg)', minHeight:'100vh', fontFamily:"'Plus Jakarta Sans', sans-serif" },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  title:       { fontSize:21, fontWeight:700, color:'var(--text)', letterSpacing:'-.02em' },
  sub:         { fontSize:13, color:'var(--muted)', marginTop:3 },
  abas:        { display:'flex', borderBottom:'1px solid var(--border)', marginBottom:20 },
  aba:         (on) => ({ padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer', color: on?'var(--blue)':'var(--muted)', background:'none', border:'none', borderBottom:`2px solid ${on?'var(--blue)':'transparent'}`, fontFamily:'inherit', marginBottom:-1, display:'flex', alignItems:'center', gap:6 }),
  abaCount:    (on) => ({ padding:'1px 7px', borderRadius:10, fontSize:10, fontWeight:700, background: on?'var(--blue-dim)':'var(--subtle)', color: on?'var(--blue)':'var(--text2)' }),
  abasInt:     { display:'flex', borderBottom:'1px solid var(--border)', marginBottom:20 },
  abaInt:      (on) => ({ padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', color: on?'var(--blue)':'var(--muted)', background:'none', border:'none', borderBottom:`2px solid ${on?'var(--blue)':'transparent'}`, fontFamily:'inherit', marginBottom:-1, display:'flex', alignItems:'center', gap:5 }),
  stats:       { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:22 },
  statCard:    { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', position:'relative', overflow:'hidden', boxShadow:'0 1px 4px var(--shadow)' },
  statBar:     (c) => ({ position:'absolute', bottom:0, left:0, right:0, height:2, background:c, opacity:.5 }),
  statVal:     (c) => ({ fontFamily:"'JetBrains Mono', monospace", fontSize:26, fontWeight:500, color:c, lineHeight:1, marginBottom:5 }),
  statLbl:     { fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:500 },
  alerta:      { background:'linear-gradient(135deg,rgba(245,158,11,.08),rgba(239,68,68,.04))', border:'1px solid rgba(245,158,11,.25)', borderRadius:10, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'flex-start', gap:12 },
  alertaIcon:  { width:36, height:36, borderRadius:9, background:'rgba(245,158,11,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  alertaRadar: { background:'linear-gradient(135deg,rgba(99,102,241,.07),rgba(165,180,252,.04))', border:'1px solid rgba(99,102,241,.2)', borderRadius:10, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'flex-start', gap:12 },
  toolbar:     { display:'flex', gap:8, marginBottom:8, alignItems:'center', flexWrap:'wrap' },
  toolbar2:    { display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' },
  search:      { background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, padding:'8px 12px', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit', width:220 },
  filtro:      (on) => ({ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${on?'rgba(99,102,241,.25)':'var(--border2)'}`, background: on?'var(--blue-dim)':'var(--subtle)', color: on?'var(--blue)':'var(--text2)', fontFamily:'inherit' }),
  fselSm:      { background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:6, padding:'5px 10px', color:'var(--text2)', fontSize:12, outline:'none', fontFamily:'inherit', cursor:'pointer', height:30 },
  inputSm:     { background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:6, padding:'5px 10px', color:'var(--text2)', fontSize:12, outline:'none', fontFamily:'inherit', height:30, width:130 },
  btn:         { background:'var(--blue)', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 },
  btnSm:       { background:'var(--subtle)', color:'var(--text2)', border:'1px solid var(--border2)', borderRadius:6, padding:'4px 9px', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit' },
  btnApropriar:{ background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(16,185,129,.2)', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 },
  btnDanger:   { background:'var(--red-dim)', color:'var(--red)', border:'1px solid transparent', borderRadius:6, padding:'4px 8px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  btnLimpar:   { background:'none', border:'none', color:'var(--muted)', fontSize:11, cursor:'pointer', fontFamily:'inherit', textDecoration:'underline', padding:'0 4px' },
  btnGreen:    { background:'var(--green-dim)', color:'var(--green)', border:'1px solid rgba(16,185,129,.2)', borderRadius:8, padding:'9px 18px', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 },
  btnNF:       { background:'var(--purple-dim)', color:'var(--purple)', border:'1px solid rgba(124,58,237,.2)', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 },
  tableWrap:   { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px var(--shadow)' },
  table:       { width:'100%', borderCollapse:'collapse' },
  th:          { textAlign:'left', padding:'10px 14px', fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', borderBottom:'1px solid var(--border)', background:'var(--surface2)', whiteSpace:'nowrap' },
  td:          { padding:'11px 14px', fontSize:13, color:'var(--text2)', borderBottom:'1px solid var(--border)' },
  modal:       { position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(4px)' },
  modalBox:    { background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:12, padding:28, width:'90%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 32px var(--shadow)' },
  modalTitle:  { fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:18 },
  field:       { display:'flex', flexDirection:'column', gap:5, marginBottom:14 },
  fieldRow:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 },
  label:       { fontSize:12, fontWeight:500, color:'var(--text2)' },
  input:       { background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, padding:'9px 12px', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit', width:'100%' },
  fsel:        { background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, padding:'9px 12px', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit', width:'100%', cursor:'pointer' },
  row:         { display:'flex', gap:8, justifyContent:'flex-end', marginTop:18 },
  erro:        { background:'var(--red-dim)', border:'1px solid rgba(239,68,68,.25)', borderRadius:6, padding:'8px 12px', color:'var(--red)', fontSize:12, marginBottom:10 },
  hintBox:     { background:'var(--blue-dim)', border:'1px solid rgba(99,102,241,.2)', borderRadius:7, padding:'8px 14px', marginBottom:14, fontSize:12, color:'var(--blue)', display:'flex', justifyContent:'space-between', alignItems:'center' },
  infoBox:     { background:'var(--blue-dim)', border:'1px solid rgba(99,102,241,.15)', borderRadius:7, padding:'10px 14px', marginBottom:14, fontSize:12, color:'var(--blue)' },
  infoGreen:   { background:'var(--green-dim)', border:'1px solid rgba(16,185,129,.2)', borderRadius:7, padding:'10px 14px', marginBottom:14, fontSize:12, color:'var(--green)' },
  sectionLbl:  { fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10, marginTop:4, paddingBottom:6, borderBottom:'1px solid var(--border)' },
  geradorLayout:{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'start' },
  card:        { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:22, boxShadow:'0 1px 4px var(--shadow)' },
  cardTitle:   { fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:16, display:'flex', alignItems:'center', gap:8 },
  regrasBox:   { background:'rgba(245,158,11,.05)', border:'1px solid rgba(245,158,11,.15)', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'var(--text2)', lineHeight:1.6 },
  dataChip:    (sel) => ({ padding:'7px 14px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', border:`1px solid ${sel?'rgba(99,102,241,.4)':'var(--border2)'}`, background: sel?'var(--blue-dim)':'var(--subtle)', color: sel?'var(--blue)':'var(--text2)', fontFamily:'inherit', marginRight:8, marginBottom:8 }),
  sessaoRow:   { display:'grid', gridTemplateColumns:'130px 1fr 180px 60px', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)', alignItems:'start' },
  chipReg:     (match) => ({ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background: match?'var(--green-dim)':'var(--subtle)', color: match?'var(--green)':'var(--muted)', border:`1px solid ${match?'rgba(16,185,129,.2)':'var(--border2)'}`, marginRight:4 }),
  feriadoWarn: { fontSize:10, color:'var(--amber)', background:'var(--amber-dim)', padding:'2px 6px', borderRadius:4, marginTop:3, display:'inline-flex', alignItems:'center', gap:3 },
  divLabel:    { fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8, marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' },
  avisoFora:   { fontSize:11, color:'var(--amber)', background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,.2)', borderRadius:6, padding:'6px 10px', marginBottom:10 },
}
const BP_FORM_VAZIO       = { id_sgt:'', empresa:'', consultor:'', data_kickoff:'', horas_kickoff:'4', porte:'Médio', status:'aguardando_cronograma', status_atendimento:'nao_iniciado' }
const OUTRAS_FORM_VAZIO   = { id_sgt:'', numero_proposta:'', empresa:'', consultor:'', horas_total:'', receita:'', status:'em_execucao', motivo_pendencia:'', observacoes:'', data_conclusao:'' }
const SOLICITAR_NF_VAZIO  = { numero_parcelas:1, valor_parcela:'', observacoes:'' }
const GERADOR_VAZIO       = { kickoffId:'', empresa:'', id_sgt:'', porteConfig:'Médio — 120h', localidade:'', dataAssinatura:'', dataKickoff:'', dataEncerramento:'', consultorSelecionado:'', espSelecionado:'' }

// ── COMPONENTE ────────────────────────────────────────────────────────────────
export default function Consultoria({ isAdmin = false, isEspecialista = false }) {
  const podeEditar = isAdmin || isEspecialista

  // Abas principais
  const [aba, setAba]         = useState('bp')
  // Sub-aba B+P
  const [abaInt, setAbaInt]   = useState('kickoffs')

  // Dados
  const [kickoffs, setKickoffs]     = useState([])
  const [sebraetec, setSebraetec]   = useState([])
  const [diretas, setDiretas]       = useState([])
  const [consultores, setConsultores] = useState([])
  const [especialista, setEspecialista] = useState('')
  const [espOptions, setEspOptions] = useState([])
  const [loading, setLoading]       = useState(true)

  // Filtros B+P
  const [busca, setBusca]             = useState('')
  const [filtro, setFiltro]           = useState('')
  const [filtroConsultor, setFiltroConsultor] = useState('')
  const [filtroDataDe, setFiltroDataDe]       = useState('')
  const [filtroDataAte, setFiltroDataAte]     = useState('')

  // Filtros Sebraetec / Diretas
  const [buscaS, setBuscaS]       = useState('')
  const [filtroS, setFiltroS]     = useState('')
  const [buscaD, setBuscaD]       = useState('')
  const [filtroD, setFiltroD]     = useState('')

  // Modais
  const [modalBP, setModalBP]       = useState(false)
  const [editandoBP, setEditandoBP] = useState(null)
  const [formBP, setFormBP]         = useState(BP_FORM_VAZIO)
  const [modalS, setModalS]         = useState(false)
  const [editandoS, setEditandoS]   = useState(null)
  const [formS, setFormS]           = useState(OUTRAS_FORM_VAZIO)
  const [modalD, setModalD]         = useState(false)
  const [editandoD, setEditandoD]   = useState(null)
  const [formD, setFormD]           = useState(OUTRAS_FORM_VAZIO)
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState('')

  // Modal solicitar NF
  const [modalSolNF, setModalSolNF]     = useState(false)
  const [diretaSel, setDiretaSel]       = useState(null)
  const [formNF, setFormNF]             = useState(SOLICITAR_NF_VAZIO)
  const [salvandoNF, setSalvandoNF]     = useState(false)

  // Férias dos consultores
  const [feriasPorConsultor, setFeriasPorConsultor] = useState({})

  // Feriados — cache por ano, buscados da BrasilAPI com fallback para lista fixa
  const [feriadosCache, setFeriadosCache] = useState({})

  async function buscarFeriados(ano) {
    if (feriadosCache[ano]) return feriadosCache[ano]
    try {
      const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`)
      if (!res.ok) throw new Error('API indisponível')
      const data = await res.json()
      const datas = data.map(f => f.date)
      setFeriadosCache(prev => ({ ...prev, [ano]: datas }))
      return datas
    } catch {
      // fallback lista fixa
      const fixos = FERIADOS_NACIONAIS.filter(d => d.startsWith(String(ano)))
      setFeriadosCache(prev => ({ ...prev, [ano]: fixos }))
      return fixos
    }
  }

  function isConsultorEmFerias(dateStr, nomeConsultor) {
    if (!dateStr || !nomeConsultor) return false
    // Encontrar o colaborador pelo nome
    const consultor = [...consultores, ...espOptions].find(c => c.nome === nomeConsultor)
    if (!consultor) return false
    const ferias = feriasPorConsultor[consultor.id] || []
    const data = new Date(dateStr + 'T00:00:00')
    return ferias.some(f => {
      const ini = new Date(f.data_inicio + 'T00:00:00')
      const fim = new Date(f.data_fim + 'T00:00:00')
      return data >= ini && data <= fim
    })
  }

  function isFeriadoCached(dateStr) {
    const ano = dateStr.slice(0, 4)
    const lista = feriadosCache[ano]
    if (!lista) return false
    return lista.includes(dateStr)
  }

  async function carregarFeriadosParaSessoes(sessoesList) {
    const anos = [...new Set(sessoesList.map(s => s.data.slice(0,4)))]
    await Promise.all(anos.map(a => buscarFeriados(a)))
  }

  // Gerador
  const [gen, setGen]                   = useState(GERADOR_VAZIO)
  const [sugestoesData, setSugestoesData] = useState([])
  const [rankingConsultores, setRankingConsultores] = useState([])
  const [sessoes, setSessoes]           = useState([])
  const [gerandoXlsx, setGerandoXlsx]   = useState(false)
  const [erroGen, setErroGen]           = useState('')
  const [salvandoCron, setSalvandoCron] = useState(false)

  useEffect(() => {
    fetch('https://cronograma-api-3id0.onrender.com/').catch(() => {})
    carregar()
  }, [])

  async function carregar() {
    setLoading(true)
    const [kRes, sRes, dRes, cRes, fRes] = await Promise.all([
      supabase.from('kickoffs').select('*').order('data_kickoff', { ascending:false, nullsFirst:true }),
      supabase.from('sebraetec').select('*').order('created_at', { ascending:false }),
      supabase.from('diretas').select('*').order('created_at', { ascending:false }),
      supabase.from('colaboradores').select('id,nome,cargo,setor').eq('ativo',true).order('nome'),
      supabase.from('colaborador_ferias').select('*').order('data_inicio'),
    ])
    setKickoffs(kRes.data || [])
    setSebraetec(sRes.data || [])
    setDiretas(dRes.data || [])
    const colab = cRes.data || []
    setConsultores(colab.filter(c => CARGOS_CONSULTOR.includes((c.cargo||'').toLowerCase().trim())))
    const esp = colab.find(c => (c.cargo||'').toLowerCase().trim() === CARGO_ESPECIALISTA)
    setEspecialista(esp?.nome || '')
    setEspOptions(colab.filter(c => { const cg=(c.cargo||'').toLowerCase().trim(); return cg===CARGO_ESPECIALISTA||cg===CARGO_COORDENADOR }))
    // Agrupar férias por colaborador_id
    const fMap = {}
    for (const f of (fRes.data || [])) {
      if (!fMap[f.colaborador_id]) fMap[f.colaborador_id] = []
      fMap[f.colaborador_id].push(f)
    }
    setFeriasPorConsultor(fMap)
    setLoading(false)
  }

  // ── B+P CRUD ──────────────────────────────────────────────────────────────
  function abrirNovoBP() {
    setEditandoBP(null); setErro('')
    setFormBP(BP_FORM_VAZIO); setModalBP(true)
  }
  function abrirEditarBP(r) {
    setEditandoBP(r); setErro('')
    setFormBP({ id_sgt:r.id_sgt, empresa:r.empresa, consultor:r.consultor||'', data_kickoff:r.data_kickoff||'', horas_kickoff:r.horas_kickoff||'4', porte:r.porte||'Médio', status:r.status, status_atendimento:r.status_atendimento||'nao_iniciado' })
    setModalBP(true)
  }
  // Auto status atendimento baseado no status KO
  function setStatusKO(s) {
    const atMap = { aguardando_cronograma:'nao_iniciado', pendente:'em_execucao', apropriado:'em_execucao' }
    setFormBP(f => ({ ...f, status:s, status_atendimento: atMap[s] || f.status_atendimento }))
  }

  async function salvarBP() {
    if (!formBP.id_sgt.trim() || !formBP.empresa.trim()) { setErro('ID SGT e Empresa são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const dados = {
      id_sgt: formBP.id_sgt.trim(), empresa: formBP.empresa.trim(),
      consultor: formBP.consultor||null, data_kickoff: formBP.data_kickoff||null,
      horas_kickoff: parseFloat(formBP.horas_kickoff)||null,
      horas: parseFloat(formBP.horas_kickoff)||null,
      porte: formBP.porte, status: formBP.status,
      status_atendimento: formBP.status_atendimento,
    }
    let error
    if (editandoBP) { ({ error } = await supabase.from('kickoffs').update(dados).eq('id',editandoBP.id)) }
    else            { ({ error } = await supabase.from('kickoffs').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: '+error.message); return }
    setModalBP(false); carregar()
  }

  async function apropriarKO(r) {
    await supabase.from('kickoffs').update({ status:'apropriado', status_atendimento:'em_execucao' }).eq('id',r.id)
    carregar()
  }
  async function excluirBP(id) {
    if (!confirm('Excluir este registro B+P?')) return
    await supabase.from('kickoff_sessoes').delete().eq('kickoff_id',id)
    await supabase.from('kickoffs').delete().eq('id',id)
    carregar()
  }

  // ── SEBRAETEC CRUD ────────────────────────────────────────────────────────
  function abrirNovoS() { setEditandoS(null); setErro(''); setFormS(OUTRAS_FORM_VAZIO); setModalS(true) }
  function abrirEditarS(r) {
    setEditandoS(r); setErro('')
    setFormS({ id_sgt:r.id_sgt, numero_proposta:r.numero_proposta||'', empresa:r.empresa, consultor:r.consultor||'', horas_total:r.horas_total||'', receita:r.receita||'', status:r.status, motivo_pendencia:r.motivo_pendencia||'', observacoes:r.observacoes||'', data_conclusao:r.data_conclusao||'' })
    setModalS(true)
  }
  async function salvarS() {
    if (!formS.id_sgt.trim()||!formS.empresa.trim()) { setErro('ID SGT e Empresa são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const dados = { id_sgt:formS.id_sgt.trim(), numero_proposta:formS.numero_proposta.trim()||null, empresa:formS.empresa.trim(), consultor:formS.consultor||null, horas_total:parseFloat(formS.horas_total)||null, receita:parseFloat(formS.receita)||null, status:formS.status, motivo_pendencia: formS.status==='aguardando'?(formS.motivo_pendencia||null):null, observacoes: formS.status==='aguardando'?(formS.observacoes||null):null, data_conclusao: formS.status==='concluido'?(formS.data_conclusao||null):null }
    let error
    if (editandoS) { ({ error } = await supabase.from('sebraetec').update(dados).eq('id',editandoS.id)) }
    else           { ({ error } = await supabase.from('sebraetec').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: '+error.message); return }
    setModalS(false); carregar()
  }
  async function excluirS(id) { if (!confirm('Excluir?')) return; await supabase.from('sebraetec').delete().eq('id',id); carregar() }

  // ── DIRETAS CRUD ──────────────────────────────────────────────────────────
  function abrirNovoD() { setEditandoD(null); setErro(''); setFormD(OUTRAS_FORM_VAZIO); setModalD(true) }
  function abrirEditarD(r) {
    setEditandoD(r); setErro('')
    setFormD({ id_sgt:r.id_sgt, numero_proposta:r.numero_proposta||'', empresa:r.empresa, consultor:r.consultor||'', horas_total:r.horas_total||'', receita:r.receita||'', status:r.status, motivo_pendencia:r.motivo_pendencia||'', observacoes:r.observacoes||'', data_conclusao:r.data_conclusao||'' })
    setModalD(true)
  }
  async function salvarD() {
    if (!formD.id_sgt.trim()||!formD.empresa.trim()) { setErro('ID SGT e Empresa são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const dados = { id_sgt:formD.id_sgt.trim(), numero_proposta:formD.numero_proposta.trim()||null, empresa:formD.empresa.trim(), consultor:formD.consultor||null, horas_total:parseFloat(formD.horas_total)||null, receita:parseFloat(formD.receita)||null, status:formD.status, motivo_pendencia: formD.status==='aguardando'?(formD.motivo_pendencia||null):null, observacoes: formD.status==='aguardando'?(formD.observacoes||null):null, data_conclusao: formD.status==='concluido'?(formD.data_conclusao||null):null, status_nf: editandoD?.status_nf||'pendente' }
    let error
    if (editandoD) { ({ error } = await supabase.from('diretas').update(dados).eq('id',editandoD.id)) }
    else           { ({ error } = await supabase.from('diretas').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: '+error.message); return }
    setModalD(false); carregar()
  }
  async function excluirD(id) { if (!confirm('Excluir?')) return; await supabase.from('diretas').delete().eq('id',id); carregar() }
  function abrirSolicitarNF(r) {
    setDiretaSel(r)
    const receita = parseFloat(r.receita) || 0
    setFormNF({ numero_parcelas:1, valor_parcela: receita.toFixed(2), observacoes:'' })
    setModalSolNF(true)
  }

  async function salvarSolicitacaoNF() {
    if (!diretaSel) return
    setSalvandoNF(true)
    const parcelas = parseInt(formNF.numero_parcelas) || 1
    const valorParcela = parseFloat(formNF.valor_parcela) || 0
    const dados = {
      id_sgt:               diretaSel.id_sgt,
      numero_proposta:      diretaSel.numero_proposta || null,
      empresa:              diretaSel.empresa,
      consultor:            diretaSel.consultor || null,
      status_sgt:           'Concluído',
      data_conclusao_sgt:   diretaSel.data_conclusao || null,
      numero_parcelas:      parcelas,
      valor_parcela:        valorParcela,
      valor_total:          valorParcela * parcelas,
      nf_boleto_enviado:    false,
      observacoes:          formNF.observacoes || null,
      origem:               'consultoria',
      direta_id:            diretaSel.id,
    }
    const { error } = await supabase.from('emissoes_nf').insert(dados)
    if (error) { alert('Erro ao criar NF: ' + error.message); setSalvandoNF(false); return }
    await supabase.from('diretas').update({ status_nf:'solicitada' }).eq('id', diretaSel.id)
    setSalvandoNF(false)
    setModalSolNF(false)
    setDiretaSel(null)
    carregar()
  }

  // ── FILTROS ───────────────────────────────────────────────────────────────
  const hoje        = kickoffs.filter(k => isHoje(k.data_kickoff) && k.status === 'pendente')
  const totalHoje   = hoje.reduce((a,k) => a+(parseFloat(k.horas_kickoff||k.horas)||0), 0)
  const semCron     = kickoffs.filter(k => k.status === 'aguardando_cronograma')
  const proximos    = kickoffs.filter(k => isFuturo(k.data_kickoff) && !isHoje(k.data_kickoff))
  const temFiltroAtivo = filtroConsultor||filtroDataDe||filtroDataAte

  const filtradosBP = kickoffs.filter(r => {
    if (filtro === 'hoje'                  && !isHoje(r.data_kickoff))       return false
    if (filtro === 'pendente'              && r.status !== 'pendente')       return false
    if (filtro === 'apropriado'            && r.status !== 'apropriado')     return false
    if (filtro === 'proximos'              && !isFuturo(r.data_kickoff))     return false
    if (filtro === 'aguardando_cronograma' && r.status !== 'aguardando_cronograma') return false
    if (filtro === 'em_execucao'           && r.status_atendimento !== 'em_execucao')  return false
    if (filtro === 'concluido'             && r.status_atendimento !== 'concluido')    return false
    if (filtroConsultor && r.consultor !== filtroConsultor) return false
    if (filtroDataDe && r.data_kickoff && r.data_kickoff < filtroDataDe) return false
    if (filtroDataAte && r.data_kickoff && r.data_kickoff > filtroDataAte) return false
    if (busca) { const b=busca.toLowerCase(); return r.id_sgt?.toLowerCase().includes(b)||r.empresa?.toLowerCase().includes(b)||r.consultor?.toLowerCase().includes(b) }
    return true
  })

  const filtradosS = sebraetec.filter(r => {
    if (filtroS && r.status !== filtroS) return false
    if (buscaS) { const b=buscaS.toLowerCase(); return r.id_sgt?.toLowerCase().includes(b)||r.empresa?.toLowerCase().includes(b)||r.consultor?.toLowerCase().includes(b)||r.numero_proposta?.toLowerCase().includes(b) }
    return true
  })
  const filtradosD = diretas.filter(r => {
    if (filtroD && r.status !== filtroD) return false
    if (buscaD) { const b=buscaD.toLowerCase(); return r.id_sgt?.toLowerCase().includes(b)||r.empresa?.toLowerCase().includes(b)||r.consultor?.toLowerCase().includes(b)||r.numero_proposta?.toLowerCase().includes(b) }
    return true
  })

  function limparFiltros() { setFiltroConsultor(''); setFiltroDataDe(''); setFiltroDataAte(''); setBusca(''); setFiltro('') }

  // ── GERADOR ───────────────────────────────────────────────────────────────
  function selecionarEmpresa(kickoffId) {
    const k = kickoffs.find(x => x.id === kickoffId)
    if (!k) { setGen(GERADOR_VAZIO); return }
    const portePadrao = k.porte === 'Médio' ? 'Médio — 120h' : 'Micro/Pequeno — 80h'
    setGen({ ...GERADOR_VAZIO, kickoffId, empresa:k.empresa, id_sgt:k.id_sgt, porteConfig:portePadrao, localidade:k.localidade_empresa||'', espSelecionado:especialista||'' })
    setSessoes([]); setSugestoesData([]); setRankingConsultores([]); setErroGen('')
    if (k.localidade_empresa) calcRanking(k.localidade_empresa)
  }

  function calcRanking(localidade) {
    const regiao  = detectarRegiao(localidade)
    const ranking = [...consultores].map(c => ({ ...c, score:scoreConsultor(c, regiao, kickoffs), regiao })).sort((a,b) => b.score - a.score)
    setRankingConsultores(ranking)
    return ranking
  }

  function aoMudarLocalidade(loc) {
    setGen(g => ({ ...g, localidade:loc }))
    const ranking = calcRanking(loc)
    if (ranking.length > 0) setGen(g => ({ ...g, localidade:loc, consultorSelecionado:ranking[0].nome }))
  }

  function aoMudarAssinatura(ds) {
    setGen(g => ({ ...g, dataAssinatura:ds }))
    if (!ds) return
    const config = CONFIG_PORTE[gen.porteConfig]
    const datas  = proximasDatasKickoff(ds)
    setSugestoesData(datas)
    if (datas.length > 0) {
      const enc = addDias(datas[0], config?.duracaoMin||75)
      setGen(g => ({ ...g, dataAssinatura:ds, dataKickoff:datas[0], dataEncerramento:enc }))
    }
  }

  function aoMudarDataKickoff(data) {
    const config = CONFIG_PORTE[gen.porteConfig]
    const enc    = addDias(data, config?.duracaoMin||75)
    setGen(g => ({ ...g, dataKickoff:data, dataEncerramento:enc }))
  }

  async function gerarCronograma() {
    setErroGen('')
    if (!gen.empresa)             { setErroGen('Selecione uma empresa.'); return }
    if (!gen.dataKickoff)         { setErroGen('Informe a data do Kick Off.'); return }
    if (!gen.dataEncerramento)    { setErroGen('Informe a data de encerramento.'); return }
    if (!gen.consultorSelecionado){ setErroGen('Selecione um consultor.'); return }
    const config = CONFIG_PORTE[gen.porteConfig]
    const novasSessoes = gerarSessoes(gen.dataKickoff, gen.dataEncerramento, config, gen.consultorSelecionado, gen.espSelecionado)
    await carregarFeriadosParaSessoes(novasSessoes)
    setSessoes(novasSessoes)
  }

  function editarSessao(id, campo, valor) {
    setSessoes(ss => ss.map(s => s.id === id ? { ...s, [campo]:valor } : s))
  }

  async function salvarCronograma() {
    if (sessoes.length === 0 || !gen.kickoffId) return
    setSalvandoCron(true)
    const { error:errK } = await supabase.from('kickoffs').update({
      consultor: gen.consultorSelecionado,
      data_kickoff: gen.dataKickoff,
      data_encerramento: gen.dataEncerramento,
      localidade_empresa: gen.localidade,
      horas: sessoes.filter(s => s.tipoResp === 'CT').reduce((a,s) => a+s.horas, 0),
      status: 'pendente',
      status_atendimento: 'em_execucao',
    }).eq('id', gen.kickoffId)
    if (errK) { setErroGen('Erro: '+errK.message); setSalvandoCron(false); return }
    await supabase.from('kickoff_sessoes').delete().eq('kickoff_id', gen.kickoffId)
    const { error:errS } = await supabase.from('kickoff_sessoes').insert(
      sessoes.map(s => ({ kickoff_id:gen.kickoffId, data:s.data, atividade:s.atividade, responsavel:s.responsavel, horas:s.horas, horario:s.horario, formato:s.formato }))
    )
    setSalvandoCron(false)
    if (errS) { setErroGen('Erro ao salvar sessões: '+errS.message); return }
    carregar()
    setGen(GERADOR_VAZIO); setSessoes([]); setSugestoesData([]); setRankingConsultores([])
    alert('Cronograma salvo!')
  }

  async function exportarXlsx() {
    if (sessoes.length === 0) return
    setGerandoXlsx(true); setErroGen('')
    try {
      const config  = CONFIG_PORTE[gen.porteConfig]
      const payload = { empresa:gen.empresa, consultor:gen.consultorSelecionado, especialista:gen.espSelecionado||especialista||'ESPECIALISTA OU COORDENADOR', horasTotal:config.horasTotal, dataEncerramento:gen.dataEncerramento, sessoes:sessoes.map(s => ({ data:s.data, etapa:s.etapa, tipoResp:s.tipoResp, responsavel:s.responsavel, atividade:s.atividade, horario:s.horario, horas:s.horas, formato:s.formato||'Presencial' })) }
      const apiUrl  = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cronograma-api-3id0.onrender.com/gerar'
      const res = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error||`Erro HTTP ${res.status}`) }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href=url; a.download=`Cronograma_${String(gen.empresa).replace(/\s+/g,'_')}_${config.label}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { setErroGen('Erro ao exportar: '+e.message) }
    setGerandoXlsx(false)
  }

  const trHover = { onMouseEnter:e=>e.currentTarget.style.background='var(--subtle)', onMouseLeave:e=>e.currentTarget.style.background='transparent' }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Consultoria</div>
          <div style={S.sub}>Gestão de atendimentos B+P, Sebraetec e Diretas</div>
        </div>
        {podeEditar && (
          <button style={S.btn} onClick={() => { if(aba==='bp') abrirNovoBP(); else if(aba==='sebraetec') abrirNovoS(); else abrirNovoD() }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {aba==='bp' ? 'Novo B+P' : aba==='sebraetec' ? 'Novo Sebraetec' : 'Nova Direta'}
          </button>
        )}
      </div>

      {/* STATS GLOBAIS */}
      <div style={S.stats}>
        {[
          ['var(--blue)',   kickoffs.length,                                    'B+P'],
          ['var(--amber)',  semCron.length,                                     'Ag. Cronograma'],
          ['var(--green)',  sebraetec.length,                                   'Sebraetec'],
          ['var(--purple)', diretas.length,                                     'Diretas'],
          ['var(--purple)', diretas.filter(d=>d.status_nf==='pendente'&&d.status==='concluido').length, 'NF Pendente'],
        ].map(([cor,val,lbl]) => (
          <div key={lbl} style={S.statCard}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

      {/* ABAS PRINCIPAIS */}
      <div style={S.abas}>
        <button style={S.aba(aba==='bp')} onClick={()=>setAba('bp')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          B+P <span style={S.abaCount(aba==='bp')}>{kickoffs.length}</span>
        </button>
        <button style={S.aba(aba==='sebraetec')} onClick={()=>setAba('sebraetec')}>
          Sebraetec <span style={S.abaCount(aba==='sebraetec')}>{sebraetec.length}</span>
        </button>
        <button style={S.aba(aba==='diretas')} onClick={()=>setAba('diretas')}>
          Diretas <span style={S.abaCount(aba==='diretas')}>{diretas.length}</span>
        </button>
      </div>

      {/* ══════════ ABA B+P ══════════ */}
      {aba === 'bp' && (<>
        {/* Alertas */}
        {hoje.length > 0 && (
          <div style={S.alerta}>
            <div style={S.alertaIcon}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--amber)',marginBottom:3}}>{hoje.length} kick off{hoje.length>1?'s':''} hoje — apropriar {totalHoje}h</div>
              <div style={{fontSize:12,color:'var(--muted)',marginBottom:8}}>Não esqueça de registrar as horas</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {hoje.map(k=><span key={k.id} style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.2)',borderRadius:6,padding:'4px 10px',fontSize:12,color:'var(--amber)',fontWeight:500}}>{k.empresa}{k.consultor?` · ${k.consultor}`:''} · {k.horas_kickoff||k.horas||0}h KO</span>)}
              </div>
            </div>
          </div>
        )}
        {semCron.length > 0 && (
          <div style={S.alertaRadar}>
            <div style={{width:36,height:36,borderRadius:9,background:'rgba(59,130,246,.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--blue)',marginBottom:3}}>{semCron.length} empresa{semCron.length>1?'s':''} aguardando cronograma</div>
              <div style={{fontSize:12,color:'var(--muted)',marginBottom:8}}>Ainda sem data de kick off definida</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {semCron.map(k=><span key={k.id} style={{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',borderRadius:6,padding:'4px 10px',fontSize:12,color:'var(--blue)',fontWeight:500}}>{k.empresa} · {k.id_sgt}</span>)}
              </div>
            </div>
          </div>
        )}

        {/* Sub-abas */}
        <div style={S.abasInt}>
          <button style={S.abaInt(abaInt==='kickoffs')} onClick={()=>setAbaInt('kickoffs')}>Kick Offs</button>
          <button style={S.abaInt(abaInt==='gerador')} onClick={()=>setAbaInt('gerador')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Gerador de Cronograma
          </button>
        </div>

        {/* ── KICK OFFS ── */}
        {abaInt === 'kickoffs' && (<>
          <div style={S.toolbar}>
            <input style={S.search} placeholder="Buscar empresa, ID SGT, consultor..." value={busca} onChange={e=>setBusca(e.target.value)} />
            <button style={S.filtro(!filtro)} onClick={()=>setFiltro('')}>Todos</button>
            <button style={S.filtro(filtro==='aguardando_cronograma')} onClick={()=>setFiltro('aguardando_cronograma')}>Ag. Cronograma</button>
            <button style={S.filtro(filtro==='hoje')} onClick={()=>setFiltro('hoje')}>Hoje</button>
            <button style={S.filtro(filtro==='proximos')} onClick={()=>setFiltro('proximos')}>Próximos</button>
            <button style={S.filtro(filtro==='pendente')} onClick={()=>setFiltro('pendente')}>KO Pendente</button>
            <button style={S.filtro(filtro==='apropriado')} onClick={()=>setFiltro('apropriado')}>KO Apropriado</button>
            <button style={S.filtro(filtro==='em_execucao')} onClick={()=>setFiltro('em_execucao')}>Em Execução</button>
            <button style={S.filtro(filtro==='concluido')} onClick={()=>setFiltro('concluido')}>Concluído</button>
          </div>
          <div style={S.toolbar2}>
            <span style={{fontSize:11,color:'var(--muted)',fontWeight:500}}>Filtrar por:</span>
            <select style={S.fselSm} value={filtroConsultor} onChange={e=>setFiltroConsultor(e.target.value)}>
              <option value="">Consultor — todos</option>
              {consultores.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
            <input type="date" style={S.inputSm} value={filtroDataDe} onChange={e=>setFiltroDataDe(e.target.value)} />
            <span style={{fontSize:11,color:'var(--muted)'}}>até</span>
            <input type="date" style={S.inputSm} value={filtroDataAte} onChange={e=>setFiltroDataAte(e.target.value)} />
            {temFiltroAtivo && <button style={S.btnLimpar} onClick={limparFiltros}>limpar filtros</button>}
          </div>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>ID SGT</th>
                <th style={S.th}>Empresa</th>
                <th style={S.th}>Consultor</th>
                <th style={S.th}>Data KO</th>
                <th style={S.th}>Horas KO</th>
                <th style={S.th}>Porte</th>
                <th style={S.th}>Status Kick Off</th>
                <th style={S.th}>Status Atendimento</th>
                <th style={S.th}></th>
              </tr></thead>
              <tbody>
                {filtradosBP.map(r => {
                  const hj      = isHoje(r.data_kickoff)
                  const semData = r.status === 'aguardando_cronograma'
                  const corKO   = STATUS_KO_COR[r.status] || 'var(--muted)'
                  const corAT   = STATUS_AT_COR[r.status_atendimento] || 'var(--muted)'
                  const porteCor = PORTE_COR[r.porte] || 'var(--muted)'
                  return (
                    <tr key={r.id} {...trHover} style={{background: hj?'rgba(245,158,11,.03)':semData?'rgba(59,130,246,.02)':undefined}}>
                      <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace",color:'var(--blue)',fontWeight:500}}>{r.id_sgt}</td>
                      <td style={{...S.td,color:'var(--text)',fontWeight:500}}>{r.empresa}</td>
                      <td style={S.td}>{r.consultor||<span style={{color:'var(--border2)'}}>—</span>}</td>
                      <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace",fontSize:12}}>
                        {hj ? <span style={{color:'var(--amber)',fontWeight:700}}>Hoje</span>
                            : semData ? <span style={{color:'var(--blue)',fontSize:11,fontStyle:'italic'}}>A definir</span>
                            : fmtData(r.data_kickoff)}
                      </td>
                      <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace",color:'var(--amber)',fontWeight:600}}>
                        {r.horas_kickoff ? `${r.horas_kickoff}h` : r.horas ? `${r.horas}h` : '—'}
                      </td>
                      <td style={S.td}><span style={{background:`${porteCor}18`,color:porteCor,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>{r.porte||'—'}</span></td>
                      <td style={S.td}><span style={{background:`${corKO}18`,color:corKO,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>● {STATUS_KO_LABEL[r.status]||r.status}</span></td>
                      <td style={S.td}><span style={{background:`${corAT}18`,color:corAT,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>● {STATUS_AT_LABEL[r.status_atendimento]||r.status_atendimento||'—'}</span></td>
                      <td style={S.td}>
                        <div style={{display:'flex',gap:4}}>
                          {r.status === 'pendente' && (
                            <button style={S.btnApropriar} onClick={()=>apropriarKO(r)}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              Apropriar KO
                            </button>
                          )}
                          {r.status === 'aguardando_cronograma' && (
                            <button style={{...S.btnSm,color:'var(--blue)',borderColor:'rgba(59,130,246,.3)'}} onClick={()=>{selecionarEmpresa(r.id);setAbaInt('gerador')}}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight:3}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                              Gerar
                            </button>
                          )}
                          {podeEditar && <button style={S.btnSm} onClick={()=>abrirEditarBP(r)}>Editar</button>}
                          {isAdmin    && <button style={S.btnDanger} onClick={()=>excluirBP(r.id)}>✕</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtradosBP.length === 0 && (
                  <tr><td colSpan={9} style={{...S.td,textAlign:'center',padding:40,color:'var(--muted)'}}>{loading?'Carregando...':'Nenhum registro encontrado.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ── GERADOR ── */}
        {abaInt === 'gerador' && (
          <div style={S.geradorLayout}>
            {/* Coluna esquerda */}
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  Empresa
                </div>
                <div style={S.field}>
                  <label style={S.label}>Selecionar empresa (Ag. Cronograma)</label>
                  <select style={S.fsel} value={gen.kickoffId} onChange={e=>selecionarEmpresa(e.target.value)}>
                    <option value="">Selecione...</option>
                    {kickoffs.filter(k=>k.status==='aguardando_cronograma').map(k=><option key={k.id} value={k.id}>{k.empresa} — {k.id_sgt}</option>)}
                  </select>
                  {kickoffs.filter(k=>k.status==='aguardando_cronograma').length===0 && <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>Nenhuma empresa aguardando cronograma.</div>}
                </div>
                {gen.empresa && (<>
                  <div style={S.field}>
                    <label style={S.label}>Configuração de horas</label>
                    <select style={S.fsel} value={gen.porteConfig} onChange={e=>setGen(g=>({...g,porteConfig:e.target.value}))}>
                      {Object.keys(CONFIG_PORTE).map(k=><option key={k}>{k}</option>)}
                    </select>
                  </div>
                  {CONFIG_PORTE[gen.porteConfig] && (
                    <div style={S.regrasBox}>
                      <strong style={{color:'var(--amber)'}}>{gen.porteConfig}:</strong> duração mínima <strong>{CONFIG_PORTE[gen.porteConfig].duracaoMin} dias</strong> · kick off em até <strong>60 dias</strong> da assinatura<br/>
                      CT: <strong>{CONFIG_PORTE[gen.porteConfig].horasCT}h</strong> · Esp: <strong>{CONFIG_PORTE[gen.porteConfig].horasEsp}h</strong> · Edu: <strong>{CONFIG_PORTE[gen.porteConfig].horasEdu}h</strong>
                    </div>
                  )}
                  <div style={S.field}>
                    <label style={S.label}>Localidade da empresa</label>
                    <input style={S.input} value={gen.localidade} placeholder="Ex: Garanhuns, Araripina, Recife..." onChange={e=>aoMudarLocalidade(e.target.value)} />
                    {gen.localidade && (
                      <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>
                        Região detectada: <strong style={{color:'var(--text2)'}}>
                          {detectarRegiao(gen.localidade)==='rmr'       ? 'Grande Recife (RMR)'
                          :detectarRegiao(gen.localidade)==='caruaru'   ? 'Agreste (Caruaru)'
                          :detectarRegiao(gen.localidade)==='araripina' ? 'Sertão (Araripina)'
                          :detectarRegiao(gen.localidade)==='fora_pe'   ? 'Fora de PE — todos concorrem'
                          : 'Não identificada — todos concorrem'}
                        </strong>
                      </div>
                    )}
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Data de assinatura da proposta</label>
                    <input type="date" style={S.input} value={gen.dataAssinatura} onChange={e=>aoMudarAssinatura(e.target.value)} />
                  </div>
                </>)}
              </div>

              {sugestoesData.length > 0 && (
                <div style={S.card}>
                  <div style={S.cardTitle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Datas sugeridas para Kick Off
                  </div>
                  <div style={{marginBottom:12}}>
                    {sugestoesData.map(d=><button key={d} style={S.dataChip(gen.dataKickoff===d)} onClick={()=>aoMudarDataKickoff(d)}>{fmtData(d)}</button>)}
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Ou escolha outra data</label>
                    <input type="date" style={S.input} value={gen.dataKickoff} onChange={e=>aoMudarDataKickoff(e.target.value)} />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Data de encerramento (editável)</label>
                    <input type="date" style={S.input} value={gen.dataEncerramento} onChange={e=>setGen(g=>({...g,dataEncerramento:e.target.value}))} />
                  </div>
                  {gen.dataKickoff && gen.dataEncerramento && (() => {
                    const dias   = Math.round((new Date(gen.dataEncerramento+'T00:00:00')-new Date(gen.dataKickoff+'T00:00:00'))/86400000)
                    const minDias = CONFIG_PORTE[gen.porteConfig]?.duracaoMin||75
                    const ok     = dias >= minDias
                    return (
                      <div style={{...S.hintBox, borderColor:ok?'rgba(59,130,246,.15)':'rgba(239,68,68,.3)', background:ok?'rgba(59,130,246,.06)':'var(--red-dim)', color:ok?'var(--blue)':'var(--red)'}}>
                        <span>Duração total</span>
                        <span style={{fontFamily:"'JetBrains Mono', monospace",fontWeight:600}}>{dias} dias {ok?'✓':`⚠ mínimo ${minDias}`}</span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Coluna direita */}
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* RANKING — todos os consultores */}
              {rankingConsultores.length > 0 && (
                <div style={S.card}>
                  <div style={S.cardTitle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Consultores
                    <span style={{fontSize:10,fontWeight:400,color:'var(--muted)',marginLeft:4}}>— recomendados primeiro</span>
                  </div>

                  {/* Recomendados */}
                  {rankingConsultores.filter(c=>c.score>=8).length > 0 && (
                    <>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>✦ Recomendados para a região</div>
                      {rankingConsultores.filter(c=>c.score>=8).map((c,i) => {
                        const ativas   = kickoffs.filter(k=>k.consultor===c.nome&&k.status!=='apropriado').length
                        const sel      = gen.consultorSelecionado === c.nome
                        // Verificar sobreposição de férias com o período do cronograma
                        const feriasConflito = (() => {
                          if (!gen.dataKickoff || !gen.dataEncerramento) return null
                          const ini = new Date(gen.dataKickoff + 'T00:00:00')
                          const fim = new Date(gen.dataEncerramento + 'T00:00:00')
                          const feriasC = feriasPorConsultor[c.id] || []
                          return feriasC.find(f => {
                            const fIni = new Date(f.data_inicio + 'T00:00:00')
                            const fFim = new Date(f.data_fim + 'T00:00:00')
                            return fIni <= fim && fFim >= ini // sobreposição real
                          }) || null
                        })()
                        return (
                          <div key={c.id} style={{background:sel?'rgba(59,130,246,.06)':'rgba(16,185,129,.04)',border:`1px solid ${sel?'rgba(59,130,246,.3)':'rgba(16,185,129,.2)'}`,borderRadius:10,padding:'12px 14px',marginBottom:8,cursor:'pointer'}} onClick={()=>setGen(g=>({...g,consultorSelecionado:c.nome}))}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                              <span style={{fontWeight:700,color:sel?'var(--blue)':'var(--green)',fontSize:13}}>{i===0?'★ ':''}{c.nome}</span>
                              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                                {feriasConflito && <span style={{fontSize:10,fontWeight:700,color:'var(--red)',background:'rgba(240,90,90,.1)',padding:'1px 7px',borderRadius:4}}>⚠ FÉRIAS NO PERÍODO</span>}
                                {sel && <span style={{fontSize:10,fontWeight:700,color:'var(--blue)',background:'var(--blue-dim)',padding:'1px 7px',borderRadius:4}}>SELECIONADO</span>}
                              </div>
                            </div>
                            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                              <span style={S.chipReg(true)}>✓ {c.setor||'Sem setor'}</span>
                              <span style={S.chipReg(ativas<3)}>{ativas} empresa{ativas!==1?'s':''} ativa{ativas!==1?'s':''}</span>
                              {feriasConflito && (
                                <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:'rgba(240,90,90,.08)',color:'var(--red)',border:'1px solid rgba(240,90,90,.18)'}}>
                                  ?? {new Date(feriasConflito.data_inicio+'T00:00:00').toLocaleDateString('pt-BR')} – {new Date(feriasConflito.data_fim+'T00:00:00').toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}

                  {/* Demais consultores */}
                  {rankingConsultores.filter(c=>c.score<8).length > 0 && (
                    <>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8,marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>Demais consultores</div>
                      {gen.localidade && detectarRegiao(gen.localidade) && detectarRegiao(gen.localidade) !== 'fora_pe' && (
                        <div style={S.avisoFora}>⚠ Consultores fora da região podem gerar custo de deslocamento</div>
                      )}
                      {rankingConsultores.filter(c=>c.score<8).map(c => {
                        const ativas   = kickoffs.filter(k=>k.consultor===c.nome&&k.status!=='apropriado').length
                        const sel      = gen.consultorSelecionado === c.nome
                        const feriasConflito = (() => {
                          if (!gen.dataKickoff || !gen.dataEncerramento) return null
                          const ini = new Date(gen.dataKickoff + 'T00:00:00')
                          const fim = new Date(gen.dataEncerramento + 'T00:00:00')
                          const feriasC = feriasPorConsultor[c.id] || []
                          return feriasC.find(f => {
                            const fIni = new Date(f.data_inicio + 'T00:00:00')
                            const fFim = new Date(f.data_fim + 'T00:00:00')
                            return fIni <= fim && fFim >= ini
                          }) || null
                        })()
                        return (
                          <div key={c.id} style={{background:sel?'rgba(59,130,246,.06)':'var(--surface2)',border:`1px solid ${sel?'rgba(59,130,246,.3)':'var(--border)'}`,borderRadius:10,padding:'12px 14px',marginBottom:8,cursor:'pointer',opacity:sel?1:.75}} onClick={()=>setGen(g=>({...g,consultorSelecionado:c.nome}))}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                              <span style={{fontWeight:600,color:sel?'var(--blue)':'var(--text2)',fontSize:13}}>{c.nome}</span>
                              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                                {feriasConflito && <span style={{fontSize:10,fontWeight:700,color:'var(--red)',background:'rgba(240,90,90,.1)',padding:'1px 7px',borderRadius:4}}>⚠ FÉRIAS NO PERÍODO</span>}
                                <span style={{fontSize:10,color:'var(--muted)',background:'var(--subtle)',padding:'1px 7px',borderRadius:4}}>{c.setor||'Sem setor'}</span>
                                {sel && <span style={{fontSize:10,fontWeight:700,color:'var(--blue)',background:'var(--blue-dim)',padding:'1px 7px',borderRadius:4}}>SELECIONADO</span>}
                              </div>
                            </div>
                            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                              <span style={S.chipReg(false)}>~ {c.setor||'Sem setor'}</span>
                              <span style={S.chipReg(ativas<3)}>{ativas} empresa{ativas!==1?'s':''} ativa{ativas!==1?'s':''}</span>
                              {feriasConflito && (
                                <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:'rgba(240,90,90,.08)',color:'var(--red)',border:'1px solid rgba(240,90,90,.18)'}}>
                                  ?? {new Date(feriasConflito.data_inicio+'T00:00:00').toLocaleDateString('pt-BR')} – {new Date(feriasConflito.data_fim+'T00:00:00').toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Especialista */}
              {gen.empresa && espOptions.length > 0 && (
                <div style={S.card}>
                  <div style={S.cardTitle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    Especialista / Coordenador
                  </div>
                  {espOptions.map(e => {
                    const sel = gen.espSelecionado === e.nome
                    return (
                      <div key={e.id} style={{background:sel?'rgba(167,139,250,.08)':'var(--surface2)',border:`1px solid ${sel?'rgba(167,139,250,.3)':'var(--border)'}`,borderRadius:10,padding:'10px 14px',marginBottom:8,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}} onClick={()=>setGen(g=>({...g,espSelecionado:e.nome}))}>
                        <span style={{fontWeight:600,color:sel?'#a78bfa':'var(--text)',fontSize:13}}>{e.nome}</span>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <span style={{fontSize:10,fontWeight:600,color:'var(--muted)',background:'var(--subtle)',padding:'2px 7px',borderRadius:4}}>{e.cargo}</span>
                          {sel && <span style={{fontSize:10,fontWeight:700,color:'#a78bfa',background:'rgba(167,139,250,.1)',padding:'1px 7px',borderRadius:4}}>SELECIONADO</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Botão gerar */}
              {gen.empresa && gen.dataKickoff && gen.dataEncerramento && gen.consultorSelecionado && (
                <div style={S.card}>
                  {erroGen && <div style={S.erro}>{erroGen}</div>}
                  <button style={{...S.btn,width:'100%',justifyContent:'center'}} onClick={gerarCronograma}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    Gerar Cronograma
                  </button>
                </div>
              )}

              {/* Sessões */}
              {sessoes.length > 0 && (
                <div style={S.card}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--text)',display:'flex',alignItems:'center',gap:8}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {sessoes.length} sessões · {sessoes.reduce((a,s)=>a+(parseFloat(s.horas)||0),0)}h total
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button style={S.btnGreen} onClick={exportarXlsx} disabled={gerandoXlsx}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {gerandoXlsx?'Exportando...':'.xlsx'}
                      </button>
                      <button style={S.btn} onClick={salvarCronograma} disabled={salvandoCron}>{salvandoCron?'Salvando...':'Salvar no sistema'}</button>
                    </div>
                  </div>

                  {/* Aviso feriados */}
                  {sessoes.some(s=>isFeriadoCached(s.data)) && (
                    <div style={{background:'rgba(245,158,11,.07)',border:'1px solid rgba(245,158,11,.2)',borderRadius:7,padding:'8px 12px',marginBottom:8,fontSize:12,color:'var(--amber)'}}>
                      ⚠ {sessoes.filter(s=>isFeriadoCached(s.data)).length} sessão(ões) coincidem com feriados nacionais — revise as datas abaixo.
                    </div>
                  )}
                  {/* Aviso férias */}
                  {sessoes.some(s=>isConsultorEmFerias(s.data, s.responsavel)) && (
                    <div style={{background:'rgba(167,139,250,.07)',border:'1px solid rgba(167,139,250,.2)',borderRadius:7,padding:'8px 12px',marginBottom:12,fontSize:12,color:'var(--purple)'}}>
                      ?? {sessoes.filter(s=>isConsultorEmFerias(s.data, s.responsavel)).length} sessão(ões) coincidem com período de férias do responsável — revise as datas abaixo.
                    </div>
                  )}

                  <div style={{...S.sessaoRow,paddingBottom:6,marginBottom:2}}>
                    {['Data','Atividade','Responsável','Horas'].map(h=><span key={h} style={{fontSize:10,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.07em'}}>{h}</span>)}
                  </div>
                  {sessoes.map(s => (
                    <div key={s.id} style={S.sessaoRow}>
                      <div>
                        <input type="date" style={{...S.input,padding:'5px 8px',fontSize:12,color:'var(--text)',
                          borderColor: isFeriadoCached(s.data)?'rgba(245,158,11,.5)': isConsultorEmFerias(s.data,s.responsavel)?'rgba(167,139,250,.5)':undefined,
                          background:  isFeriadoCached(s.data)?'rgba(245,158,11,.05)': isConsultorEmFerias(s.data,s.responsavel)?'rgba(167,139,250,.05)':undefined
                        }} value={s.data} onChange={e=>editarSessao(s.id,'data',e.target.value)} />
                        {isFeriadoCached(s.data) && <div style={S.feriadoWarn}>⚠ {nomeFeriado(s.data)}</div>}
                        {!isFeriadoCached(s.data) && isConsultorEmFerias(s.data,s.responsavel) && (
                          <div style={{fontSize:10,color:'var(--purple)',background:'rgba(167,139,250,.1)',padding:'2px 6px',borderRadius:4,marginTop:3,display:'inline-flex',alignItems:'center',gap:3}}>?? Férias do responsável</div>
                        )}
                      </div>
                      <input style={{...S.input,padding:'5px 8px',fontSize:12,color:'var(--text)'}} value={s.atividade} onChange={e=>editarSessao(s.id,'atividade',e.target.value)} />
                      <select style={{...S.fsel,padding:'5px 8px',fontSize:11,color:'var(--text)'}} value={s.responsavel} onChange={e=>editarSessao(s.id,'responsavel',e.target.value)}>
                        <option value={gen.consultorSelecionado}>{gen.consultorSelecionado} (CT)</option>
                        {espOptions.map(e=><option key={e.id} value={e.nome}>{e.nome} ({e.cargo})</option>)}
                        <option value="EDUCAÇÃO">EDUCAÇÃO</option>
                      </select>
                      <input type="number" step="0.5" min="1" style={{...S.input,padding:'5px 8px',fontSize:12,color:'var(--text)'}} value={s.horas} onChange={e=>editarSessao(s.id,'horas',parseFloat(e.target.value))} />
                    </div>
                  ))}

                  <div style={{marginTop:14,padding:'10px 14px',background:'var(--surface2)',borderRadius:8,display:'flex',gap:24,flexWrap:'wrap',fontSize:12}}>
                    {[['CT','var(--blue-dim)','var(--blue)'],['ESP','rgba(167,139,250,.1)','#a78bfa'],['EDU','var(--green-dim)','var(--green)']].map(([tipo,bg,color]) => {
                      const h = sessoes.filter(s=>s.tipoResp===tipo).reduce((a,s)=>a+(parseFloat(s.horas)||0),0)
                      if (!h) return null
                      return (
                        <div key={tipo} style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{display:'inline-flex',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:600,background:bg,color}}>{tipo}</span>
                          <span style={{fontFamily:"'JetBrains Mono', monospace",fontWeight:600,color:'var(--text)'}}>{h}h</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {sessoes.length === 0 && !gen.empresa && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:260,background:'var(--surface)',border:'1px dashed var(--border2)',borderRadius:12,color:'var(--muted)',fontSize:13,flexDirection:'column',gap:10}}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Selecione uma empresa para começar
                </div>
              )}
            </div>
          </div>
        )}
      </>)}

      {/* ══════════ ABA SEBRAETEC ══════════ */}
      {aba === 'sebraetec' && (<>
        <div style={S.toolbar}>
          <input style={S.search} placeholder="Buscar empresa, ID SGT, nº proposta, consultor..." value={buscaS} onChange={e=>setBuscaS(e.target.value)} />
          <button style={S.filtro(!filtroS)} onClick={()=>setFiltroS('')}>Todos</button>
          <button style={S.filtro(filtroS==='aguardando')} onClick={()=>setFiltroS('aguardando')}>Aguardando</button>
          <button style={S.filtro(filtroS==='em_execucao')} onClick={()=>setFiltroS('em_execucao')}>Em execução</button>
          <button style={S.filtro(filtroS==='concluido')} onClick={()=>setFiltroS('concluido')}>Concluído</button>
          <button style={S.filtro(filtroS==='cancelado')} onClick={()=>setFiltroS('cancelado')}>Cancelado</button>
        </div>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>ID SGT</th><th style={S.th}>Nº Proposta</th><th style={S.th}>Empresa</th>
              <th style={S.th}>Consultor</th><th style={S.th}>Horas</th><th style={S.th}>Receita</th>
              <th style={S.th}>Status</th><th style={S.th}></th>
            </tr></thead>
            <tbody>
              {filtradosS.map(r => {
                const cor = STATUS_AT_COR[r.status]||'var(--muted)'
                return (
                  <tr key={r.id} {...trHover}>
                    <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace",color:'var(--blue)',fontWeight:500}}>{r.id_sgt}</td>
                    <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace",fontSize:12,color:'var(--purple)'}}>{r.numero_proposta||<span style={{color:'var(--border2)'}}>—</span>}</td>
                    <td style={{...S.td,color:'var(--text)',fontWeight:500}}>{r.empresa}</td>
                    <td style={S.td}>{r.consultor||<span style={{color:'var(--border2)'}}>—</span>}
                      {r.status==='aguardando' && r.motivo_pendencia && <div style={{fontSize:10,color:'#fb923c',marginTop:2}}>⏳ {r.motivo_pendencia}</div>}
                    </td>
                    <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace"}}>{r.horas_total?`${r.horas_total}h`:'—'}</td>
                    <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace",color:'var(--green)'}}>{fmtMoeda(r.receita)}</td>
                    <td style={S.td}>
                      <span style={{background:`${cor}18`,color:cor,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>● {STATUS_AT_LABEL[r.status]||r.status}</span>
                      {r.status==='concluido' && r.data_conclusao && <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{fmtData(r.data_conclusao)}</div>}
                    </td>
                    <td style={S.td}>
                      <div style={{display:'flex',gap:4}}>
                        {podeEditar && <button style={S.btnSm} onClick={()=>abrirEditarS(r)}>Editar</button>}
                        {isAdmin    && <button style={S.btnDanger} onClick={()=>excluirS(r.id)}>✕</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtradosS.length===0 && <tr><td colSpan={8} style={{...S.td,textAlign:'center',padding:40,color:'var(--muted)'}}>{loading?'Carregando...':'Nenhum registro.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ══════════ ABA DIRETAS ══════════ */}
      {aba === 'diretas' && (<>
        <div style={S.infoGreen}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:'inline',verticalAlign:'middle',marginRight:6}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Atendimentos com status <strong>"Concluído"</strong> e NF pendente aparecem aqui para solicitação. Os dados da empresa são usados automaticamente ao solicitar a NF.
        </div>
        <div style={S.toolbar}>
          <input style={S.search} placeholder="Buscar empresa, ID SGT, nº proposta, consultor..." value={buscaD} onChange={e=>setBuscaD(e.target.value)} />
          <button style={S.filtro(!filtroD)} onClick={()=>setFiltroD('')}>Todos</button>
          <button style={S.filtro(filtroD==='aguardando')} onClick={()=>setFiltroD('aguardando')}>Aguardando</button>
          <button style={S.filtro(filtroD==='em_execucao')} onClick={()=>setFiltroD('em_execucao')}>Em execução</button>
          <button style={S.filtro(filtroD==='concluido')} onClick={()=>setFiltroD('concluido')}>Concluído</button>
          <button style={S.filtro(filtroD==='cancelado')} onClick={()=>setFiltroD('cancelado')}>Cancelado</button>
        </div>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>ID SGT</th><th style={S.th}>Nº Proposta</th><th style={S.th}>Empresa</th>
              <th style={S.th}>Consultor</th><th style={S.th}>Horas</th><th style={S.th}>Receita</th>
              <th style={S.th}>Status</th><th style={S.th}>NF</th><th style={S.th}></th>
            </tr></thead>
            <tbody>
              {filtradosD.map(r => {
                const cor   = STATUS_AT_COR[r.status]||'var(--muted)'
                const corNF = STATUS_NF_COR[r.status_nf]||'var(--muted)'
                return (
                  <tr key={r.id} {...trHover}>
                    <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace",color:'var(--blue)',fontWeight:500}}>{r.id_sgt}</td>
                    <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace",fontSize:12,color:'var(--purple)'}}>{r.numero_proposta||<span style={{color:'var(--border2)'}}>—</span>}</td>
                    <td style={{...S.td,color:'var(--text)',fontWeight:500}}>{r.empresa}</td>
                    <td style={S.td}>{r.consultor||<span style={{color:'var(--border2)'}}>—</span>}
                      {r.status==='aguardando' && r.motivo_pendencia && <div style={{fontSize:10,color:'#fb923c',marginTop:2}}>⏳ {r.motivo_pendencia}</div>}
                    </td>
                    <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace"}}>{r.horas_total?`${r.horas_total}h`:'—'}</td>
                    <td style={{...S.td,fontFamily:"'JetBrains Mono', monospace",color:'var(--green)'}}>{fmtMoeda(r.receita)}</td>
                    <td style={S.td}>
                      <span style={{background:`${cor}18`,color:cor,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>● {STATUS_AT_LABEL[r.status]||r.status}</span>
                      {r.status==='concluido' && r.data_conclusao && <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{fmtData(r.data_conclusao)}</div>}
                    </td>
                    <td style={S.td}>
                      {r.status_nf ? (
                        <span style={{background:`${corNF}18`,color:corNF,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>
                          {STATUS_NF_LABEL[r.status_nf]||r.status_nf}
                        </span>
                      ) : <span style={{color:'var(--border2)'}}>—</span>}
                    </td>
                    <td style={S.td}>
                      <div style={{display:'flex',gap:4}}>
                        {r.status==='concluido' && r.status_nf==='pendente' && (
                          <button style={S.btnNF} onClick={()=>abrirSolicitarNF(r)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            Solicitar NF
                          </button>
                        )}
                        {podeEditar && <button style={S.btnSm} onClick={()=>abrirEditarD(r)}>Editar</button>}
                        {isAdmin    && <button style={S.btnDanger} onClick={()=>excluirD(r.id)}>✕</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtradosD.length===0 && <tr><td colSpan={9} style={{...S.td,textAlign:'center',padding:40,color:'var(--muted)'}}>{loading?'Carregando...':'Nenhum registro.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ── MODAL B+P ─────────────────────────────────────────────────────────── */}
      {modalBP && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModalBP(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoBP?'Editar B+P':'Novo Registro B+P'}</div>
            {erro && <div style={S.erro}>{erro}</div>}

            <div style={S.sectionLbl}>Kick Off</div>
            <div style={S.field}>
              <label style={S.label}>Status do Kick Off</label>
              <select style={S.fsel} value={formBP.status} onChange={e=>setStatusKO(e.target.value)}>
                <option value="aguardando_cronograma">Aguardando Cronograma</option>
                <option value="pendente">Pendente</option>
                <option value="apropriado">Apropriado</option>
              </select>
            </div>
            {formBP.status==='aguardando_cronograma' && <div style={S.infoBox}>Data e consultor podem ser preenchidos depois, quando o cronograma for gerado.</div>}
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Data do Kick Off {formBP.status==='aguardando_cronograma'?'(opcional)':'*'}</label>
                <input type="date" style={S.input} value={formBP.data_kickoff} onChange={e=>setFormBP({...formBP,data_kickoff:e.target.value})} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Horas do Kick Off</label>
                <input type="number" step="0.5" min="0.5" style={S.input} value={formBP.horas_kickoff} onChange={e=>setFormBP({...formBP,horas_kickoff:e.target.value})} placeholder="4" />
              </div>
            </div>

            <div style={S.sectionLbl}>Atendimento</div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Status do Atendimento</label>
                <select style={S.fsel} value={formBP.status_atendimento} onChange={e=>setFormBP({...formBP,status_atendimento:e.target.value})}>
                  <option value="nao_iniciado">Não iniciado</option>
                  <option value="em_execucao">Em execução</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Porte</label>
                <select style={S.fsel} value={formBP.porte} onChange={e=>setFormBP({...formBP,porte:e.target.value})}>
                  {PORTES.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={S.sectionLbl}>Identificação</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>ID SGT *</label><input style={S.input} value={formBP.id_sgt} onChange={e=>setFormBP({...formBP,id_sgt:e.target.value})} placeholder="713154" /></div>
              <div style={S.field}>
                <label style={S.label}>Consultor {formBP.status==='aguardando_cronograma'?'(opcional)':''}</label>
                <select style={S.fsel} value={formBP.consultor} onChange={e=>setFormBP({...formBP,consultor:e.target.value})}>
                  <option value="">Selecione...</option>
                  {consultores.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <div style={S.field}><label style={S.label}>Empresa *</label><input style={S.input} value={formBP.empresa} onChange={e=>setFormBP({...formBP,empresa:e.target.value})} placeholder="Nome da empresa" /></div>

            <div style={S.row}>
              <button style={S.btnSm} onClick={()=>setModalBP(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvarBP} disabled={salvando}>{salvando?'Salvando...':'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SEBRAETEC ───────────────────────────────────────────────────── */}
      {modalS && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModalS(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoS?'Editar Sebraetec':'Novo Registro Sebraetec'}</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>ID SGT *</label><input style={S.input} value={formS.id_sgt} onChange={e=>setFormS({...formS,id_sgt:e.target.value})} placeholder="SEB-2026-041" /></div>
              <div style={S.field}><label style={S.label}>Nº da Proposta</label><input style={S.input} value={formS.numero_proposta} onChange={e=>setFormS({...formS,numero_proposta:e.target.value})} placeholder="PROP-2026-089" /></div>
            </div>
            <div style={S.field}><label style={S.label}>Empresa *</label><input style={S.input} value={formS.empresa} onChange={e=>setFormS({...formS,empresa:e.target.value})} placeholder="Nome da empresa" /></div>
            <div style={S.field}>
              <label style={S.label}>Consultor</label>
              <select style={S.fsel} value={formS.consultor} onChange={e=>setFormS({...formS,consultor:e.target.value})}>
                <option value="">Selecione...</option>
                {consultores.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Status</label>
                <select style={S.fsel} value={formS.status} onChange={e=>setFormS({...formS,status:e.target.value})}>
                  <option value="aguardando">Aguardando</option>
                  <option value="em_execucao">Em execução</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Horas Totais</label><input type="number" style={S.input} value={formS.horas_total} onChange={e=>setFormS({...formS,horas_total:e.target.value})} placeholder="40" /></div>
            </div>
            {formS.status === 'aguardando' && (<>
              <div style={S.field}>
                <label style={S.label}>Motivo da pendência</label>
                <select style={S.fsel} value={formS.motivo_pendencia} onChange={e=>setFormS({...formS,motivo_pendencia:e.target.value})}>
                  <option value="">Selecione o motivo...</option>
                  <option>Consultor não definido</option>
                  <option>Aguardando avaliação interna</option>
                  <option>Aguardando documentação</option>
                  <option>Outros</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Observação</label>
                <textarea style={{...S.input,minHeight:60,resize:'vertical'}} value={formS.observacoes} onChange={e=>setFormS({...formS,observacoes:e.target.value})} placeholder="Detalhe o motivo..." />
              </div>
            </>)}
            {formS.status === 'concluido' && (
              <div style={S.field}>
                <label style={S.label}>Data de Conclusão no SGT *</label>
                <input type="date" style={S.input} value={formS.data_conclusao} onChange={e=>setFormS({...formS,data_conclusao:e.target.value})} />
              </div>
            )}
            <div style={S.field}><label style={S.label}>Receita Prevista (R$)</label><input type="number" style={S.input} value={formS.receita} onChange={e=>setFormS({...formS,receita:e.target.value})} placeholder="8000" /></div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={()=>setModalS(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvarS} disabled={salvando}>{salvando?'Salvando...':'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DIRETAS ─────────────────────────────────────────────────────── */}
      {modalD && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModalD(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoD?'Editar Direta':'Nova Direta'}</div>
            {!editandoD && <div style={S.infoGreen}>Quando concluído, este atendimento aparecerá com o botão "Solicitar NF" para envio ao Financeiro.</div>}
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>ID SGT *</label><input style={S.input} value={formD.id_sgt} onChange={e=>setFormD({...formD,id_sgt:e.target.value})} placeholder="DIR-2026-012" /></div>
              <div style={S.field}><label style={S.label}>Nº da Proposta</label><input style={S.input} value={formD.numero_proposta} onChange={e=>setFormD({...formD,numero_proposta:e.target.value})} placeholder="PROP-2026-102" /></div>
            </div>
            <div style={S.field}><label style={S.label}>Empresa *</label><input style={S.input} value={formD.empresa} onChange={e=>setFormD({...formD,empresa:e.target.value})} placeholder="Nome da empresa" /></div>
            <div style={S.field}>
              <label style={S.label}>Consultor</label>
              <select style={S.fsel} value={formD.consultor} onChange={e=>setFormD({...formD,consultor:e.target.value})}>
                <option value="">Selecione...</option>
                {consultores.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Status</label>
                <select style={S.fsel} value={formD.status} onChange={e=>setFormD({...formD,status:e.target.value})}>
                  <option value="aguardando">Aguardando</option>
                  <option value="em_execucao">Em execução</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Horas Totais</label><input type="number" style={S.input} value={formD.horas_total} onChange={e=>setFormD({...formD,horas_total:e.target.value})} placeholder="80" /></div>
            </div>
            {formD.status === 'aguardando' && (<>
              <div style={S.field}>
                <label style={S.label}>Motivo da pendência</label>
                <select style={S.fsel} value={formD.motivo_pendencia} onChange={e=>setFormD({...formD,motivo_pendencia:e.target.value})}>
                  <option value="">Selecione o motivo...</option>
                  <option>Consultor não definido</option>
                  <option>Aguardando avaliação interna</option>
                  <option>Aguardando documentação</option>
                  <option>Outros</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Observação</label>
                <textarea style={{...S.input,minHeight:60,resize:'vertical'}} value={formD.observacoes} onChange={e=>setFormD({...formD,observacoes:e.target.value})} placeholder="Detalhe o motivo..." />
              </div>
            </>)}
            {formD.status === 'concluido' && (
              <div style={S.field}>
                <label style={S.label}>Data de Conclusão no SGT *</label>
                <input type="date" style={S.input} value={formD.data_conclusao} onChange={e=>setFormD({...formD,data_conclusao:e.target.value})} />
              </div>
            )}
            <div style={S.field}><label style={S.label}>Receita Prevista (R$)</label><input type="number" style={S.input} value={formD.receita} onChange={e=>setFormD({...formD,receita:e.target.value})} placeholder="18000" /></div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={()=>setModalD(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvarD} disabled={salvando}>{salvando?'Salvando...':'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL SOLICITAR NF ───────────────────────────────────────────────── */}
      {modalSolNF && diretaSel && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModalSolNF(false)}>
          <div style={{...S.modalBox,maxWidth:520}}>
            <div style={S.modalTitle}>Solicitar Emissão de NF</div>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:18}}>{diretaSel.empresa} · {diretaSel.id_sgt}</div>

            <div style={S.infoBox}>Os dados do atendimento foram importados. Preencha as condições de pagamento — o restante você completa no Financeiro após o envio.</div>

            <div style={S.sectionLbl}>Dados importados</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>ID SGT</label><input style={{...S.input,opacity:.6,cursor:'not-allowed'}} value={diretaSel.id_sgt} disabled /></div>
              <div style={S.field}><label style={S.label}>Nº Proposta</label><input style={{...S.input,opacity:.6,cursor:'not-allowed'}} value={diretaSel.numero_proposta||'—'} disabled /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Empresa</label><input style={{...S.input,opacity:.6,cursor:'not-allowed'}} value={diretaSel.empresa} disabled /></div>
              <div style={S.field}><label style={S.label}>Consultor</label><input style={{...S.input,opacity:.6,cursor:'not-allowed'}} value={diretaSel.consultor||'—'} disabled /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Status SGT</label><input style={{...S.input,opacity:.6,cursor:'not-allowed'}} value="Concluído" disabled /></div>
              <div style={S.field}><label style={S.label}>Data de conclusão</label><input style={{...S.input,opacity:.6,cursor:'not-allowed'}} value={diretaSel.data_conclusao ? new Date(diretaSel.data_conclusao+'T00:00:00').toLocaleDateString('pt-BR') : '—'} disabled /></div>
            </div>

            <div style={S.sectionLbl}>Condições de pagamento</div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Nº de Parcelas</label>
                <input type="number" min="1" style={S.input} value={formNF.numero_parcelas} onChange={e=>{
                  const n = parseInt(e.target.value)||1
                  const receita = parseFloat(diretaSel.receita)||0
                  setFormNF(f=>({...f,numero_parcelas:n,valor_parcela:(receita/n).toFixed(2)}))
                }} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Valor por Parcela (R$) <span style={{color:'var(--muted)',fontWeight:400}}>editável</span></label>
                <input type="number" step="0.01" style={S.input} value={formNF.valor_parcela} onChange={e=>setFormNF(f=>({...f,valor_parcela:e.target.value}))} />
              </div>
            </div>
            {(() => {
              const total = (parseFloat(formNF.valor_parcela)||0) * (parseInt(formNF.numero_parcelas)||1)
              const receita = parseFloat(diretaSel.receita)||0
              return (
                <div style={{background:'var(--blue-dim)',border:'1px solid rgba(79,142,247,.2)',borderRadius:8,padding:'12px 16px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:10,color:'var(--blue)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>Valor Total</div>
                    <div style={{fontFamily:"'JetBrains Mono', monospace",fontSize:20,fontWeight:500,color:'var(--blue)'}}>{total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:10,color:'var(--muted)',marginBottom:3}}>Receita cadastrada</div>
                    <div style={{fontFamily:"'JetBrains Mono', monospace",fontSize:13,color:'var(--muted)'}}>{receita.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
                  </div>
                </div>
              )
            })()}
            <div style={S.field}>
              <label style={S.label}>Observações</label>
              <textarea style={{...S.input,minHeight:60,resize:'vertical'}} value={formNF.observacoes} onChange={e=>setFormNF(f=>({...f,observacoes:e.target.value}))} placeholder="Informações adicionais..." />
            </div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={()=>setModalSolNF(false)}>Cancelar</button>
              <button style={S.btnGreen} onClick={salvarSolicitacaoNF} disabled={salvandoNF}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {salvandoNF?'Enviando...':'Enviar para Financeiro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
