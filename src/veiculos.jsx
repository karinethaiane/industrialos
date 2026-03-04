import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  wrap: { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub: { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 22 },
  statCard: (cor) => ({ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px var(--shadow)' }),
  statBar: (cor) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: cor, opacity: .5 }),
  statVal: (cor) => ({ fontFamily: 'DM Mono, monospace', fontSize: 26, fontWeight: 500, color: cor, lineHeight: 1, marginBottom: 5 }),
  statLbl: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 },
  tab: (on) => ({ padding: '9px 18px', fontSize: 13, fontWeight: on ? 600 : 500, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: on ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, fontFamily: 'inherit', transition: 'all .15s' }),
  btn: { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px var(--blue-glow)', whiteSpace: 'nowrap' },
  btnSm: { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  btnWarn: { background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid transparent', borderRadius: 6, padding: '5px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnTeal: { background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid transparent', borderRadius: 6, padding: '5px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px var(--shadow)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' },
  td: { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 18, marginBottom: 12, boxShadow: '0 1px 4px var(--shadow)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  placa: { fontFamily: 'DM Mono, monospace', fontWeight: 500, fontSize: 16, color: 'var(--blue)', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: 6 },
  modelo: { fontSize: 12, color: 'var(--muted)', marginTop: 3 },
  cardInfo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8, marginBottom: 12 },
  infoBox: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px' },
  infoLbl: { fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 },
  infoVal: { fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text)', fontWeight: 500 },
  kmBar: { background: 'var(--surface2)', borderRadius: 3, height: 4, overflow: 'hidden', border: '1px solid var(--border)' },
  kmFill: (pct, cor) => ({ height: '100%', borderRadius: 3, background: cor, width: `${Math.min(pct, 100)}%`, transition: 'width .3s' }),
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 6 },
  modalSub: { fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  textarea: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', minHeight: 70, resize: 'vertical' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro: { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  proxBox: { background: 'var(--surface2)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 14 },
  proxLbl: { fontSize: 11, color: 'var(--blue)', fontWeight: 700, marginBottom: 4 },
  infoBoxWarn: { background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: 'var(--amber)', marginBottom: 14 },
}

function badge(s) {
  const cfg = {
    disponivel: { bg: 'var(--green-dim)', c: 'var(--green)', l: '● Disponível' },
    em_uso: { bg: 'var(--amber-dim)', c: 'var(--amber)', l: '● Em Uso' },
    manutencao: { bg: 'var(--red-dim)', c: 'var(--red)', l: '● Manutenção' },
  }[s] || { bg: 'var(--subtle)', c: 'var(--muted)', l: s }
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.c }}>{cfg.l}</span>
}

