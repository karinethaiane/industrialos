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

function extrairLocal(linha) {
  const semPrefixo = linha.replace(/^\d+\.\d+\.\d+-/, '')
  const idxTraco = semPrefixo.indexOf('-')
  if (idxTraco === -1) return ''
  return semPrefixo.slice(idxTraco + 1).trim()
}

function localAceito(localCompleto) {
  return LOCAIS_ACEITOS.some(aceito =>
    localCompleto.toUpperCase().includes(aceito.toUpperCase())
  )
}

function isUnidadeLocal(linha) {
  return /^\d+\.\d+\.\d+-/.test(linha.trim())
}

function isResponsavel(linha) {
  return /^\d{5}\s+-\s+.+/.test(linha.trim())
}

function isTotalizador(linha) {
  return /^Total (do|da|de)/.test(linha.trim())
}

function isRodape(linha) {
  return (
    /^Pagina\s+\d+\s+de\s+\d+/i.test(linha.trim()) ||
    /^filtro:/i.test(linha.trim()) ||
    /^BE\s+-\s+Lista de Bens/i.test(linha.trim()) ||
    /^SENAI\s*$/.test(linha.trim()) ||
    /^13\/\d{2}\/\d{4}/.test(linha.trim()) ||
    /^Competencia:/i.test(linha.trim()) ||
    /^Data$/.test(linha.trim()) ||
    /^Número$/.test(linha.trim()) ||
    /^Folha$/.test(linha.trim())
  )
}

function isCabecalhoTabela(linha) {
  return /Cod\.\s*Barra/.test(linha) && /Descr\.\s*Padrao/.test(linha)
}

const RE_BEM = /^(\d{5,9})\s+(\S+)\s+(.+?)\s+(Em uso|Manutenção\/?Emprestado|Disponível|Descartado|Manutenção\s*\/\s*\s*Emprestado)\s+(\d{2}\/\d{2}\/\d{4})\s+([\d.,]+)\s+([\d.,]+)\s*$/
const RE_BEM_SIT_QUEBRADA = /^(\d{5,9})\s+(\S+)\s+(.+?)\s+(Manutenção\/)\s+(\d{2}\/\d{2}\/\d{4})\s+([\d.,]+)\s+([\d.,]+)\s*$/

function parseLinhaBem(linha) {
  let m = RE_BEM.exec(linha.trim())
  if (m) {
    return {
      codigo_barra:    m[1].trim(),
      descr_padrao:    m[2].trim(),
      descricao:       m[3].trim(),
      situacao:        normalizaSituacao(m[4].trim()),
      data_aquisicao:  parseDate(m[5]),
      valor_aquisicao: parseMoney(m[6]),
      saldo_contabil:  parseMoney(m[7]),
    }
  }
  m = RE_BEM_SIT_QUEBRADA.exec(linha.trim())
  if (m) {
    return {
      codigo_barra:    m[1].trim(),
      descr_padrao:    m[2].trim(),
      descricao:       m[3].trim(),
      situacao:        'Manutenção/Emprestado',
      data_aquisicao:  parseDate(m[5]),
      valor_aquisicao: parseMoney(m[6]),
      saldo_contabil:  parseMoney(m[7]),
    }
  }
  return null
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
  if (d.includes('MULTÍMETRO') || d.includes('ANALISADOR') || d.includes('MEDIDOR') || d.includes('BALANÇA') || d.includes('CALIBRADOR') || d.includes('TERMÔMETRO') || d.includes('PHMETRO') || d.includes('ESPECTRO') || d.includes('CROMATOGRAFO') || d.includes('DETECTOR')) return 'Instrumento de Medição'
  if (d.includes('MESA') || d.includes('CADEIRA') || d.includes('ARMARIO') || d.includes('ESTANTE') || d.includes('GAVETEIRO') || d.includes('BANCADA')) return 'Móvel'
  return 'Outro'
}

export async function parsePdfPatrimonio(input) {
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

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const porY = {}
    for (const item of content.items) {
      if (!item.str) continue
      const y = Math.round(item.transform[5])
      if (!porY[y]) porY[y] = []
      porY[y].push({ x: item.transform[4], str: item.str })
    }
    const ys = Object.keys(porY).map(Number).sort((a, b) => b - a)
    for (const y of ys) {
      const linha = porY[y]
        .sort((a, b) => a.x - b.x)
        .map(i => i.str)
        .join(' ')
        .replace(/\s{2,}/g, '   ')
      if (linha.trim()) todasLinhas.push(linha.trim())
    }
  }

  const bens = []
  let localAtual = ''
  let responsavelAtual = ''
  let localAceitoAtual = false
  let bemAtual = null

  function commitBem() {
    if (!bemAtual) return
    if (localAceitoAtual) bens.push({ ...bemAtual })
    bemAtual = null
  }

  for (const linha of todasLinhas) {
    if (isRodape(linha)) continue
    if (isCabecalhoTabela(linha)) continue

    if (isUnidadeLocal(linha)) {
      commitBem()
      localAtual = extrairLocal(linha)
      localAceitoAtual = localAceito(localAtual)
      responsavelAtual = ''
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

export async function compararPdfPatrimonio(input, atual) {
  const doArquivo = await parsePdfPatrimonio(input)
  const mapaArquivo = {}
  for (const b of doArquivo) mapaArquivo[b.codigo_barra] = b
  const mapaBanco = {}
  for (const b of atual) mapaBanco[b.codigo_barra] = b
  const novos    = doArquivo.filter(b => !mapaBanco[b.codigo_barra])
  const removidos = atual.filter(b => !mapaArquivo[b.codigo_barra])
  return { novos, removidos, doArquivo }
}
