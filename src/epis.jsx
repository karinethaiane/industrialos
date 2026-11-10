import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from './supabase'

const S = {
  wrap: { padding: 32, background: 'var(--bg)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' },
  sub: { fontSize: 13, color: 'var(--muted)', marginTop: 3 },
  btn: { background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px var(--blue-glow)', whiteSpace: 'nowrap' },
  btnSm: { background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  btnBlue: { background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid transparent', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnGray: { background: 'var(--subtle)', border: '1px solid var(--border2)', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 18 },
  statCard: () => ({ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px var(--shadow)' }),
  statBar: (cor) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: cor, opacity: .5 }),
  statVal: (cor) => ({ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 500, color: cor, lineHeight: 1, marginBottom: 5 }),
  statLbl: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 },
  tab: (on) => ({ padding: '9px 18px', fontSize: 13, fontWeight: on ? 600 : 500, cursor: 'pointer', color: on ? 'var(--blue)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: on ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, fontFamily: 'inherit', transition: 'all .15s' }),
  toolbar: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  sbox: { display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 12px', flex: 1, minWidth: 180 },
  sinp: { background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', width: '100%' },
  sel: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', color: 'var(--text2)', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalBoxLg: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px var(--shadow)' },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 6 },
  modalSub: { fontSize: 12, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text2)' },
  input: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },
  fsel: { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', cursor: 'pointer' },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 },
  proxBox: { background: 'var(--surface2)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 14 },
  proxLbl: { fontSize: 11, color: 'var(--blue)', fontWeight: 700, marginBottom: 4 },
  colabCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 10, overflow: 'hidden' },
  colabCardHeader: { padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' },
  colabCardName: { fontWeight: 600, fontSize: 14, color: 'var(--text)' },
  colabCardMat: { fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 },
  checkItem: (ok) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderTop: '1px solid var(--border)', background: ok ? 'transparent' : 'rgba(239,68,68,.03)' }),
  checkIcon: (ok) => ({ width: 20, height: 20, borderRadius: '50%', background: ok ? 'var(--green-dim)' : 'var(--red-dim)', color: ok ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }),
}

function calcStatus(dataProx) {
  if (!dataProx) return 'VENCIDO'
  const dias = Math.floor((new Date(dataProx) - new Date()) / 86400000)
  if (dias < 0) return 'VENCIDO'
  if (dias <= 30) return 'VENCENDO'
  return 'VIGENTE'
}

function fmtData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

// ── Compara EPI entregue com item do kit considerando grupo de equivalência ──
function epiMatchComGrupo(epiTipo, kitItemNome, catalogoList) {
  // match direto por nome
  const na = normalizar(epiTipo), nb = normalizar(kitItemNome)
  if (na.includes(nb) || nb.includes(na)) return true
  // match por grupo_equivalencia
  const itemCat  = catalogoList.find(c => normalizar(c.nome) === na)
  const kitCat   = catalogoList.find(c => normalizar(c.nome) === nb)
  if (itemCat?.grupo_equivalencia && kitCat?.grupo_equivalencia)
    return itemCat.grupo_equivalencia === kitCat.grupo_equivalencia
  return false
}

function Badge({ status }) {
  const cfg = {
    VIGENTE:  { bg: 'var(--green-dim)', c: 'var(--green)',  l: '● Vigente' },
    VENCENDO: { bg: 'var(--amber-dim)', c: 'var(--amber)',  l: '⚠ Vencendo' },
    VENCIDO:  { bg: 'var(--red-dim)',   c: 'var(--red)',    l: '✕ Vencido' },
  }[status] || { bg: 'var(--subtle)', c: 'var(--muted)', l: status }
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.c, whiteSpace: 'nowrap' }}>{cfg.l}</span>
}

function ultimasEntregas(epis) {
  const map = {}
  epis.forEach(e => {
    const key = `${e.colaborador_id}__${normalizar(e.tipo)}`
    if (!map[key] || new Date(e.data_entrega) > new Date(map[key].data_entrega)) map[key] = e
  })
  return Object.values(map)
}

export default function Epis({ isAdmin = false }) {
  const [epis, setEpis] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [kitItens, setKitItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('entregas')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [modalHist, setModalHist] = useState(null)
  const [historico, setHistorico] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [buscaCheck, setBuscaCheck] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [expandidosOk, setExpandidosOk] = useState({})
  const [almoExpanded, setAlmoExpanded] = useState(true)
  const [form, setForm] = useState({ colaborador_id: '', catalogo_id: '', data_entrega: '', quantidade: 1, motivo: '', ca: '' })
  const [editForm, setEditForm] = useState({ data_entrega: '', quantidade: 1, ca: '', motivo: '', data_prox_entrega: '' })
  const [proxEntrega, setProxEntrega] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [importando, setImportando] = useState(false)
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

  async function importarExcelEntregas(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setImportando(true)
    setErroImport('')

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheetName = workbook.SheetNames.find((nome) => {
        const texto = normalizarTexto(nome)
        return texto.includes('entrega') || texto.includes('epi') || texto.includes('itens')
      })

      if (!sheetName) throw new Error('Nenhuma aba de entregas de EPIs foi encontrada na planilha.')

      const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
      let total = 0

      for (const linha of linhas) {
        const nomeColab = String(valorLinha(linha, ['nome', 'nome_completo', 'colaborador', 'funcionario']) || '').trim()
        const matricula = String(valorLinha(linha, ['matricula', 'matrícula']) || '').trim()
        const tipo = String(valorLinha(linha, ['tipo', 'epi', 'nome_epi', 'produto', 'item']) || '').trim()
        const dataEntrega = parseDateValue(valorLinha(linha, ['data_entrega', 'data_de_entrega', 'entrega']))

        if (!nomeColab && !matricula) continue
        if (!tipo || !dataEntrega) continue

        let colaborador = null
        if (matricula) {
          const { data } = await supabase.from('colaboradores').select('*').eq('matricula', matricula).limit(1)
          colaborador = data?.[0] || null
        }

        if (!colaborador && nomeColab) {
          const { data } = await supabase.from('colaboradores').select('*').ilike('nome', `%${nomeColab}%`).limit(1)
          colaborador = data?.[0] || null
        }

        if (!colaborador) {
          const payload = {
            nome: nomeColab.toUpperCase().trim(),
            matricula: matricula || `MAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            ativo: true,
          }
          const { data: dataColab, error: erroColab } = await supabase.from('colaboradores').insert(payload).select('*').single()
          if (erroColab) throw new Error(erroColab.message)
          colaborador = dataColab
        }

        const quantidade = Number(String(valorLinha(linha, ['quantidade', 'qtd']) || '1').replace(',', '.')) || 1
        const motivo = String(valorLinha(linha, ['motivo', 'justificativa']) || '').trim()
        const ca = String(valorLinha(linha, ['ca', 'numero_ca', 'n_ca']) || '').trim()
        const proxEntrega = parseDateValue(valorLinha(linha, ['data_prox_entrega', 'proxima_entrega', 'data_vencimento', 'vencimento'])) || dataEntrega

        const { data: existente } = await supabase
          .from('epis')
          .select('id')
          .eq('colaborador_id', colaborador.id)
          .eq('tipo', tipo)
          .eq('data_entrega', dataEntrega)
          .maybeSingle()

        const payload = {
          colaborador_id: colaborador.id,
          tipo,
          quantidade,
          data_entrega: dataEntrega,
          data_vencimento: proxEntrega,
          data_prox_entrega: proxEntrega,
          motivo: motivo || null,
          ca: ca || null,
          registrado_por: 'importacao',
        }

        if (existente) {
          const { error } = await supabase.from('epis').update(payload).eq('id', existente.id)
          if (error) throw new Error(error.message)
        } else {
          const { error } = await supabase.from('epis').insert(payload)
          if (error) throw new Error(error.message)
        }

        total += 1
      }

      setErroImport(`Importação concluída: ${total} entregas de EPIs carregadas.`)
      init()
    } catch (erro) {
      setErroImport('Erro ao importar entregas de EPIs: ' + erro.message)
    } finally {
      setImportando(false)
      event.target.value = ''
    }
  }

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    const [e, cat, col, ki] = await Promise.all([
      supabase.from('epis').select('*, colaboradores(nome, matricula)').order('data_entrega', { ascending: false }),
      supabase.from('epis_catalogo').select('*').eq('ativo', true).order('nome'),
      supabase.from('colaboradores').select('*, epi_kits(id, nome)').eq('ativo', true).order('nome'),
      supabase.from('epi_kit_itens').select('*'),
    ])
    setEpis(e.data || [])
    setCatalogo(cat.data || [])
    setColaboradores(col.data || [])
    setKitItens(ki.data || [])
    setLoading(false)
  }

  // ── Calcula próxima entrega: prazo_dias × quantidade ─────────────────────
  function calcProxEntrega(catalogoId, dataEntrega, qtd) {
    const item = catalogo.find(c => c.id === catalogoId)
    if (!item || !dataEntrega) return null
    const quantidade = parseInt(qtd) || 1
    const totalDias  = item.prazo_dias * quantidade
    const d = new Date(dataEntrega + 'T00:00:00')
    d.setDate(d.getDate() + totalDias)
    return d.toISOString().split('T')[0]
  }

  // ── Info do cálculo para exibir no modal ─────────────────────────────────
  function calcInfo(catalogoId, qtd) {
    const item = catalogo.find(c => c.id === catalogoId)
    if (!item) return null
    const quantidade = parseInt(qtd) || 1
    return { prazo: item.prazo_dias, qtd: quantidade, total: item.prazo_dias * quantidade }
  }

  // ── Recalcula proxEntrega quando muda catalogo, data ou quantidade ────────
  function recalcProx(catalogoId, dataEntrega, qtd) {
    const prox = calcProxEntrega(catalogoId, dataEntrega, qtd)
    setProxEntrega(prox)
  }

  async function salvar() {
    if (!form.colaborador_id || !form.catalogo_id || !form.data_entrega) return
    setSalvando(true)
    const item = catalogo.find(c => c.id === form.catalogo_id)
    const prox = calcProxEntrega(form.catalogo_id, form.data_entrega, form.quantidade)
    await supabase.from('epis').insert({
      colaborador_id: form.colaborador_id,
      tipo: item.nome,
      quantidade: parseInt(form.quantidade) || 1,
      data_entrega: form.data_entrega,
      data_vencimento: prox,
      data_prox_entrega: prox,
      motivo: form.motivo,
      ca: form.ca || item.ca || null,
      registrado_por: 'admin'
    })
    setForm({ colaborador_id: '', catalogo_id: '', data_entrega: '', quantidade: 1, motivo: '', ca: '' })
    setProxEntrega(null); setModal(false); setSalvando(false); init()
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    await supabase.from('epis').update({
      data_entrega: editForm.data_entrega,
      quantidade: parseInt(editForm.quantidade) || 1,
      ca: editForm.ca || null,
      motivo: editForm.motivo,
      data_prox_entrega: editForm.data_prox_entrega,
      data_vencimento: editForm.data_prox_entrega
    }).eq('id', editando.id)
    setEditando(null); setSalvando(false); init()
  }

  async function excluir(id) {
    if (!confirm('Excluir este registro?')) return
    await supabase.from('epis').delete().eq('id', id)
    init()
  }

  async function verHistorico(colab) {
    setModalHist(colab)
    const { data } = await supabase.from('epis')
      .select('*, colaboradores(nome, matricula)')
      .eq('colaborador_id', colab.id)
      .order('data_entrega', { ascending: false })
    setHistorico(data || [])
  }

  const colaboradorIdsAtivos = new Set(colaboradores.map(c => c.id))
  const episAtivos = epis.filter(e => colaboradorIdsAtivos.has(e.colaborador_id))
  const ultimas = ultimasEntregas(episAtivos)

  const porColab = colaboradores.map(c => {
    const itens = ultimas.filter(e => e.colaborador_id === c.id)
    if (!busca && itens.length === 0) return null
    if (busca && !normalizar(c.nome).includes(normalizar(busca)) && !itens.some(e => normalizar(e.tipo).includes(normalizar(busca)))) return null
    const comProblema = itens.filter(e => calcStatus(e.data_prox_entrega) !== 'VIGENTE')
    const vigentes    = itens.filter(e => calcStatus(e.data_prox_entrega) === 'VIGENTE')
    if (filtroStatus === 'PROBLEMAS' && comProblema.length === 0) return null
    if (filtroStatus === 'VIGENTE'   && comProblema.length > 0)  return null
    return { colab: c, itens, comProblema, vigentes }
  }).filter(Boolean)

  const necessidades = (() => {
    const vencidos = {}, vencendo = {}
    ultimas.forEach(e => {
      const s = calcStatus(e.data_prox_entrega)
      const colab = colaboradores.find(c => c.id === e.colaborador_id)
      if (!colab) return
      if (s === 'VENCIDO')  { if (!vencidos[e.tipo])  vencidos[e.tipo]  = []; vencidos[e.tipo].push({ colab: colab.nome, data: e.data_prox_entrega }) }
      if (s === 'VENCENDO') { if (!vencendo[e.tipo]) vencendo[e.tipo] = []; vencendo[e.tipo].push({ colab: colab.nome, data: e.data_prox_entrega }) }
    })
    return { vencidos, vencendo }
  })()

  const totalNecessidades = Object.keys(necessidades.vencidos).length + Object.keys(necessidades.vencendo).length

  const stats = {
    vigente:  ultimas.filter(e => calcStatus(e.data_prox_entrega) === 'VIGENTE').length,
    vencendo: ultimas.filter(e => calcStatus(e.data_prox_entrega) === 'VENCENDO').length,
    vencido:  ultimas.filter(e => calcStatus(e.data_prox_entrega) === 'VENCIDO').length,
  }

  // ── Checklist com equivalência por grupo ──────────────────────────────────
  const checklist = colaboradores
    .filter(c => c.epi_kits)
    .filter(c => !buscaCheck || normalizar(c.nome).includes(normalizar(buscaCheck)))
    .map(c => {
      const itensDoKit  = kitItens.filter(k => k.kit_id === c.epi_kits.id)
      const episDoColab = ultimas.filter(e => e.colaborador_id === c.id)

      const itens = itensDoKit.map(kitItem => {
        // Procura entrega que bata pelo nome OU pelo grupo de equivalência
        const entrega = episDoColab.find(e => epiMatchComGrupo(e.tipo, kitItem.epi_nome, catalogo))
        const status  = entrega ? calcStatus(entrega.data_prox_entrega) : null
        // "entregue e vigente" = realmente ok no checklist
        const ok = !!entrega && status === 'VIGENTE'
        return {
          nome: kitItem.epi_nome,
          entregue: !!entrega,
          ok,
          dataEntrega: entrega?.data_entrega,
          dataProx: entrega?.data_prox_entrega,
          status,
        }
      })

      return {
        ...c,
        itens,
        pendentes: itens.filter(i => !i.entregue).length,
        vencidos:  itens.filter(i => i.status === 'VENCIDO').length,
        vencendo:  itens.filter(i => i.status === 'VENCENDO').length,
      }
    })

  const totalPendentes = checklist.reduce((a, c) => a + c.pendentes, 0)

  function initials(nome) { return (nome || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }
  function avatarColor(st) {
    if (st === 'bad')  return 'linear-gradient(135deg,#ef4444,#f97316)'
    if (st === 'warn') return 'linear-gradient(135deg,#f59e0b,#f97316)'
    return 'linear-gradient(135deg,#3b82f6,#06b6d4)'
  }
  function cardStatus(comProblema) {
    if (comProblema.some(e => calcStatus(e.data_prox_entrega) === 'VENCIDO'))  return 'bad'
    if (comProblema.some(e => calcStatus(e.data_prox_entrega) === 'VENCENDO')) return 'warn'
    return 'ok'
  }
  const cardBorder = { bad: 'rgba(239,68,68,.5)', warn: 'rgba(245,158,11,.4)', ok: 'rgba(16,185,129,.4)' }

  const histPorTipo = historico.reduce((acc, h) => {
    if (!acc[h.tipo]) acc[h.tipo] = []
    acc[h.tipo].push(h)
    return acc
  }, {})

  // info do cálculo para o modal
  const infoCalc = (form.catalogo_id && form.quantidade) ? calcInfo(form.catalogo_id, form.quantidade) : null
  // CA padrão do catálogo selecionado
  const catalogoSelecionado = catalogo.find(c => c.id === form.catalogo_id)

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div><div style={S.title}>Gestão de EPIs</div><div style={S.sub}>Controle de entregas e validades</div></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isAdmin && (
            <label style={{ ...S.btnSm, background: 'var(--subtle)', color: 'var(--text2)', border: '1px solid var(--border2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {importando ? 'Importando...' : 'Importar Excel'}
              <input type="file" accept=".xlsx,.xls" hidden onChange={importarExcelEntregas} disabled={importando} />
            </label>
          )}
          {isAdmin && <button style={S.btn} onClick={() => setModal(true)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Registrar Entrega</button>}
        </div>
      </div>

      {erroImport && (
        <div style={{ background: erroImport.startsWith('Erro') ? 'var(--red-dim)' : 'var(--green-dim)', border: '1px solid ' + (erroImport.startsWith('Erro') ? 'rgba(239,68,68,.2)' : 'rgba(16,185,129,.2)'), color: erroImport.startsWith('Erro') ? 'var(--red)' : 'var(--green)', borderRadius: 8, padding: '10px 12px', marginBottom: 18, fontSize: 12 }}>{erroImport}</div>
      )}

      <div style={S.stats}>
        {[['var(--blue)', porColab.length, 'Colaboradores'], ['var(--green)', stats.vigente, 'Vigentes'], ['var(--amber)', stats.vencendo, 'Vencendo 30d'], ['var(--red)', stats.vencido, 'Vencidos'], ['var(--purple)', totalPendentes, 'Pendências Kit']].map(([cor, val, lbl]) => (
          <div key={lbl} style={S.statCard()}>
            <div style={S.statVal(cor)}>{val}</div>
            <div style={S.statLbl}>{lbl}</div>
            <div style={S.statBar(cor)} />
          </div>
        ))}
      </div>

      {/* Necessidades de reposição */}
      {totalNecessidades > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 18, overflow: 'hidden', boxShadow: '0 1px 6px var(--shadow)' }}>
          <div onClick={() => setAlmoExpanded(x => !x)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', cursor: 'pointer', borderBottom: almoExpanded ? '1px solid var(--border)' : 'none' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Necessidades de Reposição</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>— itens que precisam de nova entrega</span>
            <span style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginLeft: 'auto' }}>{totalNecessidades} {totalNecessidades === 1 ? 'tipo' : 'tipos'}</span>
            <span style={{ color: 'var(--muted)', fontSize: 11, display: 'inline-block', transform: almoExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
          </div>
          {almoExpanded && (
            <div>
              {Object.keys(necessidades.vencidos).length > 0 && (
                <div style={{ padding: '14px 18px', borderBottom: Object.keys(necessidades.vencendo).length > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} /> Vencidos — entrega urgente
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(necessidades.vencidos).map(([tipo, colabs]) => (
                      <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{tipo}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {colabs.map((c, i) => <span key={i} style={{ background: 'var(--subtle)', border: '1px solid var(--border2)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text2)' }}>{c.colab}</span>)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500, color: 'var(--red)', lineHeight: 1 }}>{colabs.length}</div>
                          <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 2 }}>{colabs.length === 1 ? 'unidade' : 'unidades'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {Object.keys(necessidades.vencendo).length > 0 && (
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} /> Vencendo em 30 dias — providenciar em breve
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(necessidades.vencendo).map(([tipo, colabs]) => (
                      <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{tipo}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {colabs.map((c, i) => <span key={i} style={{ background: 'var(--subtle)', border: '1px solid var(--border2)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text2)' }}>{c.colab} <span style={{ color: 'var(--amber)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>vence {fmtData(c.data)}</span></span>)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500, color: 'var(--amber)', lineHeight: 1 }}>{colabs.length}</div>
                          <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 2 }}>{colabs.length === 1 ? 'unidade' : 'unidades'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={S.tabs}>
        <button style={S.tab(aba === 'entregas')} onClick={() => setAba('entregas')}>Entregas</button>
        <button style={S.tab(aba === 'checklist')} onClick={() => setAba('checklist')}>
          Checklist de Kits {totalPendentes > 0 && <span style={{ color: 'var(--red)', marginLeft: 4 }}>({totalPendentes})</span>}
        </button>
      </div>

      {/* ══ ABA ENTREGAS ══ */}
      {aba === 'entregas' && (
        <>
          <div style={S.toolbar}>
            <div style={S.sbox}>
              <svg width="13" height="13" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={S.sinp} placeholder="Buscar colaborador ou EPI..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <select style={S.sel} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os Status</option>
              <option value="PROBLEMAS">Com problemas</option>
              <option value="VIGENTE">Todos vigentes</option>
            </select>
          </div>

          {loading ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Carregando...</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {porColab.map(({ colab, comProblema, vigentes }) => {
                const st = cardStatus(comProblema)
                const expanded = expandidosOk[colab.id]
                return (
                  <div key={colab.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${cardBorder[st]}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px var(--shadow)' }}>
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(st), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials(colab.nome)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{colab.nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>{colab.matricula}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                        {comProblema.length > 0
                          ? <><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 500, color: st === 'bad' ? 'var(--red)' : 'var(--amber)', lineHeight: 1 }}>{comProblema.length}</div><div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{st === 'bad' ? 'vencidos' : 'vencendo'}</div></>
                          : <><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 500, color: 'var(--green)', lineHeight: 1 }}>{vigentes.length}</div><div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>vigentes</div></>
                        }
                      </div>
                    </div>

                    {comProblema.length > 0 ? comProblema.map(e => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={ev => ev.currentTarget.style.background = 'var(--subtle)'}
                        onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: calcStatus(e.data_prox_entrega) === 'VENCIDO' ? 'var(--red)' : 'var(--amber)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.tipo}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: calcStatus(e.data_prox_entrega) === 'VENCIDO' ? 'var(--red)' : 'var(--amber)', fontWeight: 600, marginTop: 2 }}>{fmtData(e.data_prox_entrega)}</div>
                        </div>
                        <Badge status={calcStatus(e.data_prox_entrega)} />
                        {isAdmin && <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button style={S.btnSm} onClick={() => { setEditando(e); setEditForm({ data_entrega: e.data_entrega || '', quantidade: e.quantidade || 1, ca: e.ca || '', motivo: e.motivo || '', data_prox_entrega: e.data_prox_entrega || '' }) }}>Editar</button>
                          <button style={S.btnDanger} onClick={() => excluir(e.id)}>✕</button>
                        </div>}
                      </div>
                    )) : (
                      <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Todos os EPIs em dia
                      </div>
                    )}

                    {vigentes.length > 0 && expanded && vigentes.map(e => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid var(--border)', opacity: .75 }}
                        onMouseEnter={ev => ev.currentTarget.style.background = 'var(--subtle)'}
                        onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.tipo}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{fmtData(e.data_prox_entrega)}</div>
                        </div>
                        <Badge status="VIGENTE" />
                        {isAdmin && <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button style={S.btnSm} onClick={() => { setEditando(e); setEditForm({ data_entrega: e.data_entrega || '', quantidade: e.quantidade || 1, ca: e.ca || '', motivo: e.motivo || '', data_prox_entrega: e.data_prox_entrega || '' }) }}>Editar</button>
                          <button style={S.btnDanger} onClick={() => excluir(e.id)}>✕</button>
                        </div>}
                      </div>
                    ))}

                    {vigentes.length > 0 && (
                      <button onClick={() => setExpandidosOk(x => ({ ...x, [colab.id]: !x[colab.id] }))}
                        style={{ width: '100%', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', fontSize: 11, fontWeight: 500, color: 'var(--muted)', background: 'var(--surface2)', border: 'none', borderTop: '1px solid var(--border)', fontFamily: 'inherit' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-dim)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'var(--surface2)' }}>
                        <span style={{ display: 'inline-block', transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                        {expanded ? 'recolher itens vigentes' : `ver ${vigentes.length} ${vigentes.length === 1 ? 'item vigente' : 'itens vigentes'}`}
                      </button>
                    )}

                    <div style={{ padding: '10px 16px', display: 'flex', gap: 6, background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                      {isAdmin && <button style={S.btnBlue} onClick={() => { setForm({ colaborador_id: colab.id, catalogo_id: '', data_entrega: '', quantidade: 1, motivo: '', ca: '' }); setProxEntrega(null); setModal(true) }}>+ Entrega</button>}
                      <button style={S.btnGray} onClick={() => verHistorico(colab)}>Histórico</button>
                    </div>
                  </div>
                )
              })}
              {porColab.length === 0 && <div style={{ gridColumn: '1/-1', color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Nenhum resultado encontrado.</div>}
            </div>
          )}
        </>
      )}

      {/* ══ ABA CHECKLIST ══ */}
      {aba === 'checklist' && (
        <>
          <div style={S.toolbar}>
            <div style={S.sbox}>
              <svg width="13" height="13" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={S.sinp} placeholder="Buscar colaborador..." value={buscaCheck} onChange={e => setBuscaCheck(e.target.value)} />
            </div>
          </div>
          {checklist.map(c => (
            <div key={c.id} style={S.colabCard}>
              <div style={S.colabCardHeader} onClick={() => setExpandido(expandido === c.id ? null : c.id)}>
                <div><div style={S.colabCardName}>{c.nome}</div><div style={S.colabCardMat}>{c.matricula} · {c.epi_kits?.nome}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {c.pendentes > 0 && <span style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.pendentes} pendente{c.pendentes > 1 ? 's' : ''}</span>}
                  {c.vencidos  > 0 && <span style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.vencidos} vencido{c.vencidos > 1 ? 's' : ''}</span>}
                  {c.vencendo  > 0 && <span style={{ background: 'var(--amber-dim)', color: 'var(--amber)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.vencendo} vencendo</span>}
                  {c.pendentes === 0 && c.vencidos === 0 && c.vencendo === 0 && <span style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>✓ Tudo ok</span>}
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>{expandido === c.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandido === c.id && c.itens.map((item, i) => (
                <div key={i} style={S.checkItem(item.ok)}>
                  {/* Ícone reflete status real, não só "entregue" */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: !item.entregue ? 'var(--red-dim)' : item.status === 'VENCIDO' ? 'var(--red-dim)' : item.status === 'VENCENDO' ? 'var(--amber-dim)' : 'var(--green-dim)',
                    color: !item.entregue ? 'var(--red)' : item.status === 'VENCIDO' ? 'var(--red)' : item.status === 'VENCENDO' ? 'var(--amber)' : 'var(--green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0
                  }}>
                    {!item.entregue ? '!' : item.status === 'VIGENTE' ? '✓' : '⚠'}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{item.nome}</div>
                  {item.entregue
                    ? <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>Entregue: {fmtData(item.dataEntrega)}</div>
                        <div style={{ marginTop: 2 }}><Badge status={item.status} /></div>
                      </div>
                    : <span style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Sem registro</span>
                  }
                </div>
              ))}
            </div>
          ))}
          {checklist.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Nenhum colaborador com kit atribuído.</div>}
        </>
      )}

      {/* ══ MODAL NOVA ENTREGA ══ */}
      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Registrar Entrega de EPI</div>

            <div style={S.field}>
              <label style={S.label}>Colaborador *</label>
              <select style={S.fsel} value={form.colaborador_id} onChange={e => setForm({ ...form, colaborador_id: e.target.value })}>
                <option value="">Selecione...</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>EPI *</label>
              <select style={S.fsel} value={form.catalogo_id} onChange={e => {
                const cat = catalogo.find(c => c.id === e.target.value)
                setForm({ ...form, catalogo_id: e.target.value, ca: cat?.ca || '' })
                recalcProx(e.target.value, form.data_entrega, form.quantidade)
              }}>
                <option value="">Selecione...</option>
                {catalogo.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.prazo_dias}d/un)</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={S.field}>
                <label style={S.label}>Data da Entrega *</label>
                <input type="date" style={S.input} value={form.data_entrega} onChange={e => {
                  setForm({ ...form, data_entrega: e.target.value })
                  recalcProx(form.catalogo_id, e.target.value, form.quantidade)
                }} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Quantidade</label>
                <input type="number" min="1" style={S.input} value={form.quantidade} onChange={e => {
                  setForm({ ...form, quantidade: e.target.value })
                  recalcProx(form.catalogo_id, form.data_entrega, e.target.value)
                }} />
              </div>
            </div>

            {/* Feedback do cálculo em tempo real */}
            {proxEntrega && infoCalc && (
              <div style={S.proxBox}>
                <div style={S.proxLbl}>Cálculo da próxima entrega</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--muted)' }}>
                    {infoCalc.prazo}d × {infoCalc.qtd} un = {infoCalc.total} dias
                  </span>
                  <span style={{ color: 'var(--border2)' }}>→</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: 'var(--blue)', fontWeight: 600 }}>{fmtData(proxEntrega)}</span>
                </div>
              </div>
            )}

            <div style={S.field}>
              <label style={S.label}>Nº CA</label>
              <input style={S.input} placeholder="Ex: CA-12345" value={form.ca || ''} onChange={e => setForm({ ...form, ca: e.target.value })} />
              {catalogoSelecionado?.ca && form.ca === catalogoSelecionado.ca && (
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Preenchido automaticamente do catálogo</span>
              )}
            </div>

            <div style={S.field}>
              <label style={S.label}>Motivo</label>
              <select style={S.fsel} value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })}>
                <option value="">Selecione...</option>
                <option>1ª Entrega</option>
                <option>Substituição por vencimento</option>
                <option>Substituição por desgaste</option>
                <option>Substituição por perda</option>
                <option>Substituição por dano</option>
              </select>
            </div>

            <div style={S.row}>
              <button style={S.btnSm} onClick={() => { setModal(false); setProxEntrega(null) }}>Cancelar</button>
              <button style={S.btn} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar Entrega'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL EDITAR ══ */}
      {editando && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setEditando(null)}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>Editar Entrega</div>
            <div style={S.modalSub}>{editando.colaboradores?.nome} · {editando.tipo}</div>
            <div style={S.field}><label style={S.label}>Data da Entrega</label><input type="date" style={S.input} value={editForm.data_entrega} onChange={e => setEditForm({ ...editForm, data_entrega: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Próxima Entrega</label><input type="date" style={S.input} value={editForm.data_prox_entrega} onChange={e => setEditForm({ ...editForm, data_prox_entrega: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Quantidade</label><input type="number" min="1" style={S.input} value={editForm.quantidade} onChange={e => setEditForm({ ...editForm, quantidade: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Nº CA</label><input style={S.input} placeholder="Ex: CA-12345" value={editForm.ca} onChange={e => setEditForm({ ...editForm, ca: e.target.value })} /></div>
            <div style={S.field}><label style={S.label}>Motivo</label>
              <select style={S.fsel} value={editForm.motivo} onChange={e => setEditForm({ ...editForm, motivo: e.target.value })}>
                <option value="">Selecione...</option>
                <option>1ª Entrega</option><option>Substituição por vencimento</option><option>Substituição por desgaste</option><option>Substituição por perda</option><option>Substituição por dano</option>
              </select>
            </div>
            <div style={S.row}><button style={S.btnSm} onClick={() => setEditando(null)}>Cancelar</button><button style={S.btn} onClick={salvarEdicao} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}

      {/* ══ MODAL HISTÓRICO ══ */}
      {modalHist && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModalHist(null)}>
          <div style={S.modalBoxLg}>
            <div style={S.modalTitle}>Histórico de Entregas</div>
            <div style={S.modalSub}>{modalHist.nome} · {modalHist.matricula}</div>
            {historico.length === 0
              ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>Nenhuma entrega registrada.</div>
              : Object.entries(histPorTipo).map(([tipo, entregas]) => (
                <div key={tipo} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 10 }}>{tipo}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {entregas.map((h, i) => (
                      <div key={h.id} style={{ background: i === 0 ? 'rgba(59,130,246,.04)' : 'var(--surface2)', border: `1px solid ${i === 0 ? 'rgba(59,130,246,.2)' : 'var(--border)'}`, borderRadius: 9, padding: '14px 16px' }}>
                        {i === 0 && <div style={{ marginBottom: 10 }}><span style={{ background: 'var(--blue-dim)', color: 'var(--blue)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Última entrega</span></div>}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 16px' }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Data Entrega</div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{fmtData(h.data_entrega)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Próxima Entrega</div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{fmtData(h.data_prox_entrega)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Status</div>
                            <Badge status={calcStatus(h.data_prox_entrega)} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Nº CA</div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>{h.ca || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Quantidade</div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text)' }}>{h.quantidade}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Motivo</div>
                            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{h.motivo || '—'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
            <div style={S.row}><button style={S.btnSm} onClick={() => setModalHist(null)}>Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
