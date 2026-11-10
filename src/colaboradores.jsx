import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from './supabase'

function fmtData(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function periodoAtivo(ferias) {
  if (!ferias || ferias.length === 0) return null
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  return ferias.find(f => {
    const ini = new Date(f.data_inicio + 'T00:00:00')
    const fim = new Date(f.data_fim + 'T00:00:00')
    return hoje >= ini && hoje <= fim
  }) || null
}

const S = {
  wrap:       { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:      { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub:        { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  btn:        { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px var(--blue-glow)' },
  btnSm:      { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnFerias:  { background: 'rgba(245,158,11,.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 },
  btnDanger:  { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  tableWrap:  { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px var(--shadow)' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' },
  td:         { padding: '12px 16px', fontSize: 13, color: 'var(--text2)', borderBottom: '1px solid var(--border)' },
  modal:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox:   { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalBoxLg: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 4 },
  modalSub:   { fontSize: 12, color: 'var(--muted)', marginBottom: 18 },
  field:      { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  fieldRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  label:      { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input:      { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel:       { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  textarea:   { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', minHeight: 60, resize: 'vertical' },
  row:        { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  sectionLbl: { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
  feriasItem: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 12 },
  emFerias:   { display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(245,158,11,.12)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,.2)' },
}

function badgeAtivo(a, emFerias) {
  if (emFerias) return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,.12)', color: 'var(--amber)' }}>● Em férias</span>
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: a ? 'var(--green-dim)' : 'var(--red-dim)', color: a ? 'var(--green)' : 'var(--red)' }}>{a ? '● Ativo' : '● Inativo'}</span>
}

function badgeKit(nome) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--blue-dim)', color: 'var(--blue)' }}>{nome}</span>
}

const CARGOS_PERMITIDOS = [
  'DESIGNER',
  'DESENVOLVEDOR',
  'PESQUISADOR INDUSTRIAL',
  'COORDENADOR DE INOVAÇÃO E TECNOLOGIA',
  'GERENTE DE INOVAÇÃO E TECNOLOGIA',
  'BOLSISTA',
]

function normalizarCargo(cargo) {
  const texto = String(cargo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  if (texto.includes('designer')) return 'DESIGNER'
  if (texto.includes('desenvolvedor')) return 'DESENVOLVEDOR'
  if (texto.includes('pesquisador')) return 'PESQUISADOR INDUSTRIAL'
  if (texto.includes('coordenador') && texto.includes('inovacao') && texto.includes('tecnologia')) return 'COORDENADOR DE INOVAÇÃO E TECNOLOGIA'
  if (texto.includes('gerente') && texto.includes('inovacao') && texto.includes('tecnologia')) return 'GERENTE DE INOVAÇÃO E TECNOLOGIA'
  if (texto.includes('bolsista')) return 'BOLSISTA'
  return String(cargo || '').trim()
}

function resolverKitPorCargo(cargo, kits) {
  const cargoNormalizado = normalizarCargo(cargo)
  const permitidos = CARGOS_PERMITIDOS.map(c => c.toLowerCase())

  if (!permitidos.includes(cargoNormalizado.toLowerCase())) return null

  const kitPesquisador = kits.find(k =>
    String(k.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === 'pesquisador industrial'
  )

  if (['DESENVOLVEDOR', 'PESQUISADOR INDUSTRIAL', 'COORDENADOR DE INOVAÇÃO E TECNOLOGIA', 'GERENTE DE INOVAÇÃO E TECNOLOGIA', 'BOLSISTA'].includes(cargoNormalizado)) {
    return kitPesquisador?.id || null
  }

  if (cargoNormalizado === 'DESIGNER') {
    const kitDesigner = kits.find(k =>
      String(k.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === 'designer'
    )
    return kitDesigner?.id || null
  }

  return null
}

export default function Colaboradores() {
  const [lista, setLista]         = useState([])
  const [todasFerias, setTodasFerias] = useState([])
  const [kits, setKits]           = useState([])
  const [modal, setModal]         = useState(false)
  const [modalFerias, setModalFerias] = useState(false)
  const [colabFerias, setColabFerias] = useState(null) // colaborador selecionado para férias
  const [ferias, setFerias]       = useState([])       // férias do colaborador selecionado
  const [editando, setEditando]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [form, setForm]           = useState({ nome: '', setor: '', cargo: '', kit_id: '' })
  const [formFerias, setFormFerias] = useState({ data_inicio: '', data_fim: '', observacoes: '' })
  const [salvando, setSalvando]   = useState(false)
  const [salvandoFerias, setSalvandoFerias] = useState(false)
  const [limpandoBase, setLimpandoBase] = useState(false)
  const [importando, setImportando] = useState(false)
  const [erroFerias, setErroFerias] = useState('')
  const [erroImport, setErroImport] = useState('')

  function normalizarTexto(valor) {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  }

  function valorLinha(row, aliases) {
    const chaves = Object.keys(row || {})
    for (const alias of aliases) {
      const chave = chaves.find(k => normalizarTexto(k) === normalizarTexto(alias))
      if (chave && row[chave] !== null && row[chave] !== undefined && String(row[chave]).trim() !== '') return row[chave]
    }
    return ''
  }

  function parseDateValue(valor) {
    if (!valor && valor !== 0) return ''
    if (valor instanceof Date) return valor.toISOString().slice(0, 10)
    if (typeof valor === 'number') {
      const parsed = XLSX.SSF.parse_date_code(valor)
      if (parsed) return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m + 1).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
    }
    const texto = String(valor).trim()
    if (!texto) return ''
    return texto
  }

  function parseBoolean(valor) {
    if (valor === undefined || valor === null || valor === '') return true
    if (typeof valor === 'boolean') return valor
    const texto = normalizarTexto(valor)
    return !['nao', 'não', 'n', '0', 'false', 'inativo', 'desativado', 'cancelado'].includes(texto)
  }

  async function importarExcelColaboradores(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setImportando(true)
    setErroImport('')

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheetName = workbook.SheetNames.find((nome) => {
        const texto = normalizarTexto(nome)
        return texto.includes('colaborador') || texto.includes('funcionario') || texto.includes('pessoa')
      })

      if (!sheetName) throw new Error('Nenhuma aba de colaboradores foi encontrada na planilha.')

      const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
      let total = 0

      for (const linha of linhas) {
        const nome = String(valorLinha(linha, ['nome', 'nome_completo', 'colaborador', 'funcionario']) || '').trim()
        if (!nome) continue

        const matricula = String(valorLinha(linha, ['matricula', 'matrícula']) || '').trim()
        const setor = String(valorLinha(linha, ['setor', 'area', 'departamento']) || '').trim()
        const cargo = normalizarCargo(String(valorLinha(linha, ['cargo', 'funcao', 'função']) || '').trim())
        const kitNome = String(valorLinha(linha, ['kit', 'kit_epi', 'epi_kit']) || '').trim()
        const ativo = parseBoolean(valorLinha(linha, ['ativo', 'status', 'situacao']))

        let kitId = resolverKitPorCargo(cargo, kits)

        if (!kitId && kitNome) {
          const { data: kitExistente } = await supabase.from('epi_kits').select('id').eq('nome', kitNome).maybeSingle()
          if (kitExistente) {
            kitId = kitExistente.id
          } else {
            const { data: kitNovo, error: erroKit } = await supabase.from('epi_kits').insert({ nome: kitNome, ativo: true }).select('id').single()
            if (!erroKit && kitNovo) kitId = kitNovo.id
          }
        }

        const payload = {
          nome: nome.toUpperCase().trim(),
          setor,
          cargo,
          kit_id: kitId,
          ativo,
        }

        if (matricula) payload.matricula = matricula

        let resultado
        if (matricula) {
          resultado = await supabase.from('colaboradores').upsert(payload, { onConflict: 'matricula' })
        } else {
          const { data: existente } = await supabase.from('colaboradores').select('id').eq('nome', payload.nome).maybeSingle()
          if (existente) {
            resultado = await supabase.from('colaboradores').update(payload).eq('id', existente.id)
          } else {
            resultado = await supabase.from('colaboradores').insert(payload)
          }
        }

        if (resultado.error) throw new Error(resultado.error.message)
        total += 1
      }

      setErroImport(`Importação concluída: ${total} colaboradores carregados.`)
      carregar()
    } catch (erro) {
      setErroImport('Erro ao importar colaboradores: ' + erro.message)
    } finally {
      setImportando(false)
      event.target.value = ''
    }
  }

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const [colab, kitsData, feriasData] = await Promise.all([
      supabase.from('colaboradores').select('*, epi_kits(nome)').order('nome'),
      supabase.from('epi_kits').select('*').eq('ativo', true).order('nome'),
      supabase.from('colaborador_ferias').select('*').order('data_inicio'),
    ])
    setLista(colab.data || [])
    setKits(kitsData.data || [])
    setTodasFerias(feriasData.data || [])
    setLoading(false)
  }

  function gerarMatricula() { return 'MAT-' + String(Math.floor(Math.random() * 9000) + 1000) }

  function abrirNovo()    { setEditando(null); setForm({ nome: '', setor: '', cargo: '', kit_id: '' }); setModal(true) }
  function abrirEditar(c) { setEditando(c); setForm({ nome: c.nome, setor: c.setor || '', cargo: normalizarCargo(c.cargo || ''), kit_id: c.kit_id || '' }); setModal(true) }

  async function abrirFerias(c) {
    setColabFerias(c)
    setErroFerias('')
    setFormFerias({ data_inicio: '', data_fim: '', observacoes: '' })
    const { data } = await supabase.from('colaborador_ferias').select('*').eq('colaborador_id', c.id).order('data_inicio')
    setFerias(data || [])
    setModalFerias(true)
  }

  async function salvarPeriodoFerias() {
    if (!formFerias.data_inicio || !formFerias.data_fim) { setErroFerias('Informe as datas de início e fim.'); return }
    if (formFerias.data_fim < formFerias.data_inicio) { setErroFerias('Data de fim não pode ser anterior ao início.'); return }
    setSalvandoFerias(true); setErroFerias('')
    const { error } = await supabase.from('colaborador_ferias').insert({
      colaborador_id: colabFerias.id,
      data_inicio:    formFerias.data_inicio,
      data_fim:       formFerias.data_fim,
      observacoes:    formFerias.observacoes || null,
    })
    if (error) { setErroFerias('Erro: ' + error.message); setSalvandoFerias(false); return }
    const { data } = await supabase.from('colaborador_ferias').select('*').eq('colaborador_id', colabFerias.id).order('data_inicio')
    setFerias(data || [])
    // atualizar cache global
    const { data: all } = await supabase.from('colaborador_ferias').select('*').order('data_inicio')
    setTodasFerias(all || [])
    setFormFerias({ data_inicio: '', data_fim: '', observacoes: '' })
    setSalvandoFerias(false)
  }

  async function excluirFerias(id) {
    if (!confirm('Excluir este período de férias?')) return
    await supabase.from('colaborador_ferias').delete().eq('id', id)
    const { data } = await supabase.from('colaborador_ferias').select('*').eq('colaborador_id', colabFerias.id).order('data_inicio')
    setFerias(data || [])
    const { data: all } = await supabase.from('colaborador_ferias').select('*').order('data_inicio')
    setTodasFerias(all || [])
  }

  async function salvar() {
    if (!form.nome.trim()) return
    setSalvando(true)
    const cargoFinal = normalizarCargo(form.cargo)
    const kitIdFinal = resolverKitPorCargo(cargoFinal, kits) || form.kit_id || null

    if (editando) {
      await supabase.from('colaboradores').update({ nome: form.nome.toUpperCase().trim(), setor: form.setor.trim(), cargo: cargoFinal, kit_id: kitIdFinal }).eq('id', editando.id)
    } else {
      await supabase.from('colaboradores').insert({ nome: form.nome.toUpperCase().trim(), matricula: gerarMatricula(), setor: form.setor.trim(), cargo: cargoFinal, kit_id: kitIdFinal, ativo: true })
    }
    setForm({ nome: '', setor: '', cargo: '', kit_id: '' })
    setModal(false); setEditando(null); setSalvando(false); carregar()
  }

  async function toggleAtivo(id, ativo) {
    await supabase.from('colaboradores').update({ ativo: !ativo }).eq('id', id)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir este colaborador?')) return

    const deletes = [
      supabase.from('colaborador_ferias').delete().eq('colaborador_id', id),
      supabase.from('alocacao_notas').delete().eq('colaborador_id', id),
      supabase.from('epis').delete().eq('colaborador_id', id),
      supabase.from('saidas_veiculos').delete().eq('colaborador_id', id),
      supabase.from('revisoes_veiculos').delete().eq('responsavel_id', id),
      supabase.from('ocorrencias_veiculos').delete().eq('colaborador_id', id),
    ]

    const resultados = await Promise.allSettled(deletes)
    const erroDelete = resultados.find(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error))
    if (erroDelete?.status === 'fulfilled' && erroDelete.value?.error) {
      console.error('Erro ao limpar dependências do colaborador:', erroDelete.value.error)
    }
    if (erroDelete?.status === 'rejected') {
      console.error('Erro ao limpar dependências do colaborador:', erroDelete.reason)
    }

    const { error } = await supabase.from('colaboradores').delete().eq('id', id)
    if (error) {
      alert('Não foi possível excluir o colaborador: ' + error.message)
      return
    }

    carregar()
  }

  async function limparBase() {
    if (!confirm('Tem certeza que deseja remover todos os colaboradores e os registros relacionados? Esta ação limpa a base.')) return

    setLimpandoBase(true)

    const { data: todos, error: selError } = await supabase.from('colaboradores').select('id')
    if (selError) {
      alert('Não foi possível carregar os colaboradores para limpar a base: ' + selError.message)
      setLimpandoBase(false)
      return
    }

    const ids = (todos || []).map(c => c.id)
    if (ids.length === 0) {
      setLimpandoBase(false)
      return
    }

    const deletes = [
      supabase.from('colaborador_ferias').delete().in('colaborador_id', ids),
      supabase.from('alocacao_notas').delete().in('colaborador_id', ids),
      supabase.from('epis').delete().in('colaborador_id', ids),
      supabase.from('saidas_veiculos').delete().in('colaborador_id', ids),
      supabase.from('revisoes_veiculos').delete().in('responsavel_id', ids),
      supabase.from('ocorrencias_veiculos').delete().in('colaborador_id', ids),
    ]

    const resultados = await Promise.allSettled(deletes)
    const erroDelete = resultados.find(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error))
    if (erroDelete?.status === 'fulfilled' && erroDelete.value?.error) {
      console.error('Erro ao limpar registros dependentes da base:', erroDelete.value.error)
    }
    if (erroDelete?.status === 'rejected') {
      console.error('Erro ao limpar registros dependentes da base:', erroDelete.reason)
    }

    const { error: delError } = await supabase.from('colaboradores').delete().in('id', ids)
    if (delError) {
      alert('Não foi possível limpar a base: ' + delError.message)
      setLimpandoBase(false)
      return
    }

    setLimpandoBase(false)
    carregar()
  }

  const trHover = { onMouseEnter: e => e.currentTarget.style.background = 'var(--subtle)', onMouseLeave: e => e.currentTarget.style.background = 'transparent' }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Colaboradores</div>
          <div style={S.sub}>Cadastro e gestão de equipe</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label style={{ ...S.btnSm, background: 'var(--subtle)', color: 'var(--text2)', borderColor: 'var(--border2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {importando ? 'Importando...' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xls" hidden onChange={importarExcelColaboradores} disabled={importando} />
          </label>
          <button style={{ ...S.btnSm, background: 'var(--red-dim)', color: 'var(--red)', borderColor: 'rgba(239,68,68,.2)' }} onClick={limparBase} disabled={limpandoBase}>
            {limpandoBase ? 'Limpando...' : 'Limpar base'}
          </button>
          <button style={S.btn} onClick={abrirNovo}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Colaborador
          </button>
        </div>
      </div>

      {erroImport && (
        <div style={{ background: erroImport.startsWith('Erro') ? 'var(--red-dim)' : 'var(--green-dim)', border: '1px solid ' + (erroImport.startsWith('Erro') ? 'rgba(239,68,68,.2)' : 'rgba(16,185,129,.2)'), color: erroImport.startsWith('Erro') ? 'var(--red)' : 'var(--green)', borderRadius: 8, padding: '10px 12px', marginBottom: 18, fontSize: 12 }}>{erroImport}</div>
      )}

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: 40, textAlign: 'center' }}>Carregando...</div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Nome</th>
                <th style={S.th}>Matrícula</th>
                <th style={S.th}>Setor</th>
                <th style={S.th}>Cargo</th>
                <th style={S.th}>Kit EPI</th>
                <th style={S.th}>Status</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {lista.map(c => {
                const feriasDeste = todasFerias.filter(f => f.colaborador_id === c.id)
                const emFerias    = !!periodoAtivo(feriasDeste)
                const proxFerias  = feriasDeste.find(f => {
                  const ini = new Date(f.data_inicio + 'T00:00:00')
                  const hoje = new Date(); hoje.setHours(0,0,0,0)
                  const diff = Math.ceil((ini - hoje) / 86400000)
                  return diff > 0 && diff <= 30
                })
                return (
                  <tr key={c.id} {...trHover}>
                    <td style={{ ...S.td, color: 'var(--text)', fontWeight: 600 }}>
                      {c.nome}
                      {emFerias && <span style={{ ...S.emFerias, marginLeft: 8 }}>em férias</span>}
                      {!emFerias && proxFerias && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--amber)' }}>
                          férias em {Math.ceil((new Date(proxFerias.data_inicio + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000)} dias
                        </span>
                      )}
                    </td>
                    <td style={{ ...S.td, fontFamily: 'DM Mono, monospace', color: 'var(--blue)', fontSize: 12 }}>{c.matricula}</td>
                    <td style={S.td}>{c.setor || '—'}</td>
                    <td style={S.td}>{c.cargo || '—'}</td>
                    <td style={S.td}>{c.epi_kits ? badgeKit(c.epi_kits.nome) : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                    <td style={S.td}>{badgeAtivo(c.ativo, emFerias)}</td>
                    <td style={{ ...S.td, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button style={S.btnSm} onClick={() => abrirEditar(c)}>Editar</button>
                        <button style={S.btnFerias} onClick={() => abrirFerias(c)}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Férias {feriasDeste.length > 0 && `(${feriasDeste.length})`}
                        </button>
                        <button style={S.btnSm} onClick={() => toggleAtivo(c.id, c.ativo)}>{c.ativo ? 'Desativar' : 'Reativar'}</button>
                        <button style={S.btnDanger} onClick={() => excluir(c.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {lista.length === 0 && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Nenhum colaborador cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL COLABORADOR ──────────────────────────────────────────────── */}
      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editando ? 'Editar Colaborador' : 'Novo Colaborador'}</div>
            <div style={S.field}><label style={S.label}>Nome completo *</label><input style={S.input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: JOÃO DA SILVA" /></div>
            <div style={S.field}><label style={S.label}>Cargo</label>
              <select style={S.fsel} value={form.cargo || ''} onChange={e => {
                const cargo = normalizarCargo(e.target.value)
                setForm({ ...form, cargo, kit_id: resolverKitPorCargo(cargo, kits) || '' })
              }}>
                <option value="">Selecione o cargo...</option>
                {CARGOS_PERMITIDOS.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Setor</label><input style={S.input} value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} placeholder="Ex: Energia" /></div>
            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModal(false)}>Cancelar</button>
              <button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL FÉRIAS ───────────────────────────────────────────────────── */}
      {modalFerias && colabFerias && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalFerias(false)}>
          <div style={S.modalBoxLg}>
            <div style={S.modalTitle}>Férias — {colabFerias.nome}</div>
            <div style={S.modalSub}>Gerencie os períodos de férias deste colaborador</div>

            {/* Períodos existentes */}
            {ferias.length > 0 ? (
              <>
                <div style={S.sectionLbl}>Períodos cadastrados</div>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, padding: '6px 0', fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    <span>Início</span><span>Fim</span><span>Observações</span><span></span>
                  </div>
                  {ferias.map(f => {
                    const hoje = new Date(); hoje.setHours(0,0,0,0)
                    const ini  = new Date(f.data_inicio + 'T00:00:00')
                    const fim  = new Date(f.data_fim + 'T00:00:00')
                    const ativo = hoje >= ini && hoje <= fim
                    const futuro = ini > hoje
                    return (
                      <div key={f.id} style={{ ...S.feriasItem, background: ativo ? 'rgba(245,158,11,.04)' : 'transparent', borderRadius: ativo ? 6 : 0 }}>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: ativo ? 'var(--amber)' : 'var(--text2)' }}>{fmtData(f.data_inicio)}</span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: ativo ? 'var(--amber)' : 'var(--text2)' }}>{fmtData(f.data_fim)}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ativo && <span style={S.emFerias}>Em andamento</span>}
                          {futuro && !ativo && <span style={{ color: 'var(--blue)', fontSize: 10 }}>Futuro</span>}
                          {!ativo && !futuro && <span style={{ color: 'var(--muted)', fontSize: 10 }}>Passado</span>}
                          {f.observacoes && <span style={{ marginLeft: 6 }}>{f.observacoes}</span>}
                        </span>
                        <button style={S.btnDanger} onClick={() => excluirFerias(f.id)}>✕</button>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18, padding: '12px 0' }}>Nenhum período cadastrado ainda.</div>
            )}

            {/* Adicionar novo período */}
            <div style={S.sectionLbl}>Adicionar período</div>
            {erroFerias && <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '8px 12px', color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{erroFerias}</div>}
            <div style={S.fieldRow}>
              <div style={S.field}><label style={S.label}>Data de início *</label><input type="date" style={S.input} value={formFerias.data_inicio} onChange={e => setFormFerias({ ...formFerias, data_inicio: e.target.value })} /></div>
              <div style={S.field}><label style={S.label}>Data de fim *</label><input type="date" style={S.input} value={formFerias.data_fim} onChange={e => setFormFerias({ ...formFerias, data_fim: e.target.value })} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Observações (opcional)</label><textarea style={S.textarea} value={formFerias.observacoes} onChange={e => setFormFerias({ ...formFerias, observacoes: e.target.value })} placeholder="Ex: Férias coletivas, primeira parcela..." /></div>

            <div style={S.row}>
              <button style={S.btnSm} onClick={() => setModalFerias(false)}>Fechar</button>
              <button style={S.btn} onClick={salvarPeriodoFerias} disabled={salvandoFerias}>{salvandoFerias ? 'Salvando...' : 'Adicionar período'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
