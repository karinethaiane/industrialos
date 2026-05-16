/**
 * exportacaoUnificada.js
 * Exporta todos os módulos do IndustrialOS em um único Excel com múltiplas abas.
 * Uso: import { exportarTudo } from './exportacaoUnificada'
 */
import { supabase } from './supabase'

function fmtData(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function fmtMoeda(v) {
  if (!v && v !== 0) return ''
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function autoWidth(ws, rows) {
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  ws['!cols'] = cols.map(col => ({
    wch: Math.min(50, Math.max(col.length + 2, ...rows.map(r => String(r[col] || '').length)))
  }))
}

function addSheet(wb, XLSX, rows, nome) {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
  autoWidth(ws, rows)
  XLSX.utils.book_append_sheet(wb, ws, nome)
}

export async function exportarTudo(onProgress) {
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
  const wb   = XLSX.utils.book_new()

  // ── 1. PATRIMÔNIO ─────────────────────────────────────────────────────────
  onProgress?.('Patrimônio...')
  const { data: bens } = await supabase.from('patrimonios').select('*').order('descricao')
  const rowsBens = (bens || []).map(b => ({
    'Código de Barras':        b.codigo_barra || '',
    'Descrição':               b.descricao || '',
    'Descrição Complementar':  b.descricao_complementar || '',
    'Tipo':                    b.tipo_bem || '',
    'Situação':                b.situacao || '',
    'Local':                   b.local || '',
    'Unidade':                 b.unidade || '',
    'Responsável':             b.responsavel || '',
    'Usuário':                 b.usuario_patrimonio || '',
    'Data Aquisição':          fmtData(b.data_aquisicao),
    'Valor Aquisição':         b.valor_aquisicao || '',
    'Saldo Contábil':          b.saldo_contabil || '',
    'Código Interno':          b.codigo_interno || '',
    'Requer Calibração':       b.requer_calibracao ? 'Sim' : 'Não',
    'Última Calibração':       fmtData(b.ultima_calibracao),
    'Próxima Calibração':      fmtData(b.proxima_calibracao),
  }))
  addSheet(wb, XLSX, rowsBens, 'Patrimônio')

  // ── 2. OCORRÊNCIAS ────────────────────────────────────────────────────────
  onProgress?.('Ocorrências...')
  const { data: ocors } = await supabase
    .from('patrimonio_ocorrencias')
    .select('*, patrimonios(codigo_barra, descricao, local, usuario_patrimonio)')
    .order('created_at', { ascending: false })
  const rowsOcor = (ocors || []).map(o => ({
    'Data Abertura':    fmtData(o.data_abertura),
    'Tipo':             o.tipo || '',
    'Status':           o.status || '',
    'Código de Barras': o.patrimonios?.codigo_barra || '',
    'Bem':              o.patrimonios?.descricao || '',
    'Local':            o.patrimonios?.local || '',
    'Usuário':          o.patrimonios?.usuario_patrimonio || '',
    'Descrição':        o.descricao || '',
    'Chamado':          o.chamado || '',
    'Data Resolução':   fmtData(o.data_resolucao),
  }))
  addSheet(wb, XLSX, rowsOcor, 'Ocorrências')

  // ── 3. CALIBRAÇÕES ────────────────────────────────────────────────────────
  onProgress?.('Calibrações...')
  const { data: peds } = await supabase
    .from('calibracao_pedidos')
    .select('*, calibracao_pedido_itens(*, patrimonios(codigo_barra, descricao, codigo_interno, periodicidade_calibracao))')
    .order('created_at', { ascending: false })
  const rowsCalib = []
  ;(peds || []).forEach(p => {
    ;(p.calibracao_pedido_itens || []).forEach(item => {
      rowsCalib.push({
        'Pedido':              p.numero || '',
        'Chamado Compras':     p.chamado || '',
        'Fornecedor':          p.fornecedor || '',
        'Nº Pedido':           p.numero_pedido || '',
        'Status Pedido':       p.status === 'em_andamento' ? 'Em andamento' : p.status === 'concluido' ? 'Concluído' : p.status === 'pag_solicitado' ? 'Pag. Solicitado' : p.status || '',
        'Valor Global':        p.valor_global ? fmtMoeda(p.valor_global) : '',
        'Data Abertura':       fmtData(p.data_abertura),
        'Data Conclusão':      fmtData(p.data_conclusao),
        'Código Interno':      item.patrimonios?.codigo_interno || '',
        'Código de Barras':    item.patrimonios?.codigo_barra || '',
        'Equipamento':         item.patrimonios?.descricao || '',
        'Periodicidade (meses)': item.patrimonios?.periodicidade_calibracao || '',
        'Data Calibração Item': fmtData(item.data_calibracao),
        'Status Item':         item.data_calibracao ? 'Calibrado' : 'Pendente',
      })
    })
  })
  addSheet(wb, XLSX, rowsCalib, 'Calibrações')

  // ── 4. EPIs ───────────────────────────────────────────────────────────────
  onProgress?.('EPIs...')
  const { data: episData } = await supabase
    .from('epis')
    .select('*, colaboradores(nome, matricula)')
    .order('data_entrega', { ascending: false })
  const rowsEpis = (episData || []).map(e => ({
    'Colaborador':       e.colaboradores?.nome || '',
    'Matrícula':         e.colaboradores?.matricula || '',
    'EPI':               e.tipo || '',
    'Quantidade':        e.quantidade || '',
    'Nº CA':             e.ca || '',
    'Data Entrega':      fmtData(e.data_entrega),
    'Próxima Entrega':   fmtData(e.data_prox_entrega),
    'Status': (() => {
      if (!e.data_prox_entrega) return 'Vencido'
      const dias = Math.floor((new Date(e.data_prox_entrega) - new Date()) / 86400000)
      if (dias < 0) return 'Vencido'
      if (dias <= 30) return 'Vencendo em 30d'
      return 'Vigente'
    })(),
    'Motivo':            e.motivo || '',
    'Registrado por':    e.registrado_por || '',
  }))
  addSheet(wb, XLSX, rowsEpis, 'EPIs')

  // ── 5. NFs ────────────────────────────────────────────────────────────────
  onProgress?.('Financeiro — NFs...')
  const { data: nfs } = await supabase
    .from('emissoes_nf')
    .select('*')
    .order('created_at', { ascending: false })
  const rowsNFs = (nfs || []).map(r => ({
    'ID SGT':               r.id_sgt || '',
    'Empresa':              r.empresa || '',
    'Consultor':            r.consultor || '',
    'Status SGT':           r.status_sgt || '',
    'Data Conclusão SGT':   fmtData(r.data_conclusao_sgt),
    'NF/Boleto Enviado':    r.nf_boleto_enviado ? 'Sim' : 'Não',
    'Data Solicitação':     fmtData(r.data_solicitacao_envio),
    'Nº NF':                r.numero_nf || '',
    'Valor Parcela':        r.valor_parcela ? fmtMoeda(r.valor_parcela) : '',
    'Nº Parcelas':          r.numero_parcelas || '',
    'Valor Total':          r.valor_total ? fmtMoeda(r.valor_total) : '',
    'Origem':               r.origem || '',
    'Observações':          r.observacoes || '',
  }))
  addSheet(wb, XLSX, rowsNFs, 'NFs')

  // ── 6. PAGAMENTOS ─────────────────────────────────────────────────────────
  onProgress?.('Financeiro — Pagamentos...')
  const { data: pags } = await supabase
    .from('solicitacoes_pagamento')
    .select('*')
    .order('created_at', { ascending: false })
  const rowsPags = (pags || []).map(r => ({
    'Nº Chamado':        r.numero_chamado || 'A abrir',
    'Tipo de Tarefa':    r.tipo_tarefa || '',
    'Solicitante':       r.solicitante || '',
    'Razão Social':      r.razao_social || '',
    'Nº NF/Boleto/AL':  r.numero_nf_boleto_al || '',
    'Descrição':         r.descricao || '',
    'Status':            r.status || '',
    'Responsável': (() => {
      const map = { aguardando_abertura_chamado:'Solicitante', em_andamento:'Financeiro', ajustes:'Solicitante', aguardando_desbloqueio:'Gerência', concluido:'Financeiro', cancelado:'Financeiro' }
      return map[r.status] || ''
    })(),
    'Valor':             r.valor ? fmtMoeda(r.valor) : '',
    'Previsão Pgto':     fmtData(r.previsao_pagamento),
    'Origem':            r.origem || '',
    'Observações':       r.observacoes || '',
  }))
  addSheet(wb, XLSX, rowsPags, 'Pagamentos')

  // ── 7. DIÁRIAS ────────────────────────────────────────────────────────────
  onProgress?.('Financeiro — Diárias...')
  const { data: diarias } = await supabase
    .from('diarias_viagem')
    .select('*')
    .order('created_at', { ascending: false })
  const rowsDiarias = (diarias || []).map(r => ({
    'Chamado':           r.numero_chamado || 'A abrir',
    'OP':                r.op || '',
    'Solicitante':       r.solicitante || '',
    'Destino':           r.destino || '',
    'Data Início':       fmtData(r.data_inicio),
    'Data Fim':          fmtData(r.data_fim),
    'Hospedagem':        r.hospedagem ? 'Sim' : 'Não',
    'Voucher Recebido':  r.voucher_recebido ? 'Sim' : 'Não',
    'Passagem Aérea':    r.passagem_aerea === 'nao' ? 'Não' : r.passagem_aerea === 'pendente' ? 'Pendente' : 'Emitida',
    'Chamado Hosp/Pass': r.chamado_hospedagem || '',
    'Status':            r.status || '',
    'Valor':             r.valor ? fmtMoeda(r.valor) : '',
    'Previsão Pgto':     fmtData(r.previsao_pagamento),
    'Descrição':         r.descricao || '',
    'Observações':       r.observacoes || '',
  }))
  addSheet(wb, XLSX, rowsDiarias, 'Diárias')

  // ── 8. CONSULTORIA ────────────────────────────────────────────────────────
  onProgress?.('Consultoria...')
  const [{ data: kickoffs }, { data: sebraetec }, { data: diretas }] = await Promise.all([
    supabase.from('kickoffs').select('*').order('data_kickoff', { ascending: false }),
    supabase.from('sebraetec').select('*').order('created_at', { ascending: false }),
    supabase.from('diretas').select('*').order('created_at', { ascending: false }),
  ])

  const rowsBP = (kickoffs || []).map(r => ({
    'Modalidade':          'B+P',
    'ID SGT':              r.id_sgt || '',
    'Empresa':             r.empresa || '',
    'Consultor':           r.consultor || '',
    'Porte':               r.porte || '',
    'Data Kick Off':       fmtData(r.data_kickoff),
    'Horas KO':            r.horas_kickoff || r.horas || '',
    'Status KO':           r.status === 'aguardando_cronograma' ? 'Ag. Cronograma' : r.status === 'pendente' ? 'Pendente' : r.status === 'apropriado' ? 'Apropriado' : r.status || '',
    'Status Atendimento':  r.status_atendimento === 'nao_iniciado' ? 'Não iniciado' : r.status_atendimento === 'em_execucao' ? 'Em execução' : r.status_atendimento === 'concluido' ? 'Concluído' : r.status_atendimento || '',
    'Data Encerramento':   fmtData(r.data_encerramento),
  }))

  const rowsSEB = (sebraetec || []).map(r => ({
    'Modalidade':         'Sebraetec',
    'ID SGT':             r.id_sgt || '',
    'Nº Proposta':        r.numero_proposta || '',
    'Empresa':            r.empresa || '',
    'Consultor':          r.consultor || '',
    'Horas Totais':       r.horas_total || '',
    'Receita Prevista':   r.receita ? fmtMoeda(r.receita) : '',
    'Status':             r.status === 'aguardando' ? 'Aguardando' : r.status === 'em_execucao' ? 'Em execução' : r.status === 'concluido' ? 'Concluído' : r.status === 'cancelado' ? 'Cancelado' : r.status || '',
    'Motivo Pendência':   r.motivo_pendencia || '',
    'Data Conclusão':     fmtData(r.data_conclusao),
  }))

  const rowsDIR = (diretas || []).map(r => ({
    'Modalidade':         'Direta',
    'ID SGT':             r.id_sgt || '',
    'Nº Proposta':        r.numero_proposta || '',
    'Empresa':            r.empresa || '',
    'Consultor':          r.consultor || '',
    'Horas Totais':       r.horas_total || '',
    'Receita Prevista':   r.receita ? fmtMoeda(r.receita) : '',
    'Status':             r.status === 'aguardando' ? 'Aguardando' : r.status === 'em_execucao' ? 'Em execução' : r.status === 'concluido' ? 'Concluído' : r.status === 'cancelado' ? 'Cancelado' : r.status || '',
    'Status NF':          r.status_nf === 'pendente' ? 'NF Pendente' : r.status_nf === 'solicitada' ? 'NF Solicitada' : r.status_nf === 'emitida' ? 'NF Emitida' : r.status_nf || '',
    'Data Conclusão':     fmtData(r.data_conclusao),
  }))

  addSheet(wb, XLSX, [...rowsBP, ...rowsSEB, ...rowsDIR], 'Consultoria')

  // ── 9. ABAS MANUAIS (templates em branco) ─────────────────────────────────
  const templatePCP = [
    { 'Processo/Item': '', 'Empresa/Contato': '', 'Status': '', 'Pendência': '', 'Prazo': '', 'Próxima Ação': '', 'Responsável (quem assume)': '', 'Observações': '' }
  ]
  const templateSGT = [
    { 'ID SGT': '', 'Empresa': '', 'Modalidade': '', 'Status no SGT': '', 'Pendência': '', 'Prazo': '', 'Próxima Ação': '', 'Observações': '' }
  ]
  const templateTratativas = [
    { 'Assunto': '', 'Contato/Área': '', 'Data Último Contato': '', 'Status': '', 'Pendência': '', 'Prazo': '', 'Próxima Ação': '', 'Observações': '' }
  ]
  const templateAtendimentos = [
    { 'Empresa/Cliente': '', 'Tipo': '', 'Consultor': '', 'Status': '', 'Pendência': '', 'Prazo Conclusão': '', 'Próxima Ação': '', 'Observações': '' }
  ]

  addSheet(wb, XLSX, templatePCP, 'PCP (preencher)')
  addSheet(wb, XLSX, templateSGT, 'SGT (preencher)')
  addSheet(wb, XLSX, templateTratativas, 'Tratativas Financeiro (preencher)')
  addSheet(wb, XLSX, templateAtendimentos, 'Atendimentos (preencher)')

  // ── Gerar arquivo ─────────────────────────────────────────────────────────
  const data  = new Date()
  const stamp = `${data.getFullYear()}${String(data.getMonth()+1).padStart(2,'0')}${String(data.getDate()).padStart(2,'0')}`
  XLSX.writeFile(wb, `IndustrialOS_Transicao_${stamp}.xlsx`)
}
