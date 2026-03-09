import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ── CONSTANTES ──────────────────────────────────────────────────────────────
const PORTES = ['Micro', 'Pequeno', 'Médio']
const HORAS_POR_PORTE = { Micro: 2, Pequeno: 4, Médio: 6 }
const PORTE_COR = { Micro: 'var(--green)', Pequeno: 'var(--amber)', Médio: 'var(--blue)' }
const STATUS_COR = { pendente: 'var(--red)', apropriado: 'var(--green)', aguardando_cronograma: 'var(--blue)' }
const STATUS_LABEL = { pendente: 'Pendente', apropriado: 'Apropriado', aguardando_cronograma: 'Ag. Cronograma' }
const CARGOS_CONSULTOR = ['consultor técnico', 'consultora técnica']
const CARGO_ESPECIALISTA = 'especialista técnico'

const CONFIG_PORTE = {
  'Micro/Pequeno — 80h': { horasTotal: 80,  horasCT: 68,  horasEsp: 8,  horasEdu: 4, duracaoMin: 90, label: '80h'  },
  'Médio — 120h':        { horasTotal: 120, horasCT: 104, horasEsp: 12, horasEdu: 4, duracaoMin: 75, label: '120h' },
  'Médio — 110h':        { horasTotal: 110, horasCT: 94,  horasEsp: 8,  horasEdu: 4, duracaoMin: 75, label: '110h' },
}

// Template 80h — exatamente como a planilha modelo (Garanhuns)
// CT: 68h | ESP: 8h | EDU: 4h = 80h total
const ATIVIDADES_80H = [
  { etapa: 'Preparação',            atividade: 'Reunião de Kick Off: Reunião com empresário e gestores da empresa para apresentar o programa e o que será desenvolvido; Relembrar o cronograma; Realizar uma visita no Gemba; Definir focal point', resp: 'CT',  horas: 4 },
  { etapa: 'Preparação',            atividade: 'Reunião de Kick Off: Reunião com empresário e gestores da empresa para apresentar o programa de formação profissional',                                                                             resp: 'EDU', horas: 4 },
  { etapa: 'Preparação',            atividade: 'Análise Tarifária',                                           resp: 'CT',  horas: 2 },
  { etapa: 'Mapeamento energético', atividade: 'Identificação da Carga Alvo.',                                resp: 'CT',  horas: 4 },
  { etapa: 'Mapeamento energético', atividade: 'Validação da Oportunidade',                                   resp: 'CT',  horas: 8 },
  { etapa: 'Mapeamento energético', atividade: 'Inspeção Termográfica/Inspeção com Drone',                    resp: 'CT',  horas: 8 },
  { etapa: 'Mapeamento energético', atividade: 'Medição Inicial da Carga Alvo',                               resp: 'CT',  horas: 8 },
  { etapa: 'Mapeamento energético', atividade: 'Acompanhamento Operacional',                                  resp: 'CT',  horas: 8 },
  { etapa: 'Mapeamento energético', atividade: 'Análise de Tecnologia e Otimização',                          resp: 'CT',  horas: 4 },
  { etapa: 'Implementação',         atividade: 'Elaboração do Plano de Implementação',                        resp: 'CT',  horas: 6 },
  { etapa: 'Implementação',         atividade: 'Monitoramento das Ações em Implementação',                    resp: 'CT',  horas: 4 },
  { etapa: 'Implementação',         atividade: 'Controle e Gestão da Consultoria ',                           resp: 'ESP', horas: 8 },
  { etapa: 'Implementação',         atividade: 'Medição Final das Cargas Alvo.',                              resp: 'CT',  horas: 4 },
  { etapa: 'Implementação',         atividade: 'Medição Final das Cargas Alvo.',                              resp: 'CT',  horas: 4 },
  { etapa: 'Reunião Final',         atividade: 'Análise e Validação do Relatório e Reunião de Encerramento.', resp: 'CT',  horas: 4 },
]

// Template 120h — como a planilha modelo (MABOR)
// CT: 104h | ESP: 12h | EDU: 4h = 120h total
const ATIVIDADES_120H = [
  { etapa: 'Preparação',            atividade: 'Reunião de Kick Off: Reunião com empresário e gestores da empresa para apresentar o programa e o que será desenvolvido; Relembrar o cronograma; Realizar uma visita no Gemba; Definir focal point', resp: 'CT',  horas: 4 },
  { etapa: 'Preparação',            atividade: 'Reunião de Kick Off: Reunião com empresário e gestores da empresa para apresentar o programa de formação profissional',                                                                             resp: 'EDU', horas: 4 },
  { etapa: 'Preparação',            atividade: 'Análise Tarifária',                                           resp: 'CT',  horas: 4 },
  { etapa: 'Mapeamento energético', atividade: 'Identificação da Carga Alvo',                                 resp: 'CT',  horas: 8 },
  { etapa: 'Mapeamento energético', atividade: 'Validação da Oportunidade',                                   resp: 'CT',  horas: 8 },
  { etapa: 'Mapeamento energético', atividade: 'Inspeção Termográfica/Inspeção com Drone',                    resp: 'CT',  horas: 8 },
  { etapa: 'Mapeamento energético', atividade: 'Medição Inicial da Carga Alvo',                               resp: 'CT',  horas: 8 },
  { etapa: 'Mapeamento energético', atividade: 'Medição Inicial da Carga Alvo',                               resp: 'CT',  horas: 8 },
  { etapa: 'Implementação',         atividade: 'Acompanhamento Operacional',                                  resp: 'ESP', horas: 8 },
  { etapa: 'Implementação',         atividade: 'Análise de Tecnologia e Otimização',                          resp: 'CT',  horas: 8 },
  { etapa: 'Implementação',         atividade: 'Elaboração do Plano de Implementação',                        resp: 'CT',  horas: 8 },
  { etapa: 'Implementação',         atividade: 'Monitoramento das Ações em Implementação',                    resp: 'CT',  horas: 8 },
  { etapa: 'Implementação',         atividade: 'Monitoramento das Ações em Implementação',                    resp: 'CT',  horas: 8 },
  { etapa: 'Implementação',         atividade: 'Controle e Gestão da Consultoria ',                           resp: 'ESP', horas: 4 },
  { etapa: 'Implementação',         atividade: 'Medição Final das Cargas Alvo.',                              resp: 'CT',  horas: 8 },
  { etapa: 'Implementação',         atividade: 'Medição Final das Cargas Alvo.',                              resp: 'CT',  horas: 8 },
  { etapa: 'Reunião Final',         atividade: 'Análise e validação do Relatório e Reunião de encerramento.', resp: 'CT',  horas: 8 },
]

