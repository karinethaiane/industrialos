/**
 * patrimonioPdfParser.js
 *
 * Parser de PDF para o relatório "BE - Lista de Bens por Unidade e Local" (SENAI/FIEPE).
 * Roda inteiramente no browser via pdfjs-dist.
 *
 * Instalação:
 *   npm install pdfjs-dist
 */

const LOCAIS_ACEITOS = [
  '4º ANDAR - BLOCO B SANTO AMARO - CONSULTORIA - EFICIENCIA',
  'BLOCO D - SENAI CARUARU - EFICIENCIA ENERGETICA / IST MPP',
  'SENAI ARARIPINA - EFICIENCIA ENERGETICA / IST MPP',
  '4º ANDAR - BLOCO B SANTO AMARO - MEIO AMBIENTE / IST AMA',
]

// ---------------------------------------------------------------------------
// Helpers de conversão
// ---------------------------------------------------------------------------
function parseDate(str) {
  if (!str) return null
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

function parseMoney(str) {
  if (!str) return null
  return str.replace(/\./g, '').replace(',', '.')
}

// ---------------------------------------------------------------------------
// Extração de local
//
// Linha completa exemplo:
//   "19.02.15-IST - MATERIAIS E PROCESSOS PRODUTIVOS-4º ANDAR - BLOCO B SANTO AMARO - CONSULTORIA - EFICIENCIA"
//
// Estratégia:
//   1. Remove prefixo numérico "19.02.15-"
//   2. O nome da unidade usa hifens COM espaço (" - ").
//      O separador unidade→local é um hífen SEM espaço nos dois lados.
//   3. Retorna tudo após esse hífen.
// ---------------------------------------------------------------------------
function extrairLocal(linha) {
  const semPrefixo = linha.replace(/^\d+\.\d+\.\d+-/, '').trim()
  // Primeiro hífen sem espaço antes e sem espaço depois
  const idx = semPrefixo.search(/(?<!\s)-(?!\s)/)
  if (idx !== -1) return semPrefixo.slice(idx + 1).trim()
  // Fallback
  const fallback = semPrefixo.indexOf('-')
  return fallback !== -1 ? semPrefixo.slice(fallback + 1).trim() : semPrefixo
}

function localAceito(localCompleto) {
  const upper = localCompleto.toUpperCase()
  return LOCAIS_ACEITOS.some(aceito => upper.includes(aceito.toUpperCase()))
}

// ---------------------------------------------------------------------------
// Detectores de tipo de linha
// ---------------------------------------------------------------------------
function isUnidadeLocal(linha) {
  return /^\d+\.\d+\.\d+-/.test(linha.trim())
}

function isResponsavel(linha) {
  return /^\d{5}\s+-\s+.+/.test(linha.trim())
}

function isTotalizador(linha) {
  return /^Total (do|da|de)\b/.test(linha.trim())
}

function isRodape(linha) {
  const t = linha.trim()
  return (
    /^Pagina\s+\d+\s+de\s+\d+/i.test(t) ||
    /^filtro:/i.test(t) ||
    /^BE\s+-\s+Lista de Bens/i.test(t) ||
    /^SENAI\s*$/.test(t) ||
    /^\d{2}\/\d{2}\/\d{4}\s*$/.test(t) ||
    /^Competencia:/i.test(t) ||
    /^Data\s*$/.test(t) ||
    /^Número\s*$/.test(t) ||
    /^Folha\s*$/.test(t) ||
    /^FIEPE/.test(t) ||
    /^SESI/.test(t) ||
    t === ''
  )
}

function isCabecalhoTabela(linha) {
  return /Cod\.\s*Barra/.test(linha) && /Descr\.\s*Padrao/.test(linha)
}

// ---------------------------------------------------------------------------
// Parser de linha de bem
//
// Âncora pela data DD/MM/AAAA + dois valores monetários no final.
// Tudo antes da data contém: código + tipo + descrição + situação.
// ---------------------------------------------------------------------------
const SITUACOES_CONHECIDAS = [
  'Manutenção/Emprestado',
  'Manutenção/',
  'Disponível',
  'Descartado',
  'Em uso',
]

function parseLinhaBem(linha) {
  const t = linha.trim()

  // Deve começar com código de barras (5-9 dígitos seguidos de espaço)
  if (!/^\d{5,9}\s/.test(t)) return null

  // Ancora pela data e dois valores no final
  const reData = /(\d{2}\/\d{2}\/\d{4})\s+([\d.,]+)\s+([\d.,]+)\s*$/
  const mData = reData.exec(t)
  if (!mData) return null

  const dataStr    = mData[1]
  const vlr        = mData[2]
  const saldo      = mData[3]
  const antesData  = t.slice(0, mData.index).trim()

  // Extrai código (primeiro token numérico)
  const mCod = antesData.match(/^(\d{5,9})\s+(.+)$/)
  if (!mCod) return null

  const codigoBarra = mCod[1]
  let restoDesc     = mCod[2].trim()

  // Separa situação do fim de restoDesc
  let situacaoEncontrada = 'Em uso'
  for (const sit of SITUACOES_CONHECIDAS) {
    if (restoDesc.endsWith(sit)) {
      situacaoEncontrada = sit
      restoDesc = restoDesc.slice(0, restoDesc.length - sit.length).trim()
      break
    }
  }

  // Primeira palavra é o tipo (Descr. Padrao), o resto é a descrição
  const partes       = restoDesc.split(/\s+/)
  const descr_padrao = partes[0] || ''
  const descricao    = partes.slice(1).join(' ').trim() || descr_padrao

  return {
    codigo_barra:    codigoBarra,
    descr_padrao,
    descricao:       descricao || descr_padrao,
    situacao:        normalizaSituacao(situacaoEncontrada),
    data_aquisicao:  parseDate(dataStr),
    valor_aquisicao: parseMoney(vlr),
    saldo_contabil:  parseMoney(saldo),
  }
}

function normalizaSituacao(s) {
  if (!s) return 'Em uso'
  if (s.includes('Manutenção')) return 'Em manutenção'
  if (s.includes('Disponível')) return 'Disponível'
  if (s.includes('Descartado')) return 'Descartado'
  return 'Em uso'
}

function isContinuacao(linha) {
  const t = linha.trim()
  if (!t) return false
  if (/^\d{5,9}\s/.test(t)) return false
  if (isUnidadeLocal(t)) return false
  if (isResponsavel(t)) return false
  if (isTotalizador(t)) return false
  if (isRodape(t)) return false
  if (isCabecalhoTabela(t)) return false
  if (t === 'Emprestado') return false
  return true
}

function inferirTipo(desc) {
  const d = (desc || '').toUpperCase()
  if (d.includes('NOTEBOOK') || d.includes('DESKTOP') || d.includes('COMPUTADOR')) return 'Computador'
  if (d.includes('MONITOR') || d.includes('TECLADO') || d.includes('MOUSE') || d.includes('IMPRESSORA') || d.includes('SCANNER')) return 'Periférico'
  if (
    d.includes('MULTÍMETRO') || d.includes('ANALISADOR') || d.includes('MEDIDOR') ||
    d.includes('BALANÇA') || d.includes('CALIBRADOR') || d.includes('TERMÔMETRO') ||
    d.includes('PHMETRO') || d.includes('ESPECTRO') || d.includes('CROMATOGRAFO') ||
    d.includes('DETECTOR')
  ) return 'Instrumento de Medição'
  if (
    d.includes('MESA') || d.includes('CADEIRA') || d.includes('ARMARIO') ||
    d.includes('ESTANTE') || d.includes('GAVETEIRO') || d.includes('BANCADA')
  ) return 'Móvel'
  return 'Outro'
}

// ---------------------------------------------------------------------------
// Extração de texto do PDF com pdf.js
// Agrupa items por linha (coordenada Y) com tolerância de ±3 pontos
// ---------------------------------------------------------------------------
async function extrairLinhasDoPdf(input) {
  const pdfjsLib = await import('pdfjs-dist')

  try {
    const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''
  }

  let buffer
  if (input instanceof File) {
    buffer = await input.arrayBuffer()
  } else {
    buffer = input
  }

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const todasLinhas = []
  const TOLERANCIA = 3

  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p)
    const content = await page.getTextContent()
    const porY    = {}

    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue
      const yRaw    = item.transform[5]
      const yBucket = Math.round(yRaw / TOLERANCIA) * TOLERANCIA
      if (!porY[yBucket]) porY[yBucket] = []
      porY[yBucket].push({ x: item.transform[4], str: item.str })
    }

    const ys = Object.keys(porY).map(Number).sort((a, b) => b - a)
    for (const y of ys) {
      const linha = porY[y]
        .sort((a, b) => a.x - b.x)
        .map(i => i.str)
        .join(' ')
        .trim()
      if (linha) todasLinhas.push(linha)
    }
  }

  return todasLinhas
}

