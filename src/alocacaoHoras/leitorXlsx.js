// Lê a PRIMEIRA aba de um arquivo .xlsx e devolve as linhas no formato que o cálculo espera:
// linhas[nº da linha][nº da coluna], contando a partir de 1 (igual ao Excel: A1 = linhas[1][1]).
import * as XLSX from 'xlsx'

export async function lerPrimeiraAba(file) {
  const buffer = await file.arrayBuffer()
  // sheets: 0 → só carrega a primeira aba (o relatório tem outra aba pesada que não interessa)
  const wb = XLSX.read(buffer, { type: 'array', sheets: 0 })
  const nomeAba = wb.SheetNames[0]
  const ws = wb.Sheets[nomeAba]
  if (!ws || !ws['!ref']) throw new Error('A primeira aba do arquivo está vazia.')

  const rg = XLSX.utils.decode_range(ws['!ref'])
  const matriz = XLSX.utils.sheet_to_json(ws, {
    header: 1, defval: null, raw: true, blankrows: true,
    range: { s: { r: 0, c: 0 }, e: { r: rg.e.r, c: rg.e.c } },   // sempre a partir de A1
  })

  const linhas = []
  matriz.forEach((row, i) => { linhas[i + 1] = [null, ...row] })
  return { nomeAba, linhas }
}

// Pega a data da extração a partir do nome do arquivo (ex.: relatorio-alocacoes-1793875403193.xlsx → 2026-11-05)
export function dataDoArquivo(file) {
  const name = String(file?.name || '')
  const cand = [
    name.match(/(\d{13})/),
    name.match(/(\d{4})[-_](\d{2})[-_](\d{2})/),
    name.match(/(\d{2})[-_](\d{2})[-_](\d{4})/),
    name.match(/(\d{8})/),
  ].sort((a, b) => (b?.[0].length || 0) - (a?.[0].length || 0))[0]

  let d
  if (cand) {
    if (cand[0].length === 13) d = new Date(+cand[1])
    else if (cand[1] && cand[1].length === 4) d = new Date(+cand[1], +cand[2] - 1, +cand[3])
    else if (cand[1] && cand[1].length === 2) d = new Date(+cand[3], +cand[2] - 1, +cand[1])
    else if (/^\d{8}$/.test(cand[0])) {
      const s = cand[0]
      const isYmd = /^\d{4}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])$/.test(s)
      d = isYmd ? new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) : new Date(+s.slice(4, 8), +s.slice(2, 4) - 1, +s.slice(0, 2))
    } else {
      d = new Date(cand[0])
    }
  } else {
    d = new Date(file?.lastModified || Date.now())
  }

  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
