// Onde ficam gravadas as NOTAS e as POSIÇÕES SEMANAIS ("fotos").
// Tenta gravar no Supabase (tabelas alocacao_notas e alocacao_snapshots).
// Se as tabelas ainda não existirem, grava só neste computador (localStorage) e avisa na tela.
import { supabase } from '../supabase'

let modoLocal = false
export const estaEmModoLocal = () => modoLocal

const lerLocal = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao } catch { return padrao } }
const gravarLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sem espaço: ignora */ } }

// ── NOTAS ───────────────────────────────────────────────────────────────────
// Devolve { 'AAAA-MM|id': { tag, texto } } do mês pedido
export async function carregarNotas(ym) {
  const local = lerLocal('alocacao_notas', {})
  const dosLocal = Object.fromEntries(Object.entries(local).filter(([k]) => k.startsWith(ym + '|')))
  try {
    const { data, error } = await supabase.from('alocacao_notas').select('colaborador_id, tag, texto').eq('mes', ym)
    if (error) throw error
    modoLocal = false
    return Object.fromEntries((data || []).map(r => [`${ym}|${r.colaborador_id}`, { tag: r.tag || '', texto: r.texto || '' }]))
  } catch (e) {
    modoLocal = true
    return dosLocal
  }
}

export async function salvarNota(ym, id, { tag, texto }) {
  const vazia = !tag && !texto
  if (!modoLocal) {
    try {
      const q = supabase.from('alocacao_notas')
      const { error } = vazia
        ? await q.delete().eq('mes', ym).eq('colaborador_id', id)
        : await q.upsert({ mes: ym, colaborador_id: id, tag: tag || '', texto: texto || '', atualizado_em: new Date().toISOString() }, { onConflict: 'mes,colaborador_id' })
      if (error) throw error
      return
    } catch (e) { modoLocal = true }
  }
  const local = lerLocal('alocacao_notas', {})
  const k = `${ym}|${id}`
  if (vazia) delete local[k]; else local[k] = { tag, texto }
  gravarLocal('alocacao_notas', local)
}

// ── POSIÇÕES SEMANAIS ───────────────────────────────────────────────────────
// Devolve [{ data: 'AAAA-MM-DD', rows: {...} }] em ordem de data
export async function carregarSnaps(ym) {
  const dosLocal = (lerLocal('alocacao_snaps', {})[ym] || [])
  try {
    const { data, error } = await supabase.from('alocacao_snapshots').select('data_extracao, linhas').eq('mes', ym).order('data_extracao')
    if (error) throw error
    modoLocal = false
    return (data || []).map(r => ({ data: r.data_extracao, rows: r.linhas }))
  } catch (e) {
    modoLocal = true
    return [...dosLocal].sort((a, b) => a.data.localeCompare(b.data))
  }
}

export async function salvarSnap(ym, data, rows) {
  if (!modoLocal) {
    try {
      const { error } = await supabase.from('alocacao_snapshots')
        .upsert({ mes: ym, data_extracao: data, linhas: rows }, { onConflict: 'mes,data_extracao' })
      if (error) throw error
      return
    } catch (e) { modoLocal = true }
  }
  const todos = lerLocal('alocacao_snaps', {})
  todos[ym] = [...(todos[ym] || []).filter(s => s.data !== data), { data, rows }]
  gravarLocal('alocacao_snaps', todos)
}

export async function removerSnap(ym, data) {
  if (!modoLocal) {
    try {
      const { error } = await supabase.from('alocacao_snapshots').delete().eq('mes', ym).eq('data_extracao', data)
      if (error) throw error
      return
    } catch (e) { modoLocal = true }
  }
  const todos = lerLocal('alocacao_snaps', {})
  todos[ym] = (todos[ym] || []).filter(s => s.data !== data)
  gravarLocal('alocacao_snaps', todos)
}