function badgeSm(label, cor) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${cor}18`, color: cor }}>{label}</span>
}

function ocBadge(s) {
  const sl = (s || '').toLowerCase()
  const cfg = { resolvido: 'var(--green)', 'em andamento': 'var(--amber)', aberto: 'var(--red)' }[sl] || 'var(--muted)'
  const label = { resolvido: 'Resolvido', 'em andamento': 'Em andamento', aberto: 'Aberto' }[sl] || s || 'Aberto'
  return <span style={{ background: `${cfg}18`, color: cfg, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{label}</span>
}

function fmtData(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
function fmtKm(k) { if (!k && k !== 0) return '—'; return Number(k).toLocaleString('pt-BR') + ' km' }
function addMeses(data, meses) { const d = new Date(data); d.setMonth(d.getMonth() + meses); return d.toISOString().split('T')[0] }

export default function Veiculos({ isAdmin = false }) {
  const [veiculos, setVeiculos] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [saidas, setSaidas] = useState([])
  const [revisoes, setRevisoes] = useState([])
  const [ocorrencias, setOcorrencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('veiculos')
  const [modalVeiculo, setModalVeiculo] = useState(false)
  const [editandoVeiculo, setEditandoVeiculo] = useState(null)
  const [modalSaida, setModalSaida] = useState(null)
  const [editandoSaida, setEditandoSaida] = useState(null)
  const [modalRetorno, setModalRetorno] = useState(null)
  const [modalRevisao, setModalRevisao] = useState(null)
  const [editandoRevisao, setEditandoRevisao] = useState(null)
  const [modalOcorrencia, setModalOcorrencia] = useState(null)
  const [modalOcorrenciaDetalhe, setModalOcorrenciaDetalhe] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [formV, setFormV] = useState({ placa: '', modelo: '', marca: '', ano: '', cor: '', km_atual: '', intervalo_revisao_km: 10000, intervalo_revisao_meses: 6, regiao: '', modalidade: '', observacoes: '' })
  const [formS, setFormS] = useState({ colaborador_id: '', empresa_destino: '', local_destino: '', periodo: '', data_saida: '' })
  const [formRet, setFormRet] = useState({ data_retorno: '', km_retorno: '', observacoes: '' })
  const [formRev, setFormRev] = useState({ tipo: '', data_revisao: '', km_revisao: '', oficina: '', numero_chamado: '', responsavel_id: '', descricao: '' })
  const [formOc, setFormOc] = useState({ colaborador_id: '', tipo: '', data_ocorrencia: '', descricao: '', valor: '' })
  const [formOcDet, setFormOcDet] = useState({ autor_id: '', data_identificacao: '', data_pagamento: '', observacao_resolucao: '', status: '' })

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    const [v, col, s, r, o] = await Promise.all([
      supabase.from('veiculos').select('*').order('placa'),
      supabase.from('colaboradores').select('*').eq('ativo', true).order('nome'),
      supabase.from('saidas_veiculos').select('*, veiculos(placa,modelo), colaboradores(nome)').order('data_saida', { ascending: false }),
      supabase.from('revisoes_veiculos').select('*, veiculos(placa,modelo), responsavel:responsavel_id(nome)').order('data_revisao', { ascending: false }),
      supabase.from('ocorrencias_veiculos').select('*, veiculos(placa,modelo), colaboradores(nome), autor:autor_id(nome)').order('data_ocorrencia', { ascending: false }),
    ])
    setVeiculos(v.data || []); setColaboradores(col.data || []); setSaidas(s.data || []); setRevisoes(r.data || []); setOcorrencias(o.data || [])
    setLoading(false)
  }

  function abrirNovoVeiculo() { setEditandoVeiculo(null); setErro(''); setFormV({ placa: '', modelo: '', marca: '', ano: '', cor: '', km_atual: '', intervalo_revisao_km: 10000, intervalo_revisao_meses: 6, regiao: '', modalidade: '', observacoes: '' }); setModalVeiculo(true) }
  function abrirEditarVeiculo(v) { setEditandoVeiculo(v); setErro(''); setFormV({ placa: v.placa, modelo: v.modelo, marca: v.marca || '', ano: v.ano || '', cor: v.cor || '', km_atual: v.km_atual || '', intervalo_revisao_km: v.intervalo_revisao_km || 10000, intervalo_revisao_meses: v.intervalo_revisao_meses || 6, regiao: v.regiao || '', modalidade: v.modalidade || '', observacoes: v.observacoes || '' }); setModalVeiculo(true) }

  async function salvarVeiculo() {
    if (!formV.placa || !formV.modelo) { setErro('Placa e Modelo são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const km = parseInt(formV.km_atual) || 0
    const dados = { placa: formV.placa.toUpperCase().trim(), modelo: formV.modelo.trim(), marca: formV.marca.trim(), ano: parseInt(formV.ano) || null, cor: formV.cor.trim(), km_atual: km, intervalo_revisao_km: parseInt(formV.intervalo_revisao_km), intervalo_revisao_meses: parseInt(formV.intervalo_revisao_meses), regiao: formV.regiao || null, modalidade: formV.modalidade || null, observacoes: formV.observacoes }
    let error
    if (editandoVeiculo) { ({ error } = await supabase.from('veiculos').update(dados).eq('id', editandoVeiculo.id)) }
    else { ({ error } = await supabase.from('veiculos').insert({ ...dados, km_proxima_revisao: km + parseInt(formV.intervalo_revisao_km), status: 'disponivel' })) }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModalVeiculo(false); setEditandoVeiculo(null); init()
  }

  async function excluirVeiculo(id) { if (!confirm('Excluir este veículo? Todos os registros associados serão removidos.')) return; await supabase.from('veiculos').delete().eq('id', id); init() }

  async function salvarSaida(veiculoId) {
    if (!formS.colaborador_id || !formS.data_saida) return
    setSalvando(true)
    if (editandoSaida) {
      await supabase.from('saidas_veiculos').update({ colaborador_id: formS.colaborador_id, empresa_destino: formS.empresa_destino, local_destino: formS.local_destino, periodo: formS.periodo, data_saida: formS.data_saida }).eq('id', editandoSaida.id)
    } else {
      const { error } = await supabase.from('saidas_veiculos').insert({ veiculo_id: veiculoId, colaborador_id: formS.colaborador_id, empresa_destino: formS.empresa_destino, local_destino: formS.local_destino, periodo: formS.periodo, data_saida: formS.data_saida })
      if (!error) await supabase.from('veiculos').update({ status: 'em_uso' }).eq('id', veiculoId)
    }
    setFormS({ colaborador_id: '', empresa_destino: '', local_destino: '', periodo: '', data_saida: '' }); setModalSaida(null); setEditandoSaida(null); setSalvando(false); init()
  }

  async function excluirSaida(s) { if (!confirm('Excluir este registro?')) return; await supabase.from('saidas_veiculos').delete().eq('id', s.id); if (!s.data_retorno) await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', s.veiculo_id); init() }

  async function salvarRetorno(saida) {
    if (!formRet.data_retorno) return
    setSalvando(true)
    const km = parseInt(formRet.km_retorno) || null
    await supabase.from('saidas_veiculos').update({ data_retorno: formRet.data_retorno, km_retorno: km, observacoes: formRet.observacoes }).eq('id', saida.id)
    const updates = { status: 'disponivel' }
    if (km) { updates.km_atual = km }
    await supabase.from('veiculos').update(updates).eq('id', saida.veiculo_id)
    setFormRet({ data_retorno: '', km_retorno: '', observacoes: '' }); setModalRetorno(null); setSalvando(false); init()
  }

  async function salvarRevisao(veiculo) {
    if (!formRev.tipo || !formRev.data_revisao) return
    setSalvando(true)
    const km = parseInt(formRev.km_revisao) || veiculo.km_atual || 0
    const isPreventiva = formRev.tipo === 'Preventiva'
    const proxKm = km + (veiculo.intervalo_revisao_km || 10000)
    const proxData = addMeses(formRev.data_revisao, veiculo.intervalo_revisao_meses || 6)
    if (editandoRevisao) {
      await supabase.from('revisoes_veiculos').update({
        tipo: formRev.tipo, data_revisao: formRev.data_revisao, km_revisao: km,
        km_proxima_revisao: isPreventiva ? proxKm : editandoRevisao.km_proxima_revisao,
        data_proxima_revisao: isPreventiva ? proxData : editandoRevisao.data_proxima_revisao,
        oficina: formRev.oficina || null, numero_chamado: formRev.numero_chamado || null,
        responsavel_id: formRev.responsavel_id || null, descricao: formRev.descricao || null
      }).eq('id', editandoRevisao.id)
    } else {
      const { error } = await supabase.from('revisoes_veiculos').insert({
        veiculo_id: veiculo.id, tipo: formRev.tipo, data_revisao: formRev.data_revisao, km_revisao: km,
        km_proxima_revisao: isPreventiva ? proxKm : veiculo.km_proxima_revisao,
        data_proxima_revisao: isPreventiva ? proxData : veiculo.data_proxima_revisao,
        oficina: formRev.oficina || null, numero_chamado: formRev.numero_chamado || null,
        responsavel_id: formRev.responsavel_id || null, descricao: formRev.descricao || null
      })
      if (error) { alert('Erro: ' + error.message); setSalvando(false); return }
      const veiculoUpdate = { km_atual: km }
      if (isPreventiva) { veiculoUpdate.km_proxima_revisao = proxKm; veiculoUpdate.data_proxima_revisao = proxData }
      await supabase.from('veiculos').update(veiculoUpdate).eq('id', veiculo.id)
    }
    setFormRev({ tipo: '', data_revisao: '', km_revisao: '', oficina: '', numero_chamado: '', responsavel_id: '', descricao: '' })
    setModalRevisao(null); setEditandoRevisao(null); setSalvando(false); init()
  }

  async function excluirRevisao(id) { if (!confirm('Excluir este registro?')) return; await supabase.from('revisoes_veiculos').delete().eq('id', id); init() }

  async function salvarOcorrencia(veiculoId) {
    if (!formOc.tipo || !formOc.data_ocorrencia) return
    setSalvando(true)
    const payload = {
      veiculo_id: veiculoId,
      tipo: formOc.tipo,
      data_ocorrencia: formOc.data_ocorrencia,
      descricao: formOc.descricao || null,
      valor: formOc.valor ? parseFloat(formOc.valor) : null,
      status: 'aberto',
      colaborador_id: formOc.colaborador_id || null,
    }
    const { error } = await supabase.from('ocorrencias_veiculos').insert(payload)
    if (error) { alert('Erro ao salvar: ' + error.message); setSalvando(false); return }
    setFormOc({ colaborador_id: '', tipo: '', data_ocorrencia: '', descricao: '', valor: '' })
    setModalOcorrencia(null); setSalvando(false); init()
  }

  async function salvarDetalheOcorrencia(ocorrencia) {
    setSalvando(true)
    const { error } = await supabase.from('ocorrencias_veiculos').update({
      autor_id: formOcDet.autor_id || null,
      data_identificacao: formOcDet.data_identificacao || null,
      data_pagamento: formOcDet.data_pagamento || null,
      observacao_resolucao: formOcDet.observacao_resolucao || null,
      status: formOcDet.status || ocorrencia.status
    }).eq('id', ocorrencia.id)
    if (error) { alert('Erro: ' + error.message); setSalvando(false); return }
    setModalOcorrenciaDetalhe(null); setSalvando(false); init()
  }

  async function excluirOcorrencia(id) { if (!confirm('Excluir esta ocorrência?')) return; await supabase.from('ocorrencias_veiculos').delete().eq('id', id); init() }

  const saidasAbertas = saidas.filter(s => !s.data_retorno)
  const revisoesPendentes = veiculos.filter(v => {
    if (v.km_proxima_revisao && v.km_atual >= v.km_proxima_revisao - 500) return true
    if (v.data_proxima_revisao && new Date(v.data_proxima_revisao) <= new Date(Date.now() + 30 * 86400000)) return true
    return false
  })

  const trHover = { onMouseEnter: e => e.currentTarget.style.background = 'var(--subtle)', onMouseLeave: e => e.currentTarget.style.background = 'transparent' }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div><div style={S.title}>Gestão de Veículos</div><div style={S.sub}>Frota e controle de manutenções</div></div>
        {isAdmin && <button style={S.btn} onClick={abrirNovoVeiculo}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Novo Veículo</button>}
      </div>

      <div style={S.stats}>
        {[['var(--blue)', veiculos.length, 'Veículos'], ['var(--green)', veiculos.filter(v => v.status === 'disponivel').length, 'Disponíveis'], ['var(--amber)', saidasAbertas.length, 'Em Uso'], ['var(--red)', revisoesPendentes.length, 'Revisão Próxima'], ['var(--purple)', ocorrencias.filter(o => (o.status||'').toLowerCase() === 'aberto').length, 'Ocorrências']].map(([cor, val, lbl]) => (
          <div key={lbl} style={S.statCard(cor)}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

      <div style={S.tabs}>
        {[['veiculos','Veículos'],['saidas','Saídas/Retornos'],['revisoes','Revisões'],['ocorrencias','Ocorrências']].map(([id, lbl]) => (
          <button key={id} style={S.tab(aba === id)} onClick={() => setAba(id)}>{lbl}</button>
        ))}
      </div>

      {aba === 'veiculos' && (
        loading ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Carregando...</div> :
        veiculos.length === 0 ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Nenhum veículo cadastrado.</div> :
        veiculos.map(v => {
          const pct = v.km_proxima_revisao ? ((v.km_atual - (v.km_proxima_revisao - v.intervalo_revisao_km)) / v.intervalo_revisao_km) * 100 : 0
          const cor = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'linear-gradient(90deg, var(--blue), var(--teal))'
          const saidaAberta = saidas.find(s => s.veiculo_id === v.id && !s.data_retorno)
          return (
            <div key={v.id} style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <div style={S.placa}>{v.placa} {v.modalidade && badgeSm(v.modalidade, v.modalidade === 'Frota' ? 'var(--teal)' : 'var(--blue)')}</div>
                  <div style={S.modelo}>{v.marca} {v.modelo} {v.ano && `· ${v.ano}`} {v.cor && `· ${v.cor}`} {v.regiao && `· ${v.regiao}`}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {badge(v.status)}
                  {isAdmin && <button style={S.btnSm} onClick={() => abrirEditarVeiculo(v)}>Editar</button>}
                  {isAdmin && <button style={S.btnDanger} onClick={() => excluirVeiculo(v.id)}>Excluir</button>}
                </div>
              </div>
              <div style={S.cardInfo}>
                <div style={S.infoBox}><div style={S.infoLbl}>KM Atual</div><div style={S.infoVal}>{fmtKm(v.km_atual)}</div></div>
                <div style={S.infoBox}><div style={S.infoLbl}>Próxima Revisão KM</div><div style={{ ...S.infoVal, color: v.km_atual >= (v.km_proxima_revisao - 500) ? 'var(--red)' : 'var(--text)' }}>{fmtKm(v.km_proxima_revisao)}</div></div>
                <div style={S.infoBox}><div style={S.infoLbl}>Próxima Revisão Data</div><div style={{ ...S.infoVal, color: v.data_proxima_revisao && new Date(v.data_proxima_revisao) <= new Date(Date.now() + 30*86400000) ? 'var(--red)' : 'var(--text)' }}>{fmtData(v.data_proxima_revisao)}</div></div>
                {saidaAberta && <div style={{ ...S.infoBox, borderColor: 'rgba(245,158,11,.3)' }}><div style={S.infoLbl}>Em uso por</div><div style={{ ...S.infoVal, color: 'var(--amber)' }}>{saidaAberta.colaboradores?.nome}</div></div>}
              </div>
              {v.km_proxima_revisao > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Progresso até próxima revisão: {fmtKm(v.km_proxima_revisao - v.km_atual)} restantes</div>
                  <div style={S.kmBar}><div style={S.kmFill(pct, cor)} /></div>
                </div>
              )}
              {isAdmin && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {v.status === 'disponivel' && <button style={S.btnWarn} onClick={() => { setModalSaida(v); setEditandoSaida(null); setFormS({ colaborador_id: '', empresa_destino: '', local_destino: '', periodo: '', data_saida: new Date().toISOString().split('T')[0] }) }}>Registrar Saída</button>}
                  {saidaAberta && <button style={S.btnTeal} onClick={() => { setModalRetorno(saidaAberta); setFormRet({ data_retorno: new Date().toISOString().split('T')[0], km_retorno: '', observacoes: '' }) }}>Registrar Retorno</button>}
                  <button style={S.btnSm} onClick={() => { setModalRevisao(v); setEditandoRevisao(null); setFormRev({ tipo: '', data_revisao: new Date().toISOString().split('T')[0], km_revisao: v.km_atual || '', oficina: '', numero_chamado: '', responsavel_id: '', descricao: '' }) }}>+ Revisão</button>
                  <button style={S.btnSm} onClick={() => { setModalOcorrencia(v); setFormOc({ colaborador_id: '', tipo: '', data_ocorrencia: new Date().toISOString().split('T')[0], descricao: '', valor: '' }) }}>+ Ocorrência</button>
                </div>
              )}
            </div>
          )
        })
      )}

      {aba === 'saidas' && (
        <div style={S.tableWrap}><table style={S.table}>
          <thead><tr>
            <th style={S.th}>Veículo</th><th style={S.th}>Colaborador</th><th style={S.th}>Destino</th>
            <th style={S.th}>Período</th><th style={S.th}>Saída</th><th style={S.th}>Retorno</th>
            <th style={S.th}>KM Retorno</th><th style={S.th}>Status</th>
            {isAdmin && <th style={S.th}></th>}
          </tr></thead>
          <tbody>
            {saidas.map(s => (
              <tr key={s.id} {...trHover}>
                <td style={{ ...S.td, color: 'var(--blue)', fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>{s.veiculos?.placa}<div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.veiculos?.modelo}</div></td>
                <td style={{ ...S.td, color: 'var(--text)' }}>{s.colaboradores?.nome || '—'}</td>
                <td style={S.td}>{[s.empresa_destino, s.local_destino].filter(Boolean).join(' · ') || '—'}</td>
                <td style={S.td}>{s.periodo || '—'}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(s.data_saida)}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(s.data_retorno)}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtKm(s.km_retorno)}</td>
                <td style={S.td}>{s.data_retorno ? <span style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Retornado</span> : <span style={{ background: 'var(--amber-dim)', color: 'var(--amber)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Em uso</span>}</td>
                {isAdmin && <td style={S.td}><div style={{ display: 'flex', gap: 4 }}><button style={S.btnSm} onClick={() => { setEditandoSaida(s); setModalSaida(veiculos.find(v => v.id === s.veiculo_id)); setFormS({ colaborador_id: s.colaborador_id || '', empresa_destino: s.empresa_destino || '', local_destino: s.local_destino || '', periodo: s.periodo || '', data_saida: s.data_saida || '' }) }}>Editar</button><button style={S.btnDanger} onClick={() => excluirSaida(s)}>✕</button></div></td>}
              </tr>
            ))}
            {saidas.length === 0 && <tr><td colSpan={isAdmin ? 9 : 8} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Nenhuma saída registrada.</td></tr>}
          </tbody>
        </table></div>
      )}

      {aba === 'revisoes' && (
        <div style={S.tableWrap}><table style={S.table}>
          <thead><tr>
            <th style={S.th}>Veículo</th><th style={S.th}>Tipo</th><th style={S.th}>Data</th>
            <th style={S.th}>KM</th><th style={S.th}>Próxima KM</th><th style={S.th}>Próxima Data</th>
            <th style={S.th}>Oficina</th><th style={S.th}>Chamado</th><th style={S.th}>Responsável</th>
            {isAdmin && <th style={S.th}></th>}
          </tr></thead>
          <tbody>
            {revisoes.map(r => (
              <tr key={r.id} {...trHover}>
                <td style={{ ...S.td, color: 'var(--blue)', fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>{r.veiculos?.placa}<div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.veiculos?.modelo}</div></td>
                <td style={S.td}><span style={{ background: r.tipo === 'Preventiva' ? 'var(--green-dim)' : 'var(--amber-dim)', color: r.tipo === 'Preventiva' ? 'var(--green)' : 'var(--amber)', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{r.tipo}</span></td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(r.data_revisao)}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtKm(r.km_revisao)}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtKm(r.km_proxima_revisao)}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>{fmtData(r.data_proxima_revisao)}</td>
                <td style={S.td}>{r.oficina || '—'}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--purple)' }}>{r.numero_chamado || '—'}</td>
                <td style={S.td}>{r.responsavel?.nome || '—'}</td>
                {isAdmin && <td style={S.td}><div style={{ display: 'flex', gap: 4 }}><button style={S.btnSm} onClick={() => { setEditandoRevisao(r); const v = veiculos.find(x => x.id === r.veiculo_id); setModalRevisao(v); setFormRev({ tipo: r.tipo, data_revisao: r.data_revisao, km_revisao: r.km_revisao || '', oficina: r.oficina || '', numero_chamado: r.numero_chamado || '', responsavel_id: r.responsavel_id || '', descricao: r.descricao || '' }) }}>Editar</button><button style={S.btnDanger} onClick={() => excluirRevisao(r.id)}>✕</button></div></td>}
              </tr>
            ))}
            {revisoes.length === 0 && <tr><td colSpan={isAdmin ? 10 : 9} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Nenhuma revisão registrada.</td></tr>}
          </tbody>
        </table></div>
      )}

      {aba === 'ocorrencias' && (
        <div style={S.tableWrap}><table style={S.table}>
          <thead><tr>
            <th style={S.th}>Veículo</th><th style={S.th}>Tipo</th><th style={S.th}>Data</th>
            <th style={S.th}>Colaborador</th><th style={S.th}>Autor</th><th style={S.th}>Valor</th>
            <th style={S.th}>Status</th><th style={S.th}></th>
          </tr></thead>
          <tbody>
            {ocorrencias.map(o => (
              <tr key={o.id} {...trHover}>
                <td style={{ ...S.td, color: 'var(--blue)', fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>{o.veiculos?.placa}<div style={{ fontSize: 11, color: 'var(--muted)' }}>{o.veiculos?.modelo}</div></td>
                <td style={{ ...S.td, color: 'var(--text)' }}>{o.tipo}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtData(o.data_ocorrencia)}</td>
                <td style={S.td}>{o.colaboradores?.nome || '—'}</td>
                <td style={S.td}>{o.autor?.nome || '—'}</td>
                <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--red)' }}>{o.valor ? `R$ ${o.valor.toFixed(2)}` : '—'}</td>
                <td style={S.td}>{ocBadge(o.status)}</td>
                <td style={S.td}><div style={{ display: 'flex', gap: 4 }}>
                  {isAdmin && <button style={S.btnSm} onClick={() => { setModalOcorrenciaDetalhe(o); setFormOcDet({ autor_id: o.autor_id || '', data_identificacao: o.data_identificacao || '', data_pagamento: o.data_pagamento || '', observacao_resolucao: o.observacao_resolucao || '', status: o.status || 'aberto' }) }}>Acompanhar</button>}
                  {isAdmin && <button style={S.btnDanger} onClick={() => excluirOcorrencia(o.id)}>✕</button>}
                </div></td>
              </tr>
            ))}
            {ocorrencias.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Nenhuma ocorrência registrada.</td></tr>}
          </tbody>
        </table></div>
      )}

      {modalVeiculo && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalVeiculo(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoVeiculo ? 'Editar Veículo' : 'Novo Veículo'}</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Placa *</label><input style={S.input} value={formV.placa} onChange={e => setFormV({ ...formV, placa: e.target.value })} placeholder="ABC-1234" /></div>
              <div style={S.field}><label style={S.label}>Ano</label><input style={S.input} value={formV.ano} onChange={e => setFormV({ ...formV, ano: e.target.value })} placeholder="2022" /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Marca</label><input style={S.input} value={formV.marca} onChange={e => setFormV({ ...formV, marca: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Modelo *</label><input style={S.input} value={formV.modelo} onChange={e => setFormV({ ...formV, modelo: e.target.value })} /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Cor</label><input style={S.input} value={formV.cor} onChange={e => setFormV({ ...formV, cor: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>KM Atual</label><input type="number" style={S.input} value={formV.km_atual} onChange={e => setFormV({ ...formV, km_atual: e.target.value })} /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Região</label>
                <select style={S.fsel} value={formV.regiao} onChange={e => setFormV({ ...formV, regiao: e.target.value })}>
                  <option value="">Selecione...</option><option>RMR</option><option>Caruaru</option><option>Araripina</option>
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Modalidade</label>
                <select style={S.fsel} value={formV.modalidade} onChange={e => setFormV({ ...formV, modalidade: e.target.value })}>
                  <option value="">Selecione...</option><option>Frota</option><option>Alugado</option>
                </select>
              </div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Intervalo Revisão (KM)</label><input type="number" style={S.input} value={formV.intervalo_revisao_km} onChange={e => setFormV({ ...formV, intervalo_revisao_km: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Intervalo Revisão (Meses)</label><input type="number" style={S.input} value={formV.intervalo_revisao_meses} onChange={e => setFormV({ ...formV, intervalo_revisao_meses: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={S.textarea} value={formV.observacoes} onChange={e => setFormV({ ...formV, observacoes: e.target.value })} /></div>
            <div style={S.row}><button style={S.btnSm} onClick={() => { setModalVeiculo(false); setEditandoVeiculo(null) }}>Cancelar</button><button style={S.btn} onClick={salvarVeiculo} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}

      {modalSaida && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && (setModalSaida(null), setEditandoSaida(null))}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoSaida ? 'Editar Saída' : 'Registrar Saída'}</div>
            <div style={S.modalSub}>{modalSaida.placa} · {modalSaida.marca} {modalSaida.modelo}</div>
            <div style={S.field}><label style={S.label}>Colaborador *</label>
              <select style={S.fsel} value={formS.colaborador_id} onChange={e => setFormS({ ...formS, colaborador_id: e.target.value })}>
                <option value="">Selecione...</option>{colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Data Saída *</label><input type="date" style={S.input} value={formS.data_saida} onChange={e => setFormS({ ...formS, data_saida: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Empresa Destino</label><input style={S.input} value={formS.empresa_destino} onChange={e => setFormS({ ...formS, empresa_destino: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Local Destino</label><input style={S.input} value={formS.local_destino} onChange={e => setFormS({ ...formS, local_destino: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Período</label>
              <select style={S.fsel} value={formS.periodo} onChange={e => setFormS({ ...formS, periodo: e.target.value })}>
                <option value="">Selecione...</option><option>Manhã</option><option>Tarde</option><option>Noite</option><option>Período Integral</option><option>Pernoite</option>
              </select>
            </div>
            <div style={S.row}><button style={S.btnSm} onClick={() => { setModalSaida(null); setEditandoSaida(null) }}>Cancelar</button><button style={S.btn} onClick={() => salvarSaida(modalSaida.id)} disabled={salvando}>{salvando ? 'Salvando...' : editandoSaida ? 'Salvar' : 'Registrar Saída'}</button></div>
          </div>
        </div>
      )}

      {modalRetorno && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalRetorno(null)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Registrar Retorno</div>
            <div style={S.modalSub}>{modalRetorno.veiculos?.placa} · Em uso por {modalRetorno.colaboradores?.nome}</div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data Retorno *</label><input type="date" style={S.input} value={formRet.data_retorno} onChange={e => setFormRet({ ...formRet, data_retorno: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>KM Retorno</label><input type="number" style={S.input} value={formRet.km_retorno} onChange={e => setFormRet({ ...formRet, km_retorno: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={S.textarea} value={formRet.observacoes} onChange={e => setFormRet({ ...formRet, observacoes: e.target.value })} /></div>
            <div style={S.proxBox}>
              <div style={S.proxLbl}>Ao salvar:</div>
              <div style={{ fontSize: 12, color: 'var(--blue)' }}>✓ KM atual atualizado · ✓ Status volta para Disponível</div>
            </div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setModalRetorno(null)}>Cancelar</button><button style={S.btn} onClick={() => salvarRetorno(modalRetorno)} disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar Retorno'}</button></div>
          </div>
        </div>
      )}

      {modalRevisao && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && (setModalRevisao(null), setEditandoRevisao(null))}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editandoRevisao ? 'Editar Revisão' : 'Registrar Revisão'}</div>
            <div style={S.modalSub}>{modalRevisao.placa} · {modalRevisao.marca} {modalRevisao.modelo}</div>
            <div style={S.field}><label style={S.label}>Tipo *</label>
              <select style={S.fsel} value={formRev.tipo} onChange={e => setFormRev({ ...formRev, tipo: e.target.value })}>
                <option value="">Selecione...</option><option>Preventiva</option><option>Corretiva</option>
              </select>
            </div>
            {formRev.tipo === 'Corretiva' && (
              <div style={S.infoBoxWarn}>⚠ Revisão corretiva não altera a data/km da próxima preventiva agendada.</div>
            )}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data *</label><input type="date" style={S.input} value={formRev.data_revisao} onChange={e => setFormRev({ ...formRev, data_revisao: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>KM na Revisão</label><input type="number" style={S.input} value={formRev.km_revisao} onChange={e => setFormRev({ ...formRev, km_revisao: e.target.value })} /></div>
            </div>
            {formRev.data_revisao && formRev.tipo === 'Preventiva' && (
              <div style={S.proxBox}>
                <div style={S.proxLbl}>Próxima revisão preventiva calculada automaticamente</div>
                <div style={{ fontSize: 12, color: 'var(--blue)' }}>📅 {fmtData(addMeses(formRev.data_revisao, modalRevisao.intervalo_revisao_meses || 6))} · 🔧 {fmtKm((parseInt(formRev.km_revisao) || modalRevisao.km_atual || 0) + (modalRevisao.intervalo_revisao_km || 10000))}</div>
              </div>
            )}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Oficina</label><input style={S.input} value={formRev.oficina} onChange={e => setFormRev({ ...formRev, oficina: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Nº Chamado</label><input style={S.input} value={formRev.numero_chamado} onChange={e => setFormRev({ ...formRev, numero_chamado: e.target.value })} placeholder="CHM-1234" /></div>
            </div>
            <div style={S.field}><label style={S.label}>Responsável</label>
              <select style={S.fsel} value={formRev.responsavel_id} onChange={e => setFormRev({ ...formRev, responsavel_id: e.target.value })}>
                <option value="">Selecione...</option>{colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Descrição</label><textarea style={S.textarea} value={formRev.descricao} onChange={e => setFormRev({ ...formRev, descricao: e.target.value })} /></div>
            <div style={S.row}><button style={S.btnSm} onClick={() => { setModalRevisao(null); setEditandoRevisao(null) }}>Cancelar</button><button style={S.btn} onClick={() => salvarRevisao(modalRevisao)} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}

      {modalOcorrencia && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalOcorrencia(null)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Registrar Ocorrência</div>
            <div style={S.modalSub}>{modalOcorrencia.placa} · {modalOcorrencia.marca} {modalOcorrencia.modelo}</div>
            <div style={S.field}><label style={S.label}>Tipo *</label>
              <select style={S.fsel} value={formOc.tipo} onChange={e => setFormOc({ ...formOc, tipo: e.target.value })}>
                <option value="">Selecione...</option>
                <option>Auto de Infração (Multa)</option>
                <option>Acidente</option>
                <option>Avaria Identificada</option>
              </select>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data *</label><input type="date" style={S.input} value={formOc.data_ocorrencia} onChange={e => setFormOc({ ...formOc, data_ocorrencia: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Valor (R$)</label><input type="number" step="0.01" style={S.input} value={formOc.valor} onChange={e => setFormOc({ ...formOc, valor: e.target.value })} placeholder="0,00" /></div>
            </div>
            <div style={S.field}><label style={S.label}>Colaborador envolvido</label>
              <select style={S.fsel} value={formOc.colaborador_id} onChange={e => setFormOc({ ...formOc, colaborador_id: e.target.value })}>
                <option value="">Selecione...</option>{colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Descrição</label><textarea style={S.textarea} value={formOc.descricao} onChange={e => setFormOc({ ...formOc, descricao: e.target.value })} /></div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setModalOcorrencia(null)}>Cancelar</button><button style={S.btn} onClick={() => salvarOcorrencia(modalOcorrencia.id)} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}

      {modalOcorrenciaDetalhe && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalOcorrenciaDetalhe(null)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Acompanhar Ocorrência</div>
            <div style={S.modalSub}>{modalOcorrenciaDetalhe.veiculos?.placa} · {modalOcorrenciaDetalhe.tipo} · {fmtData(modalOcorrenciaDetalhe.data_ocorrencia)}</div>
            {modalOcorrenciaDetalhe.descricao && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16, background: 'var(--surface2)', borderRadius: 6, padding: '8px 12px' }}>{modalOcorrenciaDetalhe.descricao}</div>}
            <div style={S.field}><label style={S.label}>Status</label>
              <select style={S.fsel} value={formOcDet.status} onChange={e => setFormOcDet({ ...formOcDet, status: e.target.value })}>
                <option value="aberto">Aberto</option>
                <option value="em andamento">Em andamento</option>
                <option value="resolvido">Resolvido</option>
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Autor identificado</label>
              <select style={S.fsel} value={formOcDet.autor_id} onChange={e => setFormOcDet({ ...formOcDet, autor_id: e.target.value })}>
                <option value="">Selecione...</option>{colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data identificação</label><input type="date" style={S.input} value={formOcDet.data_identificacao} onChange={e => setFormOcDet({ ...formOcDet, data_identificacao: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Data pagamento</label><input type="date" style={S.input} value={formOcDet.data_pagamento} onChange={e => setFormOcDet({ ...formOcDet, data_pagamento: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Observações / Resolução</label><textarea style={S.textarea} value={formOcDet.observacao_resolucao} onChange={e => setFormOcDet({ ...formOcDet, observacao_resolucao: e.target.value })} /></div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setModalOcorrenciaDetalhe(null)}>Cancelar</button><button style={S.btn} onClick={() => salvarDetalheOcorrencia(modalOcorrenciaDetalhe)} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}