// ---------------------------------------------------------------------------
// Função principal de parse
// ---------------------------------------------------------------------------
export async function parsePdfPatrimonio(input) {
  const todasLinhas = await extrairLinhasDoPdf(input)

  const bens           = []
  let localAtual       = ''
  let responsavelAtual = ''
  let localAceitoAtual = false
  let bemAtual         = null

  function commitBem() {
    if (!bemAtual) return
    if (localAceitoAtual) bens.push({ ...bemAtual })
    bemAtual = null
  }

  for (const linha of todasLinhas) {
    if (isRodape(linha))          continue
    if (isCabecalhoTabela(linha)) continue

    if (isUnidadeLocal(linha)) {
      commitBem()
      const novoLocal = extrairLocal(linha)

      // ---------------------------------------------------------------
      // CORREÇÃO PRINCIPAL:
      // O relatório repete o cabeçalho "Unidade e Local" a cada virada
      // de página, mas NÃO repete a linha do responsável.
      // Se o local novo for o mesmo que o atual, mantemos o responsável.
      // Só zeramos o responsável quando o local realmente muda.
      // ---------------------------------------------------------------
      if (novoLocal !== localAtual) {
        responsavelAtual = ''
      }

      localAtual       = novoLocal
      localAceitoAtual = localAceito(localAtual)
      continue
    }

    if (isResponsavel(linha)) {
      commitBem()
      responsavelAtual = linha.replace(/^\d+\s+-\s+/, '').trim()
      continue
    }

    if (isTotalizador(linha)) {
      commitBem()
      continue
    }

    if (!localAceitoAtual) continue

    const bem = parseLinhaBem(linha)
    if (bem) {
      commitBem()
      bemAtual = { ...bem, local: localAtual, responsavel: responsavelAtual }
      continue
    }

    if (bemAtual && isContinuacao(linha)) {
      if (!bemAtual.descricao_complementar) {
        bemAtual.descricao_complementar = linha.trim()
      } else {
        bemAtual.descricao_complementar += ' ' + linha.trim()
      }
    }
  }

  commitBem()

  return bens.map(b => ({
    codigo_barra:             b.codigo_barra,
    descricao:                b.descricao || b.descr_padrao,
    descricao_complementar:   b.descricao_complementar?.trim() || null,
    tipo_bem:                 inferirTipo(b.descricao || b.descr_padrao),
    situacao:                 b.situacao || 'Em uso',
    local:                    b.local || null,
    responsavel:              b.responsavel || null,
    usuario_patrimonio:       null,
    unidade:                  null,
    data_aquisicao:           b.data_aquisicao || null,
    valor_aquisicao:          b.valor_aquisicao || null,
    saldo_contabil:           b.saldo_contabil || null,
    codigo_interno:           null,
    requer_calibracao:        false,
    periodicidade_calibracao: null,
  }))
}

