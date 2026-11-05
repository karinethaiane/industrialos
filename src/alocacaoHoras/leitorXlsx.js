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
  const ep = (file.name.match(/(\d{13})/) || [])[1]
  const d = ep ? new Date(+ep) : new Date(file.lastModified || Date.now())
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
