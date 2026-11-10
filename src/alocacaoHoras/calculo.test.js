import test from 'node:test'
import assert from 'node:assert/strict'

import { interpretarPcp, interpretarRelatorio } from './calculo.js'

test('interpreta horas em formato brasileiro no relatório', () => {
  const linhas = [
    [],
    ['Usuario', 'Email', 'Ano', 'Mes', 'Dia', 'Horas', 'Label Tipo', 'Tipo Timesheet'],
    ['Maria', 'maria@test.com', 2026, 11, 3, '8,5', 'Projeto A', 'Tipo 1'],
    ['Maria', 'maria@test.com', 2026, 11, 4, '6,5', 'Projeto A', 'Tipo 1'],
  ]

  const rel = interpretarRelatorio(linhas)
  const mes = rel.meses.get('2026-11')

  assert.equal(mes.get('MARIA').horas, 15)
  assert.equal(mes.get('MARIA').semanas['2026-11-02'], 15)
})

test('interpreta planejado em formato brasileiro no PCP', () => {
  const linhas = [
    [],
    ['', 'COLABORADOR', 'MATRÍCULA', 'FUNÇÃO', 'GERÊNCIA', 'JAN/26', 'FEV/26'],
    ['', 'TOTAL', '', '', '', 'Planejado', 'Planejado'],
    ['', 'Maria', '123', 'Consultor', 'TICs', '100,5', '80,25'],
  ]

  const pcp = interpretarPcp(linhas)
  assert.equal(pcp.rows[0].plan['JAN/26'], 100.5)
  assert.equal(pcp.rows[0].plan['FEV/26'], 80.25)
})