// ---------------------------------------------------------------------------
// Comparação por código de barras (novos / removidos)
// ---------------------------------------------------------------------------
export async function compararPdfPatrimonio(input, atual) {
  const doArquivo = await parsePdfPatrimonio(input)

  const mapaArquivo = {}
  for (const b of doArquivo) mapaArquivo[b.codigo_barra] = b

  const mapaBanco = {}
  for (const b of atual) mapaBanco[b.codigo_barra] = b

  const novos     = doArquivo.filter(b => !mapaBanco[b.codigo_barra])
  const removidos = atual.filter(b => !mapaArquivo[b.codigo_barra])

  return { novos, removidos, doArquivo }
}

// ---------------------------------------------------------------------------
// debugPdf — cola no console do browser para ver o que o pdf.js extrai
//
// Como usar:
//   import { debugPdf } from '../utils/patrimonioPdfParser'
//   // botão temporário no JSX:
//   <button onClick={() => debugPdf(file)}>Debug PDF</button>
// ---------------------------------------------------------------------------
export async function debugPdf(input) {
  const linhas = await extrairLinhasDoPdf(input)
  console.log(`[debugPdf] ${linhas.length} linhas extraídas`)
  linhas.forEach((l, i) => console.log(`[${String(i).padStart(4, '0')}]`, JSON.stringify(l)))

  console.log('\n--- Unidade e Local detectadas ---')
  linhas.forEach((l, i) => {
    if (isUnidadeLocal(l)) {
      const local  = extrairLocal(l)
      const aceito = localAceito(local)
      console.log(`[${i}] RAW:    ${l}`)
      console.log(`      LOCAL:  "${local}"`)
      console.log(`      ACEITO: ${aceito}`)
    }
  })

  console.log('\n--- Primeiros 5 bens encontrados ---')
  let count = 0
  for (const l of linhas) {
    const bem = parseLinhaBem(l)
    if (bem && ++count <= 5) console.log('BEM:', bem)
  }

  return linhas
}