// Template 110h — ajusta a partir do 120h (sem 2ª Medição Inicial, ESP reduzido)
// CT: 94h | ESP: 8h | EDU: 4h = 110h (sem a 2ª Medição Inicial -8h e Acomp ESP -4h)
const ATIVIDADES_110H = [
  ...ATIVIDADES_120H.filter((_, i) => i !== 7), // remove 2ª Medição Inicial
].map(a => a.atividade === 'Acompanhamento Operacional' ? { ...a, horas: 4 } : a) // Acomp 4h

const REGIOES_PE = {
  rmr: ['recife','olinda','jaboatão','jaboatao','paulista','camaragibe','são lourenço','sao lourenco','cabo de santo agostinho','cabo','ipojuca','moreno','abreu e lima','igarassu','itamaracá','itamaraca','araçoiaba','aracoiaba'],
  caruaru: ['caruaru','garanhuns','belo jardim','arcoverde','pesqueira','bezerros','santa cruz','caetes','caetés','aguas belas','águas belas','buíque','buique','venturosa','lajedo','palmares','catende','barreiros','rio formoso','sirinhaem','sirinhaém','escada'],
  araripina: ['araripina','petrolina','salgueiro','ouricuri','exu','bodoco','ipubi','trindade','cedro','serrita','verdejante','mirandiba','parnamirim','floresta','tacaratu','cabrobó','cabrobo'],
}

const ESTADOS_FORA_PE = ['bahia','ceará','ceara','paraíba','paraiba','maranhão','maranhao','tocantins','piauí','piaui','rio grande do norte','alagoas','sergipe','são paulo','sao paulo','rio de janeiro','minas gerais','goiás','goias','mato grosso','amazonas','pará','para','acre','rondônia','rondonia','amapá','amapa','roraima']

function detectarRegiao(localidade) {
  if (!localidade) return null
  const l = localidade.toLowerCase()
  if (ESTADOS_FORA_PE.some(e => l.includes(e))) return 'fora_pe'
  for (const [regiao, cidades] of Object.entries(REGIOES_PE)) {
    if (cidades.some(c => l.includes(c))) return regiao
  }
  return null
}

function scoreConsultor(consultor, regiaoEmpresa, kickoffsAtivos) {
  const setor = (consultor.setor || '').toLowerCase()
  let score = 0
  if (regiaoEmpresa === 'rmr' && setor.includes('rmr')) score += 10
  else if (regiaoEmpresa === 'caruaru' && setor.includes('caruaru')) score += 10
  else if (regiaoEmpresa === 'araripina' && setor.includes('araripina')) score += 10
  else if (regiaoEmpresa === 'fora_pe') score += 3
  else score += 1
  const ativas = kickoffsAtivos.filter(k => k.consultor === consultor.nome && k.status !== 'apropriado').length
  score -= ativas * 2
  return score
}

function proximasDatasKickoff(dataAssinatura) {
  const base = new Date(dataAssinatura + 'T00:00:00')
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
  const inicio = new Date(dataKickoff + 'T00:00:00')
  const fim = new Date(dataEncerramento + 'T00:00:00')
  const totalDias = Math.round((fim - inicio) / (1000 * 60 * 60 * 24))
  const atividades = configPorte.horasTotal <= 80 ? ATIVIDADES_80H
    : configPorte.horasTotal === 110 ? ATIVIDADES_110H
    : ATIVIDADES_120H
  const n = atividades.length
  return atividades.map((a, i) => {
    const progresso = i / Math.max(n - 1, 1)
    const diasOffset = Math.round(progresso * totalDias)
    const d = new Date(inicio); d.setDate(d.getDate() + diasOffset)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    const nomeReal = a.resp === 'CT' ? nomeConsultor
      : a.resp === 'ESP' ? (nomeEsp || 'ESPECIALISTA OU COORDENADOR')
      : nomeConsultor // EDU = mesmo consultor técnico
    return {
      id: i,
      data: d.toISOString().split('T')[0],
      etapa: a.etapa,
      atividade: a.atividade,
      tipoResp: a.resp, // CT / ESP / EDU — para o totalizador
      responsavel: nomeReal,
      horas: a.horas,
      horario: a.horas <= 4 ? '08:00 as 12:00' : '08:00 as 17:00',
      formato: 'Presencial',
    }
  })
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function fmtData(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
function addDias(dateStr, dias) { const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + dias); return d.toISOString().split('T')[0] }
function isHoje(d) {
  if (!d) return false
  const hoje = new Date(); const data = new Date(d + 'T00:00:00')
  return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth() && data.getDate() === hoje.getDate()
}
function isFuturo(d) {
  if (!d) return false
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  return new Date(d + 'T00:00:00') > hoje
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const S = {
  wrap: { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub: { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  abas: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 },
  aba: (on) => ({ padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: `2px solid ${on ? 'var(--blue)' : 'transparent'}`, fontFamily: 'inherit', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6 }),
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 22 },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' },
  statBar: (c) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: c, opacity: .5 }),
  statVal: (c) => ({ fontFamily: 'DM Mono, monospace', fontSize: 26, fontWeight: 500, color: c, lineHeight: 1, marginBottom: 5 }),
  statLbl: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },
  alerta: { background: 'linear-gradient(135deg,rgba(245,158,11,.08),rgba(239,68,68,.04))', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12 },
  alertaIcon: { width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  alertaRadar: { background: 'linear-gradient(135deg,rgba(59,130,246,.07),rgba(6,182,212,.04))', border: '1px solid rgba(59,130,246,.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 12 },
  toolbar: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' },
  toolbarRow2: { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  search: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 220 },
  filtro: (on) => ({ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? 'rgba(59,130,246,.25)' : 'var(--border2)'}`, background: on ? 'var(--blue-dim)' : 'var(--subtle)', color: on ? 'var(--blue)' : 'var(--text2)', fontFamily: 'inherit' }),
  fselSm: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '5px 10px', color: 'var(--text2)', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', height: 30 },
  inputSm: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '5px 10px', color: 'var(--text2)', fontSize: 12, outline: 'none', fontFamily: 'inherit', height: 30, width: 130 },
  btn: { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  btnSm: { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnApropriar: { background: 'rgba(16,185,129,.1)', color: 'var(--green)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 },
  btnDanger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  btnLimpar: { background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: '0 4px' },
  btnGreen: { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro: { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  hintBox: { background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: 7, padding: '8px 14px', marginBottom: 14, fontSize: 12, color: 'var(--blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoBox: { background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--blue)' },
  geradorLayout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 22 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  regrasBox: { background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 },
  dataChip: (sel) => ({ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${sel ? 'rgba(59,130,246,.4)' : 'var(--border2)'}`, background: sel ? 'var(--blue-dim)' : 'var(--subtle)', color: sel ? 'var(--blue)' : 'var(--text2)', fontFamily: 'inherit', marginRight: 8, marginBottom: 8 }),
  sessaoRow: { display: 'grid', gridTemplateColumns: '130px 1fr 180px 60px', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' },
  chipReg: (match) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: match ? 'rgba(16,185,129,.1)' : 'var(--subtle)', color: match ? 'var(--green)' : 'var(--muted)', border: `1px solid ${match ? 'rgba(16,185,129,.2)' : 'var(--border2)'}`, marginRight: 4 }),
  respChip: (r) => {
    const m = { 'CONSULTOR TÉCNICO': ['var(--blue-dim)', 'var(--blue)'], 'ESPECIALISTA OU COORDENADOR': ['rgba(167,139,250,.1)', '#a78bfa'], 'EDUCAÇÃO': ['var(--green-dim)', 'var(--green)'] }
    const [bg, color] = m[r] || ['var(--subtle)', 'var(--muted)']
    return { display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: bg, color }
  },
}

