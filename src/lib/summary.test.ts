import { describe, expect, it } from 'vitest'
import { getService } from '../services'
import { initialState } from './template'
import { nextIntervention } from './summary'

const def = getService('anchors')
const base = () => ({ ...initialState('anchors'), shared: { ...initialState('anchors').shared, executionDate: '17/09/2026' } })

describe('nextIntervention', () => {
  it('es el primer hito del plan con su fecha calculada', () => {
    expect(nextIntervention(base(), def)).toBe('marzo 2027 · Inspección + mantención preventiva')
  })
  it('sin fecha de ejecución o con el plan oculto no inventa nada', () => {
    const s = base()
    expect(nextIntervention({ ...s, shared: { ...s.shared, executionDate: '' } }, def)).toBe('')
    expect(nextIntervention({ ...s, hiddenSections: ['maintenance'] }, def)).toBe('')
  })
  it('usa las filas editadas del plan', () => {
    const s = { ...base(), tables: { maintenance: [['3 meses', 'Revisión', 'x', '']] } }
    expect(nextIntervention(s, def)).toBe('diciembre 2026 · Revisión')
  })
})
