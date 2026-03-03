import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  wrap: { padding: 24, background: '#07090f', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#f97316' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 20 },
  statCard: (cor) => ({ background: '#0e1117', border: `1px solid ${cor}33`, borderRadius: 10, padding: '14px 16px' }),
  statVal: (cor) => ({ fontFamily: 'monospace', fontSize: 26, fontWeight: 800, color: cor, lineHeight: 1 }),
  statLbl: { fontSize: 11, color: '#3d4d66', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 4 },
  tabs: { display: 'flex', gap: 2, background: '#0e1117', border: '1px solid #1e2535', borderRadius: 8, padding: 3, marginBottom: 18, width: 'fit-content' },
  tab: (on) => ({ padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: on ? 600 : 400, cursor: 'pointer', color: on ? '#f97316' : '#8892a4', background: on ? 'rgba(249,115,22,.1)' : 'transparent', border: 'none' }),
  btn: { background: '#f97316', color: '#000', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSm: { background: '#141824', color: '#8892a4', border: '1px solid #28334a', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  btnSuccess: { background: 'rgba(16,217,160,.12)', color: '#10d9a0', border: '1px solid rgba(16,217,160,.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  btnDanger: { background: 'rgba(244,63,94,.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  btnWarn: { background: 'rgba(245,158,11,.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  card: { background: '#0e1117', border: '1px solid #1e2535', borderRadius: 10, padding: 18, marginBottom: 12 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  placa: { fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: '#f97316', letterSpacing: 2 },
  modelo: { fontSize: 13, color: '#dde4f0', fontWeight: 600, marginTop: 2 },
  cardInfo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 12 },
  infoBox: { background: '#141824', borderRadius: 6, padding: '8px 12px' },
  infoLbl: { fontSize: 10, color: '#3d4d66', textTransform: 'uppercase', letterSpacing: '.07em' },
  infoVal: { fontSize: 13, color: '#dde4f0', fontWeight: 600, marginTop: 2, fontFamily: 'monospace' },
  kmBar: { background: '#141824', borderRadius: 4, height: 6, marginTop: 8, overflow: 'hidden' },
  kmFill: (pct, cor) => ({ height: '100%', borderRadius: 4, background: cor, width: `${Math.min(pct, 100)}%`, transition: 'width .3s' }),
  table: { width: '100%', borderCollapse: 'collapse', background: '#0e1117', borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2535' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#3d4d66', textTransform: 'uppercase', letterSpacing: '.07em', borderBottom: '1px solid #1e2535' },
  td: { padding: '10px 14px', fontSize: 13, color: '#8892a4', borderBottom: '1px solid rgba(30,37,53,.5)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: '#0e1117', border: '1px solid #28334a', borderRadius: 12, padding: 28, width: '90%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#f97316', marginBottom: 6 },
  modalSub: { fontSize: 12, color: '#3d4d66', fontFamily: 'monospace', marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: '#8892a4' },
  input: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '9px 12px', color: '#dde4f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '9px 12px', color: '#dde4f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  textarea: { background: '#141824', border: '1px solid #28334a', borderRadius: 6, padding: '9px 12px', color: '#dde4f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', minHeight: 70, resize: 'vertical' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  erro: { background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.3)', borderRadius: 6, padding: '8px 12px', color: '#f43f5e', fontSize: 12, marginBottom: 10 },
  proxBox: { background: '#141824', border: '1px solid #10d9a033', borderRadius: 7, padding: '10px 14px', marginBottom: 14 },
  proxLbl: { fontSize: 11, color: '#10d9a0', fontWeight: 700, marginBottom: 6 },
  proxItem: { fontSize: 12, color: '#10d9a0', fontFamily: 'monospace', marginBottom: 3 },
}

function badge(s) {
  const cfg = {
    disponivel: { bg: 'rgba(16,217,160,.12)', c: '#10d9a0', l: '● Disponível' },
    em_uso: { bg: 'rgba(245,158,11,.12)', c: '#f59e0b', l: '● Em Uso' },
    manutencao: { bg: 'rgba(244,63,94,.12)', c: '#f43f5e', l: '● Manutenção' },
  }[s] || { bg: '#1e2535', c: '#3d4d66', l: s }
  return <span style={{ background: cfg.bg, color: cfg.c, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{cfg.l}</span>
}

function modalidadeBadge(m) {
  if (!m) return null
  const cfg = m === 'Frota' ? { bg: 'rgba(167,139,250,.12)', c: '#a78bfa' } : { bg: 'rgba(16,217,160,.12)', c: '#10d9a0' }
  return <span style={{ background: cfg.bg, color: cfg.c, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, marginLeft: 6 }}>{m}</span>
}

function fmtData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function fmtKm(k) {
  if (!k && k !== 0) return '—'
  return Number(k).toLocaleString('pt-BR') + ' km'
}

function addMeses(data, meses) {
  const d = new Date(data)
  d.setMonth(d.getMonth() + meses)
  return d.toISOString().split('T')[0]
}

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [saidas, setSaidas] = useState([])
  const [revisoes, setRevisoes] = useState([])
  const [ocorrencias, setOcorrencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('veiculos')
  const [modalVeiculo, setModalVeiculo] = useState(false)
  const [modalSaida, setModalSaida] = useState(null)
  const [modalRetorno, setModalRetorno] = useState(null)
  const [modalRevisao, setModalRevisao] = useState(null)
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
      supabase.from('saidas_veiculos').select('*, veiculos(placa, modelo), colaboradores(nome)').order('data_saida', { ascending: false }),
      supabase.from('revisoes_veiculos').select('*, veiculos(placa, modelo), responsavel:responsavel_id(nome)').order('data_revisao', { ascending: false }),
      supabase.from('ocorrencias_veiculos').select('*, veiculos(placa, modelo), colaboradores(nome), autor:autor_id(nome)').order('data_ocorrencia', { ascending: false }),
    ])
    setVeiculos(v.data || [])
    setColaboradores(col.data || [])
    setSaidas(s.data || [])
    setRevisoes(r.data || [])
    setOcorrencias(o.data || [])
    setLoading(false)
  }

  async function salvarVeiculo() {
    if (!formV.placa || !formV.modelo) { setErro('Placa e Modelo são obrigatórios.'); return }
    setSalvando(true); setErro('')
    const km = parseInt(formV.km_atual) || 0
    const { error } = await supabase.from('veiculos').insert({
      placa: formV.placa.toUpperCase().trim(),
      modelo: formV.modelo.trim(),
      marca: formV.marca.trim(),
      ano: parseInt(formV.ano) || null,
      cor: formV.cor.trim(),
      km_atual: km,
      km_proxima_revisao: km + parseInt(formV.intervalo_revisao_km),
      intervalo_revisao_km: parseInt(formV.intervalo_revisao_km),
      intervalo_revisao_meses: parseInt(formV.intervalo_revisao_meses),
      regiao: formV.regiao || null,
      modalidade: formV.modalidade || null,
      status: 'disponivel',
      observacoes: formV.observacoes,
    })
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setFormV({ placa: '', modelo: '', marca: '', ano: '', cor: '', km_atual: '', intervalo_revisao_km: 10000, intervalo_revisao_meses: 6, regiao: '', modalidade: '', observacoes: '' })
    setModalVeiculo(false); init()
  }

  async function salvarSaida(veiculoId) {
    if (!formS.colaborador_id || !formS.data_saida) return
    setSalvando(true)
    const { error } = await supabase.from('saidas_veiculos').insert({
      veiculo_id: veiculoId,
      colaborador_id: formS.colaborador_id,
      empresa_destino: formS.empresa_destino,
      local_destino: formS.local_destino,
      periodo: formS.periodo,
      data_saida: formS.data_saida,
    })
    if (!error) await supabase.from('veiculos').update({ status: 'em_uso' }).eq('id', veiculoId)
    setFormS({ colaborador_id: '', empresa_destino: '', local_destino: '', periodo: '', data_saida: '' })
    setModalSaida(null); setSalvando(false); init()
  }

  async function salvarRetorno(saida) {
    if (!formRet.data_retorno) return
    setSalvando(true)
    const km = parseInt(formRet.km_retorno) || null
    await supabase.from('saidas_veiculos').update({
      data_retorno: formRet.data_retorno,
      km_retorno: km,
      observacoes: formRet.observacoes,
    }).eq('id', saida.id)
    const veiculo = veiculos.find(v => v.id === saida.veiculo_id)
    const updates = { status: 'disponivel' }
    if (km) {
      updates.km_atual = km
      updates.km_proxima_revisao = km + (veiculo?.intervalo_revisao_km || 10000)
    }
    await supabase.from('veiculos').update(updates).eq('id', saida.veiculo_id)
    setFormRet({ data_retorno: '', km_retorno: '', observacoes: '' })
    setModalRetorno(null); setSalvando(false); init()
  }

  async function salvarRevisao(veiculo) {
    if (!formRev.tipo || !formRev.data_revisao) return
    setSalvando(true)
    const km = parseInt(formRev.km_revisao) || veiculo.km_atual || 0
    const proxKm = km + (veiculo.intervalo_revisao_km || 10000)
    const proxData = addMeses(formRev.data_revisao, veiculo.intervalo_revisao_meses || 6)
    const { error } = await supabase.from('revisoes_veiculos').insert({
      veiculo_id: veiculo.id,
      tipo: formRev.tipo,
      data_revisao: formRev.data_revisao,
      km_revisao: km,
      km_proxima_revisao: proxKm,
      data_proxima_revisao: proxData,
      oficina: formRev.oficina || null,
      numero_chamado: formRev.numero_chamado || null,
      responsavel_id: formRev.responsavel_id || null,
      descricao: formRev.descricao || null,
    })
    if (!error) {
      await supabase.from('veiculos').update({
        km_atual: km,
        km_proxima_revisao: proxKm,
        data_proxima_revisao: proxData,
      }).eq('id', veiculo.id)
    }
    if (error) alert('Erro: ' + error.message)
    setFormRev({ tipo: '', data_revisao: '', km_revisao: '', oficina: '', numero_chamado: '', responsavel_id: '', descricao: '' })
    setModalRevisao(null); setSalvando(false); init()
  }

  async function salvarOcorrencia(veiculoId) {
    if (!formOc.tipo || !formOc.data_ocorrencia) return
    setSalvando(true)
    await supabase.from('ocorrencias_veiculos').insert({
      veiculo_id: veiculoId,
      colaborador_id: formOc.colaborador_id || null,
      tipo: formOc.tipo,
      data_ocorrencia: formOc.data_ocorrencia,
      descricao: formOc.descricao,
      valor: parseFloat(formOc.valor) || null,
      status: 'Aberto',
    })
    setFormOc({ colaborador_id: '', tipo: '', data_ocorrencia: '', descricao: '', valor: '' })
    setModalOcorrencia(null); setSalvando(false); init()
  }

  async function salvarDetalheOcorrencia(ocorrencia) {
    setSalvando(true)
    await supabase.from('ocorrencias_veiculos').update({
      autor_id: formOcDet.autor_id || null,
      data_identificacao: formOcDet.data_identificacao || null,
      data_pagamento: formOcDet.data_pagamento || null,
      observacao_resolucao: formOcDet.observacao_resolucao || null,
      status: formOcDet.status || ocorrencia.status,
    }).eq('id', ocorrencia.id)
    setModalOcorrenciaDetalhe(null); setSalvando(false); init()
  }

  const saidasAbertas = saidas.filter(s => !s.data_retorno)
  const revisoesPendentes = veiculos.filter(v => {
    if (v.km_proxima_revisao && v.km_atual >= v.km_proxima_revisao - 500) return true
    if (v.data_proxima_revisao && new Date(v.data_proxima_revisao) <= new Date(Date.now() + 30 * 86400000)) return true
    return false
  })

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.title}>🚗 Gestão de Veículos</div>
        <button style={S.btn} onClick={() => { setErro(''); setModalVeiculo(true) }}>+ Novo Veículo</button>
      </div>

      <div style={S.stats}>
        <div style={S.statCard('#f97316')}><div style={S.statVal('#f97316')}>{veiculos.length}</div><div style={S.statLbl}>Veículos</div></div>
        <div style={S.statCard('#10d9a0')}><div style={S.statVal('#10d9a0')}>{veiculos.filter(v => v.status === 'disponivel').length}</div><div style={S.statLbl}>Disponíveis</div></div>
        <div style={S.statCard('#f59e0b')}><div style={S.statVal('#f59e0b')}>{saidasAbertas.length}</div><div style={S.statLbl}>Em Uso</div></div>
        <div style={S.statCard('#f43f5e')}><div style={S.statVal('#f43f5e')}>{revisoesPendentes.length}</div><div style={S.statLbl}>Revisão Próxima</div></div>
        <div style={S.statCard('#a78bfa')}><div style={S.statVal('#a78bfa')}>{ocorrencias.filter(o => o.status === 'Aberto').length}</div><div style={S.statLbl}>Ocorrências</div></div>
      </div>

      <div style={S.tabs}>
        {[['veiculos','Veículos'],['saidas','Saídas/Retornos'],['revisoes','Revisões'],['ocorrencias','Ocorrências']].map(([id, label]) => (
          <button key={id} style={S.tab(aba === id)} onClick={() => setAba(id)}>{label}</button>
        ))}
      </div>

      {aba === 'veiculos' && (
        loading ? <div style={{ color: '#3d4d66', textAlign: 'center', padding: 40 }}>Carregando...</div> :
        veiculos.length === 0 ? <div style={{ color: '#3d4d66', textAlign: 'center', padding: 40 }}>Nenhum veículo cadastrado.</div> :
        veiculos.map(v => {
          const pct = v.km_proxima_revisao ? ((v.km_atual - (v.km_proxima_revisao - v.intervalo_revisao_km)) / v.intervalo_revisao_km) * 100 : 0
          const cor = pct >= 90 ? '#f43f5e' : pct >= 70 ? '#f59e0b' : '#10d9a0'
          const saidaAberta = saidas.find(s => s.veiculo_id === v.id && !s.data_retorno)
          return (
            <div key={v.id} style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <div style={S.placa}>{v.placa} {modalidadeBadge(v.modalidade)}</div>
                  <div style={S.modelo}>{v.marca} {v.modelo} {v.ano && `· ${v.ano}`} {v.cor && `· ${v.cor}`} {v.regiao && `· ${v.regiao}`}</div>
                </div>
                {badge(v.status)}
              </div>
              <div style={S.cardInfo}>
                <div style={S.infoBox}><div style={S.infoLbl}>KM Atual</div><div style={S.infoVal}>{fmtKm(v.km_atual)}</div></div>
                <div style={S.infoBox}><div style={S.infoLbl}>Próxima Revisão KM</div><div style={{ ...S.infoVal, color: v.km_atual >= (v.km_proxima_revisao - 500) ? '#f43f5e' : '#dde4f0' }}>{fmtKm(v.km_proxima_revisao)}</div></div>
                <div style={S.infoBox}><div style={S.infoLbl}>Próxima Revisão Data</div><div style={{ ...S.infoVal, color: v.data_proxima_revisao && new Date(v.data_proxima_revisao) <= new Date(Date.now() + 30*86400000) ? '#f43f5e' : '#dde4f0' }}>{fmtData(v.data_proxima_revisao)}</div></div>
                {saidaAberta && <div style={{ ...S.infoBox, border: '1px solid #f59e0b33' }}><div style={S.infoLbl}>Em uso por</div><div style={{ ...S.infoVal, color: '#f59e0b' }}>{saidaAberta.colaboradores?.nome}</div></div>}
              </div>
              {v.km_proxima_revisao > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#3d4d66', marginBottom: 4 }}>Progresso até próxima revisão: {fmtKm(v.km_proxima_revisao - v.km_atual)} restantes</div>
                  <div style={S.kmBar}><div style={S.kmFill(pct, cor)} /></div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {v.status === 'disponivel' && <button style={S.btnWarn} onClick={() => { setModalSaida(v); setFormS({ colaborador_id: '', empresa_destino: '', local_destino: '', periodo: '', data_saida: new Date().toISOString().split('T')[0] }) }}>Registrar Saída</button>}
                {saidaAberta && <button style={S.btnSuccess} onClick={() => { setModalRetorno(saidaAberta); setFormRet({ data_retorno: new Date().toISOString().split('T')[0], km_retorno: '', observacoes: '' }) }}>Registrar Retorno</button>}
                <button style={S.btnSm} onClick={() => { setModalRevisao(v); setFormRev({ tipo: '', data_revisao: new Date().toISOString().split('T')[0], km_revisao: v.km_atual || '', oficina: '', numero_chamado: '', responsavel_id: '', descricao: '' }) }}>+ Revisão</button>
                <button style={S.btnSm} onClick={() => { setModalOcorrencia(v); setFormOc({ colaborador_id: '', tipo: '', data_ocorrencia: new Date().toISOString().split('T')[0], descricao: '', valor: '' }) }}>+ Ocorrência</button>
              </div>
            </div>
          )
        })
      )}

      {aba === 'saidas' && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2535' }}>
          <table style={{ ...S.table, border: 'none' }}>
            <thead><tr>
              <th style={S.th}>Veículo</th>
              <th style={S.th}>Colaborador</th>
              <th style={S.th}>Destino</th>
              <th style={S.th}>Período</th>
              <th style={S.th}>Data Saída</th>
              <th style={S.th}>Data Retorno</th>
              <th style={S.th}>KM Retorno</th>
              <th style={S.th}>Status</th>
            </tr></thead>
            <tbody>
              {saidas.map(s => (
                <tr key={s.id}>
                  <td style={{ ...S.td, color: '#f97316', fontFamily: 'monospace', fontWeight: 700 }}>{s.veiculos?.placa}<div style={{ fontSize: 11, color: '#3d4d66' }}>{s.veiculos?.modelo}</div></td>
                  <td style={{ ...S.td, color: '#dde4f0' }}>{s.colaboradores?.nome || '—'}</td>
                  <td style={S.td}>{[s.empresa_destino, s.local_destino].filter(Boolean).join(' · ') || '—'}</td>
                  <td style={S.td}>{s.periodo || '—'}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtData(s.data_saida)}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtData(s.data_retorno)}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtKm(s.km_retorno)}</td>
                  <td style={S.td}>{s.data_retorno ? <span style={{ background: 'rgba(16,217,160,.12)', color: '#10d9a0', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Retornado</span> : <span style={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Em uso</span>}</td>
                </tr>
              ))}
              {saidas.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#3d4d66' }}>Nenhuma saída registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'revisoes' && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2535' }}>
          <table style={{ ...S.table, border: 'none' }}>
            <thead><tr>
              <th style={S.th}>Veículo</th>
              <th style={S.th}>Tipo</th>
              <th style={S.th}>Data Revisão</th>
              <th style={S.th}>KM</th>
              <th style={S.th}>Próxima KM</th>
              <th style={S.th}>Próxima Data</th>
              <th style={S.th}>Oficina</th>
              <th style={S.th}>Chamado</th>
              <th style={S.th}>Responsável</th>
            </tr></thead>
            <tbody>
              {revisoes.map(r => (
                <tr key={r.id}>
                  <td style={{ ...S.td, color: '#f97316', fontFamily: 'monospace', fontWeight: 700 }}>{r.veiculos?.placa}<div style={{ fontSize: 11, color: '#3d4d66' }}>{r.veiculos?.modelo}</div></td>
                  <td style={{ ...S.td, color: '#dde4f0' }}>{r.tipo}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, background: 'rgba(16,217,160,.06)', color: '#10d9a0', fontWeight: 600 }}>{fmtData(r.data_revisao)}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtKm(r.km_revisao)}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtKm(r.km_proxima_revisao)}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, background: 'rgba(245,158,11,.06)', color: '#f59e0b', fontWeight: 600 }}>{fmtData(r.data_proxima_revisao)}</td>
                  <td style={S.td}>{r.oficina || '—'}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: '#a78bfa' }}>{r.numero_chamado || '—'}</td>
                  <td style={S.td}>{r.responsavel?.nome || '—'}</td>
                </tr>
              ))}
              {revisoes.length === 0 && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#3d4d66' }}>Nenhuma revisão registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'ocorrencias' && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2535' }}>
          <table style={{ ...S.table, border: 'none' }}>
            <thead><tr>
              <th style={S.th}>Veículo</th>
              <th style={S.th}>Tipo</th>
              <th style={S.th}>Data</th>
              <th style={S.th}>Colaborador</th>
              <th style={S.th}>Autor Identificado</th>
              <th style={S.th}>Valor</th>
              <th style={S.th}>Status</th>
              <th style={S.th}></th>
            </tr></thead>
            <tbody>
              {ocorrencias.map(o => (
                <tr key={o.id}>
                  <td style={{ ...S.td, color: '#f97316', fontFamily: 'monospace', fontWeight: 700 }}>{o.veiculos?.placa}<div style={{ fontSize: 11, color: '#3d4d66' }}>{o.veiculos?.modelo}</div></td>
                  <td style={{ ...S.td, color: '#dde4f0' }}>{o.tipo}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{fmtData(o.data_ocorrencia)}</td>
                  <td style={S.td}>{o.colaboradores?.nome || '—'}</td>
                  <td style={S.td}>{o.autor?.nome || '—'}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: '#f43f5e' }}>{o.valor ? `R$ ${o.valor.toFixed(2)}` : '—'}</td>
                  <td style={S.td}>
                    <span style={{ background: o.status === 'Resolvido' ? 'rgba(16,217,160,.12)' : o.status === 'Em andamento' ? 'rgba(245,158,11,.12)' : 'rgba(244,63,94,.12)', color: o.status === 'Resolvido' ? '#10d9a0' : o.status === 'Em andamento' ? '#f59e0b' : '#f43f5e', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {o.status || 'Aberto'}
                    </span>
                  </td>
                  <td style={S.td}><button style={S.btnSm} onClick={() => { setModalOcorrenciaDetalhe(o); setFormOcDet({ autor_id: o.autor_id || '', data_identificacao: o.data_identificacao || '', data_pagamento: o.data_pagamento || '', observacao_resolucao: o.observacao_resolucao || '', status: o.status || 'Aberto' }) }}>Acompanhar</button></td>
                </tr>
              ))}
              {ocorrencias.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#3d4d66' }}>Nenhuma ocorrência registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalVeiculo && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalVeiculo(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Novo Veículo</div>
            {erro && <div style={S.erro}>{erro}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Placa *</label><input style={S.input} value={formV.placa} onChange={e => setFormV({ ...formV, placa: e.target.value })} placeholder="ABC-1234" /></div>
              <div style={S.field}><label style={S.label}>Ano</label><input style={S.input} value={formV.ano} onChange={e => setFormV({ ...formV, ano: e.target.value })} placeholder="2022" /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Marca</label><input style={S.input} value={formV.marca} onChange={e => setFormV({ ...formV, marca: e.target.value })} placeholder="Toyota" /></div>
              <div style={S.field}><label style={S.label}>Modelo *</label><input style={S.input} value={formV.modelo} onChange={e => setFormV({ ...formV, modelo: e.target.value })} placeholder="Corolla" /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Cor</label><input style={S.input} value={formV.cor} onChange={e => setFormV({ ...formV, cor: e.target.value })} placeholder="Prata" /></div>
              <div style={S.field}><label style={S.label}>KM Atual</label><input type="number" style={S.input} value={formV.km_atual} onChange={e => setFormV({ ...formV, km_atual: e.target.value })} placeholder="50000" /></div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Região</label>
                <select style={S.fsel} value={formV.regiao} onChange={e => setFormV({ ...formV, regiao: e.target.value })}>
                  <option value="">Selecione...</option>
                  <option>RMR</option><option>Caruaru</option><option>Araripina</option>
                </select>
              </div>
              <div style={S.field}><label style={S.label}>Modalidade</label>
                <select style={S.fsel} value={formV.modalidade} onChange={e => setFormV({ ...formV, modalidade: e.target.value })}>
                  <option value="">Selecione...</option>
                  <option>Frota</option><option>Alugado</option>
                </select>
              </div>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Intervalo Revisão (KM)</label><input type="number" style={S.input} value={formV.intervalo_revisao_km} onChange={e => setFormV({ ...formV, intervalo_revisao_km: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Intervalo Revisão (Meses)</label><input type="number" style={S.input} value={formV.intervalo_revisao_meses} onChange={e => setFormV({ ...formV, intervalo_revisao_meses: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={S.textarea} value={formV.observacoes} onChange={e => setFormV({ ...formV, observacoes: e.target.value })} /></div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalVeiculo(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvarVeiculo} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {modalSaida && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalSaida(null)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Registrar Saída</div>
            <div style={S.modalSub}>{modalSaida.placa} · {modalSaida.marca} {modalSaida.modelo}</div>
            <div style={S.field}><label style={S.label}>Colaborador *</label>
              <select style={S.fsel} value={formS.colaborador_id} onChange={e => setFormS({ ...formS, colaborador_id: e.target.value })}>
                <option value="">Selecione...</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Data Saída *</label><input type="date" style={S.input} value={formS.data_saida} onChange={e => setFormS({ ...formS, data_saida: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Empresa Destino</label><input style={S.input} value={formS.empresa_destino} onChange={e => setFormS({ ...formS, empresa_destino: e.target.value })} placeholder="Ex: Cliente ABC" /></div>
            <div style={S.field}><label style={S.label}>Local Destino</label><input style={S.input} value={formS.local_destino} onChange={e => setFormS({ ...formS, local_destino: e.target.value })} placeholder="Ex: Recife - PE" /></div>
            <div style={S.field}><label style={S.label}>Período</label>
              <select style={S.fsel} value={formS.periodo} onChange={e => setFormS({ ...formS, periodo: e.target.value })}>
                <option value="">Selecione...</option>
                <option>Manhã</option><option>Tarde</option><option>Noite</option><option>Período Integral</option><option>Pernoite</option>
              </select>
            </div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalSaida(null)}>Cancelar</button>
              <button style={S.btn} onClick={() => salvarSaida(modalSaida.id)} disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar Saída'}</button>
            </div>
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
              <div style={S.field}><label style={S.label}>KM Retorno</label><input type="number" style={S.input} value={formRet.km_retorno} onChange={e => setFormRet({ ...formRet, km_retorno: e.target.value })} placeholder="Ex: 52000" /></div>
            </div>
            <div style={S.field}><label style={S.label}>Observações</label><textarea style={S.textarea} value={formRet.observacoes} onChange={e => setFormRet({ ...formRet, observacoes: e.target.value })} /></div>
            <div style={S.proxBox}>
              <div style={S.proxLbl}>Ao salvar o retorno:</div>
              <div style={S.proxItem}>✓ KM atual do veículo será atualizado</div>
              <div style={S.proxItem}>✓ Próxima revisão por KM será recalculada automaticamente</div>
              <div style={S.proxItem}>✓ Status do veículo volta para Disponível</div>
            </div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalRetorno(null)}>Cancelar</button>
              <button style={S.btn} onClick={() => salvarRetorno(modalRetorno)} disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar Retorno'}</button>
            </div>
          </div>
        </div>
      )}

      {modalRevisao && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalRevisao(null)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Registrar Revisão</div>
            <div style={S.modalSub}>{modalRevisao.placa} · {modalRevisao.marca} {modalRevisao.modelo}</div>
            <div style={S.field}><label style={S.label}>Tipo *</label>
              <select style={S.fsel} value={formRev.tipo} onChange={e => setFormRev({ ...formRev, tipo: e.target.value })}>
                <option value="">Selecione...</option>
                <option>Preventiva</option><option>Corretiva</option>
              </select>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data *</label><input type="date" style={S.input} value={formRev.data_revisao} onChange={e => setFormRev({ ...formRev, data_revisao: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>KM na Revisão</label><input type="number" style={S.input} value={formRev.km_revisao} onChange={e => setFormRev({ ...formRev, km_revisao: e.target.value })} /></div>
            </div>
            {formRev.data_revisao && (
              <div style={S.proxBox}>
                <div style={S.proxLbl}>Próxima revisão calculada automaticamente:</div>
                <div style={S.proxItem}>📅 Data: {fmtData(addMeses(formRev.data_revisao, modalRevisao.intervalo_revisao_meses || 6))}</div>
                <div style={S.proxItem}>🔧 KM: {fmtKm((parseInt(formRev.km_revisao) || modalRevisao.km_atual || 0) + (modalRevisao.intervalo_revisao_km || 10000))}</div>
              </div>
            )}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Oficina</label><input style={S.input} value={formRev.oficina} onChange={e => setFormRev({ ...formRev, oficina: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Nº Chamado / Protocolo</label><input style={S.input} value={formRev.numero_chamado} onChange={e => setFormRev({ ...formRev, numero_chamado: e.target.value })} placeholder="Ex: CHM-1234" /></div>
            </div>
            <div style={S.field}><label style={S.label}>Responsável por levar o veículo</label>
              <select style={S.fsel} value={formRev.responsavel_id} onChange={e => setFormRev({ ...formRev, responsavel_id: e.target.value })}>
                <option value="">Selecione...</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Descrição dos serviços</label><textarea style={S.textarea} value={formRev.descricao} onChange={e => setFormRev({ ...formRev, descricao: e.target.value })} /></div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalRevisao(null)}>Cancelar</button>
              <button style={S.btn} onClick={() => salvarRevisao(modalRevisao)} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
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
                <option>Auto de Infração (Multa)</option><option>Acidente</option><option>Avaria Identificada</option>
              </select>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data *</label><input type="date" style={S.input} value={formOc.data_ocorrencia} onChange={e => setFormOc({ ...formOc, data_ocorrencia: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Valor (R$)</label><input type="number" style={S.input} value={formOc.valor} onChange={e => setFormOc({ ...formOc, valor: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Colaborador envolvido</label>
              <select style={S.fsel} value={formOc.colaborador_id} onChange={e => setFormOc({ ...formOc, colaborador_id: e.target.value })}>
                <option value="">Selecione...</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Descrição</label><textarea style={S.textarea} value={formOc.descricao} onChange={e => setFormOc({ ...formOc, descricao: e.target.value })} /></div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalOcorrencia(null)}>Cancelar</button>
              <button style={S.btn} onClick={() => salvarOcorrencia(modalOcorrencia.id)} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {modalOcorrenciaDetalhe && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalOcorrenciaDetalhe(null)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Acompanhar Ocorrência</div>
            <div style={S.modalSub}>{modalOcorrenciaDetalhe.veiculos?.placa} · {modalOcorrenciaDetalhe.tipo} · {fmtData(modalOcorrenciaDetalhe.data_ocorrencia)}</div>
            {modalOcorrenciaDetalhe.descricao && <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 16, background: '#141824', borderRadius: 6, padding: '8px 12px' }}>{modalOcorrenciaDetalhe.descricao}</div>}
            <div style={S.field}><label style={S.label}>Status</label>
              <select style={S.fsel} value={formOcDet.status} onChange={e => setFormOcDet({ ...formOcDet, status: e.target.value })}>
                <option>Aberto</option><option>Em andamento</option><option>Resolvido</option>
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Autor identificado</label>
              <select style={S.fsel} value={formOcDet.autor_id} onChange={e => setFormOcDet({ ...formOcDet, autor_id: e.target.value })}>
                <option value="">Selecione...</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data identificação</label><input type="date" style={S.input} value={formOcDet.data_identificacao} onChange={e => setFormOcDet({ ...formOcDet, data_identificacao: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Data pagamento</label><input type="date" style={S.input} value={formOcDet.data_pagamento} onChange={e => setFormOcDet({ ...formOcDet, data_pagamento: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Observações / Resolução</label><textarea style={S.textarea} value={formOcDet.observacao_resolucao} onChange={e => setFormOcDet({ ...formOcDet, observacao_resolucao: e.target.value })} /></div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalOcorrenciaDetalhe(null)}>Cancelar</button>
              <button style={S.btn} onClick={() => salvarDetalheOcorrencia(modalOcorrenciaDetalhe)} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}