const formVazio = { id_sgt: '', empresa: '', consultor: '', data_kickoff: '', horas: '', porte: 'Médio', status: 'aguardando_cronograma' }
const CARGO_COORDENADOR = 'coordenador'
const formVazio2 = null // placeholder
const geradorVazio = { kickoffId: '', empresa: '', id_sgt: '', porteConfig: 'Médio — 120h', localidade: '', dataAssinatura: '', dataKickoff: '', dataEncerramento: '', consultorSelecionado: '', espSelecionado: '' }

// ── COMPONENTE ────────────────────────────────────────────────────────────────
export default function Consultoria({ isAdmin = false }) {
  const [aba, setAba] = useState('kickoffs')
  const [kickoffs, setKickoffs] = useState([])
  const [consultores, setConsultores] = useState([])
  const [especialista, setEspecialista] = useState('')
  const [espOptions, setEspOptions] = useState([]) // especialista + coordenadores para o drop
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')
  const [filtroConsultor, setFiltroConsultor] = useState('')
  const [filtroDataDe, setFiltroDataDe] = useState('')
  const [filtroDataAte, setFiltroDataAte] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [gen, setGen] = useState(geradorVazio)
  const [sugestoesData, setSugestoesData] = useState([])
  const [rankingConsultores, setRankingConsultores] = useState([])
  const [sessoes, setSessoes] = useState([])
  const [gerandoXlsx, setGerandoXlsx] = useState(false)
  const [erroGen, setErroGen] = useState('')
  const [salvandoCronograma, setSalvandoCronograma] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const [kickRes, colabRes] = await Promise.all([
      supabase.from('kickoffs').select('*').order('data_kickoff', { ascending: false, nullsFirst: true }),
      supabase.from('colaboradores').select('id, nome, cargo, setor').eq('ativo', true).order('nome'),
    ])
    setKickoffs(kickRes.data || [])
    const colab = colabRes.data || []
    setConsultores(colab.filter(c => CARGOS_CONSULTOR.includes((c.cargo || '').toLowerCase().trim())))
    const esp = colab.find(c => (c.cargo || '').toLowerCase().trim() === CARGO_ESPECIALISTA)
    setEspecialista(esp?.nome || '')
    // ESP + coordenadores para o dropdown de ESP no gerador
    const espCoord = colab.filter(c => {
      const cargo = (c.cargo || '').toLowerCase().trim()
      return cargo === CARGO_ESPECIALISTA || cargo === CARGO_COORDENADOR
    })
    setEspOptions(espCoord)
    setLoading(false)
  }

  // ── KICK OFFS ───────────────────────────────────────────────────────────────
  function abrirNovo() { setEditando(null); setErro(''); setForm(formVazio); setModal(true) }
  function abrirEditar(r) {
    setEditando(r); setErro('')
    setForm({ id_sgt: r.id_sgt, empresa: r.empresa, consultor: r.consultor || '', data_kickoff: r.data_kickoff || '', horas: r.horas || '', porte: r.porte || 'Médio', status: r.status })
    setModal(true)
  }
  function setPorte(p) { setForm(f => ({ ...f, porte: p, horas: HORAS_POR_PORTE[p] || f.horas })) }
  const aguardandoCronograma = form.status === 'aguardando_cronograma'

  async function salvar() {
    if (!form.id_sgt.trim() || !form.empresa.trim()) { setErro('ID SGT e Empresa são obrigatórios.'); return }
    if (!aguardandoCronograma && !form.data_kickoff) { setErro('Data é obrigatória para este status.'); return }
    setSalvando(true); setErro('')
    const dados = { id_sgt: form.id_sgt.trim(), empresa: form.empresa.trim(), consultor: form.consultor || null, data_kickoff: form.data_kickoff || null, horas: parseFloat(form.horas) || null, porte: form.porte, status: form.status }
    let error
    if (editando) { ({ error } = await supabase.from('kickoffs').update(dados).eq('id', editando.id)) }
    else { ({ error } = await supabase.from('kickoffs').insert(dados)) }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModal(false); carregar()
  }

  async function apropriar(r) { await supabase.from('kickoffs').update({ status: 'apropriado' }).eq('id', r.id); carregar() }
  async function excluir(id) { if (!confirm('Excluir este kick off?')) return; await supabase.from('kickoffs').delete().eq('id', id); carregar() }
  function limparFiltros() { setFiltroConsultor(''); setFiltroDataDe(''); setFiltroDataAte(''); setBusca(''); setFiltro('') }

  const hoje = kickoffs.filter(k => isHoje(k.data_kickoff) && k.status === 'pendente')
  const proximos = kickoffs.filter(k => isFuturo(k.data_kickoff) && !isHoje(k.data_kickoff))
  const totalHoje = hoje.reduce((a, k) => a + (parseFloat(k.horas) || 0), 0)
  const semCronograma = kickoffs.filter(k => k.status === 'aguardando_cronograma')
  const temFiltroAtivo = filtroConsultor || filtroDataDe || filtroDataAte

  const filtrados = kickoffs.filter(r => {
    if (filtro === 'hoje' && !isHoje(r.data_kickoff)) return false
    if (filtro === 'pendente' && r.status !== 'pendente') return false
    if (filtro === 'apropriado' && r.status !== 'apropriado') return false
    if (filtro === 'proximos' && !isFuturo(r.data_kickoff)) return false
    if (filtro === 'aguardando_cronograma' && r.status !== 'aguardando_cronograma') return false
    if (filtroConsultor && r.consultor !== filtroConsultor) return false
    if (filtroDataDe && r.data_kickoff && r.data_kickoff < filtroDataDe) return false
    if (filtroDataAte && r.data_kickoff && r.data_kickoff > filtroDataAte) return false
    if (busca) { const b = busca.toLowerCase(); return r.id_sgt?.toLowerCase().includes(b) || r.empresa?.toLowerCase().includes(b) || r.consultor?.toLowerCase().includes(b) }
    return true
  })

  const trHover = { onMouseEnter: e => e.currentTarget.style.background = 'var(--subtle)', onMouseLeave: e => e.currentTarget.style.background = 'transparent' }

  // ── GERADOR ──────────────────────────────────────────────────────────────────
  function selecionarEmpresa(kickoffId) {
    const k = kickoffs.find(x => x.id === kickoffId)
    if (!k) { setGen(geradorVazio); return }
    const portePadrao = k.porte === 'Médio' ? 'Médio — 120h' : 'Micro/Pequeno — 80h'
    setGen({ ...geradorVazio, kickoffId, empresa: k.empresa, id_sgt: k.id_sgt, porteConfig: portePadrao, localidade: k.localidade_empresa || '', espSelecionado: especialista || '' })
    setSessoes([]); setSugestoesData([]); setRankingConsultores([]); setErroGen('')
    if (k.localidade_empresa) calcularRankingComLoc(k.localidade_empresa)
  }

  function calcularRankingComLoc(localidade) {
    const regiao = detectarRegiao(localidade)
    const ranking = [...consultores]
      .map(c => ({ ...c, score: scoreConsultor(c, regiao, kickoffs) }))
      .sort((a, b) => b.score - a.score)
    setRankingConsultores(ranking)
    return ranking
  }

  function aoMudarLocalidade(localidade) {
    setGen(g => ({ ...g, localidade }))
    const ranking = calcularRankingComLoc(localidade)
    if (ranking.length > 0) setGen(g => ({ ...g, localidade, consultorSelecionado: ranking[0].nome }))
  }

  function aoMudarAssinatura(dataAssinatura) {
    setGen(g => ({ ...g, dataAssinatura }))
    if (!dataAssinatura) return
    const config = CONFIG_PORTE[gen.porteConfig]
    const datas = proximasDatasKickoff(dataAssinatura)
    setSugestoesData(datas)
    if (datas.length > 0) {
      const enc = addDias(datas[0], config?.duracaoMin || 75)
      setGen(g => ({ ...g, dataAssinatura, dataKickoff: datas[0], dataEncerramento: enc }))
    }
  }

  function aoMudarDataKickoff(data) {
    const config = CONFIG_PORTE[gen.porteConfig]
    const enc = addDias(data, config?.duracaoMin || 75)
    setGen(g => ({ ...g, dataKickoff: data, dataEncerramento: enc }))
  }

  function gerarCronograma() {
    setErroGen('')
    if (!gen.empresa) { setErroGen('Selecione uma empresa.'); return }
    if (!gen.dataKickoff) { setErroGen('Informe a data do Kick Off.'); return }
    if (!gen.dataEncerramento) { setErroGen('Informe a data de encerramento.'); return }
    if (!gen.consultorSelecionado) { setErroGen('Selecione um consultor.'); return }
    const config = CONFIG_PORTE[gen.porteConfig]
    setSessoes(gerarSessoes(gen.dataKickoff, gen.dataEncerramento, config, gen.consultorSelecionado, gen.espSelecionado))
  }

  function editarSessao(id, campo, valor) {
    setSessoes(ss => ss.map(s => s.id === id ? { ...s, [campo]: valor } : s))
  }

  async function salvarCronograma() {
    if (sessoes.length === 0 || !gen.kickoffId) return
    setSalvandoCronograma(true)
    const { error: errK } = await supabase.from('kickoffs').update({
      consultor: gen.consultorSelecionado,
      data_kickoff: gen.dataKickoff,
      data_encerramento: gen.dataEncerramento,
      localidade_empresa: gen.localidade,
      horas: sessoes.filter(s => s.responsavel === 'CONSULTOR TÉCNICO').reduce((a, s) => a + s.horas, 0),
      status: 'pendente',
    }).eq('id', gen.kickoffId)
    if (errK) { setErroGen('Erro: ' + errK.message); setSalvandoCronograma(false); return }
    await supabase.from('kickoff_sessoes').delete().eq('kickoff_id', gen.kickoffId)
    const { error: errS } = await supabase.from('kickoff_sessoes').insert(
      sessoes.map(s => ({ kickoff_id: gen.kickoffId, data: s.data, atividade: s.atividade, responsavel: s.responsavel, horas: s.horas, horario: s.horario, formato: s.formato }))
    )
    setSalvandoCronograma(false)
    if (errS) { setErroGen('Erro ao salvar sessões: ' + errS.message); return }
    carregar()
    setGen(geradorVazio); setSessoes([]); setSugestoesData([]); setRankingConsultores([])
    alert('Cronograma salvo! A empresa foi movida para "Pendente".')
  }

  async function exportarXlsx() {
    if (sessoes.length === 0) return
    setGerandoXlsx(true)
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const wb = XLSX.utils.book_new()
      const config = CONFIG_PORTE[gen.porteConfig]
      const nomeConsultor = (gen.consultorSelecionado || 'CONSULTOR TÉCNICO').toUpperCase()
      const nomeEsp = (gen.espSelecionado || especialista || 'ESPECIALISTA OU COORDENADOR').toUpperCase()

      // ── Aba Cronograma (layout idêntico ao modelo) ──────────────────
      // Col: A(vazia) B(Mês) C(Etapa) D(Dia) E(Consultor) F(Entregas) G(Realizados) H(Horário) I(CH) J(Formato) K(CH Mês) L(CH Acum) M(%)
      const cronRows = [
        [null, null, null, null, null, 'CRONOGRAMA DE ATENDIMENTO', null, null, null, null, null, null, null],
        [null, 'Cliente', gen.empresa, null, null, null, null, null, null, null, null, null, null],
        [null, `${config.horasTotal} HORAS - FINALIZAÇÃO EM ${fmtData(gen.dataEncerramento)}`, null, null, null, null, null, null, null, null, null, null, null],
        [null, 'Mês', 'Etapa', 'Dia', 'Consultor ', 'Entregas programadas', 'Trabalhos realizados', 'Horário', 'CH Consultor', 'Formato', 'CH Mês', 'CH Acumulada', '% do Projeto '],
      ]

      // Agrupa sessões por mês para calcular CH Mês
      const mesesMap = {}
      sessoes.forEach(s => {
        const d = new Date(s.data + 'T00:00:00')
        const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const mesLabel = d.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' })
        const mesCapit = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)
        if (!mesesMap[mesKey]) mesesMap[mesKey] = { label: mesCapit, sessoes: [], chTotal: 0 }
        mesesMap[mesKey].sessoes.push(s)
        mesesMap[mesKey].chTotal += parseFloat(s.horas) || 0
      })

      let mesAnterior = ''
      let etapaAnterior = ''
      sessoes.forEach(s => {
        const d = new Date(s.data + 'T00:00:00')
        const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const mesLabel = mesesMap[mesKey].label
        const ehPrimeiroDoMes = mesLabel !== mesAnterior
        const ehPrimeiraDaEtapa = s.etapa !== etapaAnterior
        cronRows.push([
          null,
          ehPrimeiroDoMes ? mesLabel : null,
          ehPrimeiraDaEtapa ? s.etapa : null,
          d,  // Date object — SheetJS formata corretamente
          s.responsavel.toUpperCase(),
          s.atividade,
          null,
          s.horario,
          s.horas,
          s.formato,
          ehPrimeiroDoMes ? mesesMap[mesKey].chTotal : null,
          null,
          null,
        ])
        if (ehPrimeiroDoMes) mesAnterior = mesLabel
        if (ehPrimeiraDaEtapa) etapaAnterior = s.etapa
      })

      // Linha de total
      cronRows.push([null, null, null, null, null, null, null, null, config.horasTotal, null, config.horasTotal, null, null])

      const wsCron = XLSX.utils.aoa_to_sheet(cronRows)
      // Formatar coluna D (índice 3) como data
      const range = XLSX.utils.decode_range(wsCron['!ref'])
      for (let R = 4; R <= range.e.r; R++) {
        const cell = wsCron[XLSX.utils.encode_cell({ r: R, c: 3 })]
        if (cell && cell.v instanceof Date) {
          cell.t = 'd'; cell.z = 'DD/MM/YYYY'
        }
      }
      wsCron['!cols'] = [{ wch: 2 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 28 }, { wch: 65 }, { wch: 30 }, { wch: 16 }, { wch: 11 }, { wch: 11 }, { wch: 8 }, { wch: 12 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, wsCron, gen.empresa.slice(0, 28))

      // ── Abas REL ACO por mês (layout idêntico ao modelo) ──────────────
      Object.entries(mesesMap).forEach(([mesKey, { label, sessoes: sessMes, chTotal }], idx) => {
        const mesDate = new Date(mesKey + '-01T00:00:00')
        const relRows = [
          [null, null, null, 'RELATÓRIO DE ACOMPANHAMENTO DA CONSULTORIA', null, null, null, null, null],
          ['EMPRESA:', null, gen.empresa, null, null, null, null, null, null],
          ['PRODUTO:', null, 'Consultoria Eficiência Energética', null, null, null, null, null, null],
          ['MÊS/ANO:', null, mesDate, null, 'CONSULTOR(A):', nomeConsultor, null, null, null],
          ['DATA', 'DESCRIÇÃO DAS ATIVIDADES REALIZADAS NA CONSULTORIA', null, null, null, null, null, 'QUANT.HORAS', null],
        ]
        sessMes.forEach(s => {
          relRows.push([new Date(s.data + 'T00:00:00'), s.atividade, null, null, null, null, null, s.horas, null])
        })
        relRows.push(['Horas previstas na proposta:', null, null, null, config.horasTotal, 'Total de horas realizadas no mês:', null, null, chTotal])
        relRows.push(['Total de horas realizadas (acumulado):', null, null, null, null, 'Saldo de horas:', null, null, null])
        relRows.push(['Ações Pendentes', null, null, null, 'Responsável', null, 'Data Limite', null, 'Status'])
        relRows.push(['Próximas ações', null, null, null, 'Responsável', null, 'Data Limite', null, 'Status'])
        relRows.push(['Consultor(a)', null, null, null, null, 'Representante da Empresa', null, null, null])
        relRows.push([null, 'Data:      /         /', null, null, null, null, 'Data:      /         /', null, null])

        const wsRel = XLSX.utils.aoa_to_sheet(relRows)
        // Formatar datas na col A
        const rng = XLSX.utils.decode_range(wsRel['!ref'])
        for (let R = 4; R <= rng.e.r; R++) {
          const cell = wsRel[XLSX.utils.encode_cell({ r: R, c: 0 })]
          if (cell && cell.v instanceof Date) { cell.t = 'd'; cell.z = 'DD/MM/YYYY' }
        }
        // Formatar MÊS/ANO como data
        const cellMes = wsRel[XLSX.utils.encode_cell({ r: 3, c: 2 })]
        if (cellMes) { cellMes.t = 'd'; cellMes.z = 'MM/YYYY' }
        wsRel['!cols'] = [{ wch: 14 }, { wch: 48 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 14 }, { wch: 10 }, { wch: 12 }]
        const nomeAba = `REL ACO - ${label.slice(0, 3).charAt(0).toUpperCase() + label.slice(0, 3).slice(1)} `
        XLSX.utils.book_append_sheet(wb, wsRel, nomeAba + (idx + 1))
      })

      XLSX.writeFile(wb, `Cronograma_${gen.empresa.replace(/\s+/g, '_')}_${config.label}.xlsx`)
    } catch (e) { setErroGen('Erro ao exportar: ' + e.message) }
    setGerandoXlsx(false)
  }

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Consultoria</div>
          <div style={S.sub}>Acompanhamento de kick offs e apropriação de horas</div>
        </div>
        {aba === 'kickoffs' && isAdmin && (
          <button style={S.btn} onClick={abrirNovo}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Registro
          </button>
        )}
      </div>

      {/* ABAS */}
      <div style={S.abas}>
        <button style={S.aba(aba === 'kickoffs')} onClick={() => setAba('kickoffs')}>Kick Offs</button>
        <button style={S.aba(aba === 'gerador')} onClick={() => setAba('gerador')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Gerador de Cronograma
        </button>
      </div>

      {/* ══ ABA KICK OFFS ══════════════════════════════════════════════════════ */}
      {aba === 'kickoffs' && (<>
        {hoje.length > 0 && (
          <div style={S.alerta}>
            <div style={S.alertaIcon}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--amber,#f59e0b)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber,#f59e0b)', marginBottom: 3 }}>{hoje.length} kick off{hoje.length > 1 ? 's' : ''} hoje — apropriar {totalHoje}h</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Não esqueça de registrar as horas</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {hoje.map(k => <span key={k.id} style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--amber,#f59e0b)', fontWeight: 500 }}>{k.empresa}{k.consultor ? ` · ${k.consultor}` : ''} · {k.horas}h</span>)}
              </div>
            </div>
          </div>
        )}

        {semCronograma.length > 0 && (
          <div style={S.alertaRadar}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 3 }}>{semCronograma.length} empresa{semCronograma.length > 1 ? 's' : ''} aguardando cronograma</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Ainda sem data de kick off definida</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {semCronograma.map(k => <span key={k.id} style={{ background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--blue)', fontWeight: 500 }}>{k.empresa} · {k.id_sgt}</span>)}
              </div>
            </div>
          </div>
        )}

        <div style={S.stats}>
          {[['var(--blue)', kickoffs.length, 'Total'], ['var(--amber)', hoje.length, 'Hoje'], ['var(--red)', kickoffs.filter(k => k.status === 'pendente').length, 'Pendentes'], ['var(--green)', kickoffs.filter(k => k.status === 'apropriado').length, 'Apropriados'], ['var(--blue)', semCronograma.length, 'Ag. Cronograma'], ['var(--blue)', proximos.length, 'Próximos']].map(([cor, val, lbl]) => (
            <div key={lbl} style={S.statCard}>
              <div style={S.statVal(cor)}>{val}</div>
              <div style={S.statLbl}>{lbl}</div>
              <div style={S.statBar(cor)} />
            </div>
          ))}
        </div>

        <div style={S.toolbar}>
          <input style={S.search} placeholder="Buscar empresa, ID SGT, consultor..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button style={S.filtro(!filtro)} onClick={() => setFiltro('')}>Todos</button>
          <button style={S.filtro(filtro === 'aguardando_cronograma')} onClick={() => setFiltro('aguardando_cronograma')}>Ag. Cronograma</button>
          <button style={S.filtro(filtro === 'hoje')} onClick={() => setFiltro('hoje')}>Hoje</button>
          <button style={S.filtro(filtro === 'proximos')} onClick={() => setFiltro('proximos')}>Próximos</button>
          <button style={S.filtro(filtro === 'pendente')} onClick={() => setFiltro('pendente')}>Pendente</button>
          <button style={S.filtro(filtro === 'apropriado')} onClick={() => setFiltro('apropriado')}>Apropriado</button>
        </div>

        <div style={S.toolbarRow2}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Filtrar por:</span>
          <select style={S.fselSm} value={filtroConsultor} onChange={e => setFiltroConsultor(e.target.value)}>
            <option value="">Consultor — todos</option>
            {consultores.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
          <input type="date" style={S.inputSm} value={filtroDataDe} onChange={e => setFiltroDataDe(e.target.value)} />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>até</span>
          <input type="date" style={S.inputSm} value={filtroDataAte} onChange={e => setFiltroDataAte(e.target.value)} />
          {temFiltroAtivo && <button style={S.btnLimpar} onClick={limparFiltros}>limpar filtros</button>}
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>ID SGT</th><th style={S.th}>Empresa</th><th style={S.th}>Consultor</th>
              <th style={S.th}>Data Kick Off</th><th style={S.th}>Horas</th><th style={S.th}>Porte</th>
              <th style={S.th}>Status</th><th style={S.th}></th>
            </tr></thead>
            <tbody>
              {filtrados.map(r => {
                const hj = isHoje(r.data_kickoff)
                const cor = STATUS_COR[r.status] || 'var(--muted)'
                const porteCor = PORTE_COR[r.porte] || 'var(--muted)'
                const semData = r.status === 'aguardando_cronograma'
                return (
                  <tr key={r.id} {...trHover} style={{ background: hj ? 'rgba(245,158,11,.03)' : semData ? 'rgba(59,130,246,.02)' : undefined }}>
                    <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', color: 'var(--blue)', fontWeight: 500 }}>{r.id_sgt}</td>
                    <td style={{ ...S.td, color: 'var(--text)', fontWeight: 500 }}>{r.empresa}</td>
                    <td style={S.td}>{r.consultor || <span style={{ color: 'var(--border2)' }}>—</span>}</td>
                    <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                      {hj ? <span style={{ color: 'var(--amber,#f59e0b)', fontWeight: 700 }}>Hoje</span>
                        : semData ? <span style={{ color: 'var(--blue)', fontSize: 11, fontStyle: 'italic' }}>A definir</span>
                        : fmtData(r.data_kickoff)}
                    </td>
                    <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', color: '#a78bfa', fontWeight: 500 }}>{r.horas ? `${r.horas}h` : '—'}</td>
                    <td style={S.td}><span style={{ background: `${porteCor}18`, color: porteCor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{r.porte || '—'}</span></td>
                    <td style={S.td}><span style={{ background: `${cor}18`, color: cor, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>● {STATUS_LABEL[r.status] || r.status}</span></td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {r.status === 'pendente' && (
                          <button style={S.btnApropriar} onClick={() => apropriar(r)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Apropriar
                          </button>
                        )}
                        {r.status === 'aguardando_cronograma' && (
                          <button style={{ ...S.btnSm, color: 'var(--blue)', borderColor: 'rgba(59,130,246,.3)' }} onClick={() => { selecionarEmpresa(r.id); setAba('gerador') }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 3 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            Gerar
                          </button>
                        )}
                        {isAdmin && <button style={S.btnSm} onClick={() => abrirEditar(r)}>Editar</button>}
                        {isAdmin && <button style={S.btnDanger} onClick={() => excluir(r.id)}>✕</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{loading ? 'Carregando...' : 'Nenhum registro encontrado.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ══ ABA GERADOR ════════════════════════════════════════════════════════ */}
      {aba === 'gerador' && (
        <div style={S.geradorLayout}>
          {/* COLUNA ESQUERDA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={S.card}>
              <div style={S.cardTitle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                Empresa
              </div>
              <div style={S.field}>
                <label style={S.label}>Selecionar empresa (Ag. Cronograma)</label>
                <select style={S.fsel} value={gen.kickoffId} onChange={e => selecionarEmpresa(e.target.value)}>
                  <option value="">Selecione...</option>
                  {kickoffs.filter(k => k.status === 'aguardando_cronograma').map(k => (
                    <option key={k.id} value={k.id}>{k.empresa} — {k.id_sgt}</option>
                  ))}
                </select>
                {kickoffs.filter(k => k.status === 'aguardando_cronograma').length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Nenhuma empresa aguardando cronograma.</div>
                )}
              </div>

              {gen.empresa && (<>
                <div style={S.field}>
                  <label style={S.label}>Configuração de horas</label>
                  <select style={S.fsel} value={gen.porteConfig} onChange={e => setGen(g => ({ ...g, porteConfig: e.target.value }))}>
                    {Object.keys(CONFIG_PORTE).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                {CONFIG_PORTE[gen.porteConfig] && (
                  <div style={S.regrasBox}>
                    <strong style={{ color: 'var(--amber)' }}>{gen.porteConfig}:</strong> duração mínima <strong>{CONFIG_PORTE[gen.porteConfig].duracaoMin} dias</strong> · kick off em até <strong>60 dias</strong> da assinatura<br />
                    CT: <strong>{CONFIG_PORTE[gen.porteConfig].horasCT}h</strong> · Esp: <strong>{CONFIG_PORTE[gen.porteConfig].horasEsp}h</strong> · Edu: <strong>{CONFIG_PORTE[gen.porteConfig].horasEdu}h</strong>
                  </div>
                )}
                <div style={S.field}>
                  <label style={S.label}>Localidade da empresa</label>
                  <input style={S.input} value={gen.localidade} placeholder="Ex: Garanhuns, Caruaru, Recife, Tocantins..." onChange={e => aoMudarLocalidade(e.target.value)} />
                  {gen.localidade && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      Região detectada: <strong style={{ color: 'var(--text2)' }}>
                        {detectarRegiao(gen.localidade) === 'rmr' ? 'Grande Recife (RMR)'
                          : detectarRegiao(gen.localidade) === 'caruaru' ? 'Agreste (Caruaru)'
                          : detectarRegiao(gen.localidade) === 'araripina' ? 'Sertão (Araripina)'
                          : detectarRegiao(gen.localidade) === 'fora_pe' ? 'Fora de PE — todos concorrem'
                          : 'Não identificada — todos concorrem'}
                      </strong>
                    </div>
                  )}
                </div>
                <div style={S.field}>
                  <label style={S.label}>Data de assinatura da proposta</label>
                  <input type="date" style={S.input} value={gen.dataAssinatura} onChange={e => aoMudarAssinatura(e.target.value)} />
                </div>
              </>)}
            </div>

            {/* DATAS SUGERIDAS */}
            {sugestoesData.length > 0 && (
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Datas sugeridas para Kick Off
                </div>
                <div style={{ marginBottom: 12 }}>
                  {sugestoesData.map(d => (
                    <button key={d} style={S.dataChip(gen.dataKickoff === d)} onClick={() => aoMudarDataKickoff(d)}>{fmtData(d)}</button>
                  ))}
                </div>
                <div style={S.field}>
                  <label style={S.label}>Ou escolha outra data</label>
                  <input type="date" style={S.input} value={gen.dataKickoff} onChange={e => aoMudarDataKickoff(e.target.value)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Data de encerramento (editável)</label>
                  <input type="date" style={S.input} value={gen.dataEncerramento} onChange={e => setGen(g => ({ ...g, dataEncerramento: e.target.value }))} />
                </div>
                {gen.dataKickoff && gen.dataEncerramento && (() => {
                  const dias = Math.round((new Date(gen.dataEncerramento + 'T00:00:00') - new Date(gen.dataKickoff + 'T00:00:00')) / 86400000)
                  const minDias = CONFIG_PORTE[gen.porteConfig]?.duracaoMin || 75
                  const ok = dias >= minDias
                  return (
                    <div style={{ ...S.hintBox, borderColor: ok ? 'rgba(59,130,246,.15)' : 'rgba(239,68,68,.3)', background: ok ? 'rgba(59,130,246,.06)' : 'var(--red-dim)', color: ok ? 'var(--blue)' : 'var(--red)' }}>
                      <span>Duração total</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{dias} dias {ok ? '✓' : `⚠ mínimo ${minDias}`}</span>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* COLUNA DIREITA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* RANKING */}
            {rankingConsultores.length > 0 && (
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Consultores disponíveis
                </div>
                {rankingConsultores.slice(0, 4).map((c, i) => {
                  const ativas = kickoffs.filter(k => k.consultor === c.nome && k.status !== 'apropriado').length
                  const match = c.score >= 8
                  const sel = gen.consultorSelecionado === c.nome
                  return (
                    <div key={c.id} style={{ background: sel ? 'rgba(59,130,246,.06)' : match ? 'rgba(16,185,129,.04)' : 'var(--surface2)', border: `1px solid ${sel ? 'rgba(59,130,246,.3)' : match ? 'rgba(16,185,129,.2)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }} onClick={() => setGen(g => ({ ...g, consultorSelecionado: c.nome }))}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: sel ? 'var(--blue)' : match ? 'var(--green)' : 'var(--text)', fontSize: 13 }}>
                          {i === 0 ? '★ ' : ''}{c.nome}
                        </span>
                        {sel && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 7px', borderRadius: 4 }}>SELECIONADO</span>}
                      </div>
                      <div>
                        <span style={S.chipReg(match)}>{match ? '✓' : '~'} {c.setor || 'Sem setor'}</span>
                        <span style={S.chipReg(ativas < 3)}>{ativas} empresa{ativas !== 1 ? 's' : ''} ativa{ativas !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* SELEÇÃO DE ESPECIALISTA */}
            {gen.empresa && espOptions.length > 0 && (
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  Especialista / Coordenador
                </div>
                {espOptions.map(e => {
                  const sel = gen.espSelecionado === e.nome
                  return (
                    <div key={e.id} style={{ background: sel ? 'rgba(167,139,250,.08)' : 'var(--surface2)', border: `1px solid ${sel ? 'rgba(167,139,250,.3)' : 'var(--border)'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => setGen(g => ({ ...g, espSelecionado: e.nome }))}>
                      <span style={{ fontWeight: 600, color: sel ? '#a78bfa' : 'var(--text)', fontSize: 13 }}>{e.nome}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', background: 'var(--subtle)', padding: '2px 7px', borderRadius: 4 }}>{e.cargo}</span>
                        {sel && <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,.1)', padding: '1px 7px', borderRadius: 4 }}>SELECIONADO</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* BOTÃO GERAR */}
            {gen.empresa && gen.dataKickoff && gen.dataEncerramento && gen.consultorSelecionado && (
              <div style={S.card}>
                {erroGen && <div style={S.erro}>{erroGen}</div>}
                <button style={{ ...S.btn, width: '100%', justifyContent: 'center' }} onClick={gerarCronograma}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Gerar Cronograma
                </button>
              </div>
            )}

            {/* SESSÕES */}
            {sessoes.length > 0 && (
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {sessoes.length} sessões · {sessoes.reduce((a, s) => a + (parseFloat(s.horas) || 0), 0)}h total
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={S.btnGreen} onClick={exportarXlsx} disabled={gerandoXlsx}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      {gerandoXlsx ? 'Exportando...' : '.xlsx'}
                    </button>
                    <button style={S.btn} onClick={salvarCronograma} disabled={salvandoCronograma}>
                      {salvandoCronograma ? 'Salvando...' : 'Salvar no sistema'}
                    </button>
                  </div>
                </div>

                <div style={{ ...S.sessaoRow, paddingBottom: 6, marginBottom: 2 }}>
                  {['Data', 'Atividade', 'Responsável', 'Horas'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</span>)}
                </div>
                {sessoes.map(s => (
                  <div key={s.id} style={S.sessaoRow}>
                    <input type="date" style={{ ...S.input, padding: '5px 8px', fontSize: 12 }} value={s.data} onChange={e => editarSessao(s.id, 'data', e.target.value)} />
                    <input style={{ ...S.input, padding: '5px 8px', fontSize: 12 }} value={s.atividade} onChange={e => editarSessao(s.id, 'atividade', e.target.value)} />
                    <select style={{ ...S.fsel, padding: '5px 8px', fontSize: 11 }} value={s.responsavel} onChange={e => editarSessao(s.id, 'responsavel', e.target.value)}>
                      <option value={gen.consultorSelecionado}>{gen.consultorSelecionado} (CT)</option>
                      {espOptions.map(e => <option key={e.id} value={e.nome}>{e.nome} ({e.cargo})</option>)}
                      <option value={gen.consultorSelecionado + '_EDU'}>{gen.consultorSelecionado} · Educação</option>
                    </select>
                    <input type="number" step="0.5" min="1" style={{ ...S.input, padding: '5px 8px', fontSize: 12 }} value={s.horas} onChange={e => editarSessao(s.id, 'horas', parseFloat(e.target.value))} />
                  </div>
                ))}

                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12 }}>
                  {[['CT', 'var(--blue-dim)', 'var(--blue)'], ['ESP', 'rgba(167,139,250,.1)', '#a78bfa'], ['EDU', 'var(--green-dim)', 'var(--green)']].map(([tipo, bg, color]) => {
                    const h = sessoes.filter(s => s.tipoResp === tipo).reduce((a, s) => a + (parseFloat(s.horas) || 0), 0)
                    if (!h) return null
                    return (
                      <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: bg, color }}>{tipo}</span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--text)' }}>{h}h</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {sessoes.length === 0 && !gen.empresa && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: 12, color: 'var(--muted)', fontSize: 13, flexDirection: 'column', gap: 10 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Selecione uma empresa para começar
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL FORM */}
      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editando ? 'Editar Registro' : 'Novo Registro'}</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.field}><label style={S.label}>Status</label>
              <select style={S.fsel} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="aguardando_cronograma">Aguardando Cronograma</option>
                <option value="pendente">Pendente</option>
                <option value="apropriado">Apropriado</option>
              </select>
            </div>
            {aguardandoCronograma && <div style={S.infoBox}>Data e consultor podem ser preenchidos depois, quando o cronograma for definido.</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>ID SGT *</label><input style={S.input} value={form.id_sgt} onChange={e => setForm({ ...form, id_sgt: e.target.value })} placeholder="713154" /></div>
              <div style={S.field}><label style={S.label}>Porte</label>
                <select style={S.fsel} value={form.porte} onChange={e => setPorte(e.target.value)}>
                  {PORTES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={S.field}><label style={S.label}>Empresa *</label><input style={S.input} value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} placeholder="Nome da empresa" /></div>
            <div style={S.fieldRow}>
              <div style={S.field}>
                <label style={S.label}>Consultor {aguardandoCronograma ? '(opcional)' : ''}</label>
                <select style={S.fsel} value={form.consultor} onChange={e => setForm({ ...form, consultor: e.target.value })}>
                  <option value="">Selecione...</option>
                  {consultores.length > 0 ? consultores.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>) : <option disabled>Nenhum consultor técnico cadastrado</option>}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Data do Kick Off {aguardandoCronograma ? '(opcional)' : '*'}</label>
                <input type="date" style={S.input} value={form.data_kickoff} onChange={e => setForm({ ...form, data_kickoff: e.target.value })} />
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Horas a Apropriar {aguardandoCronograma ? '(opcional)' : ''}</label>
              <input type="number" step="0.5" min="0.5" style={S.input} value={form.horas} onChange={e => setForm({ ...form, horas: e.target.value })} placeholder="Ex: 4" />
            </div>
            {form.horas && <div style={S.hintBox}><span>Carga a apropriar</span><span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{form.horas}h</span></div>}
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModal(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
