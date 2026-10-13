import { describe, expect, it } from 'vitest'
import type { ServiceDefinition } from '../services/types'
import { activeSections, isHideable, toggleSection } from './sections'

const def: ServiceDefinition = {
  id: 't', label: 'T', codePrefix: 'T', defaultAccessMode: 'ground', title: 'T', intro: '', normative: [],
  sections: [
    { id: 'identification', title: 'Identificación', group: 'common', fixed: true, kind: 'identification' },
    { id: 'normative', title: 'Normativa', group: 'common', kind: 'normative' },
    { id: 'tests', title: 'Ensayos', group: 'service', kind: 'facts', facts: [], conclusionHint: '' },
    { id: 'photos', title: 'Fotos', group: 'common', kind: 'photos' },
    { id: 'issuance', title: 'Emisión', group: 'closing', fixed: true, kind: 'issuance' },
  ],
}

describe('sections', () => {
  it('numera de 1 a N en orden de documento', () => {
    expect(activeSections(def, []).map((s) => [s.section.id, s.number])).toEqual([
      ['identification', 1], ['normative', 2], ['tests', 3], ['photos', 4], ['issuance', 5],
    ])
  })
  it('ocultar una sección renumera las siguientes', () => {
    expect(activeSections(def, ['tests']).map((s) => [s.section.id, s.number])).toEqual([
      ['identification', 1], ['normative', 2], ['photos', 3], ['issuance', 4],
    ])
  })
  it('las secciones fijas no se pueden ocultar', () => {
    expect(isHideable(def, 'identification')).toBe(false)
    expect(toggleSection([], def, 'identification')).toEqual([])
    expect(activeSections(def, ['identification', 'issuance']).length).toBe(5)
  })
  it('toggle oculta y vuelve a mostrar', () => {
    const hidden = toggleSection([], def, 'photos')
    expect(hidden).toEqual(['photos'])
    expect(toggleSection(hidden, def, 'photos')).toEqual([])
  })
  it('ocultar todo lo ocultable deja un documento mínimo con numeración correcta', () => {
    const all = ['normative', 'tests', 'photos']
    expect(activeSections(def, all).map((s) => [s.section.id, s.number])).toEqual([
      ['identification', 1], ['issuance', 2],
    ])
  })
  it('ignora ids ocultos que ya no existen en la definición', () => {
    expect(activeSections(def, ['fantasma']).length).toBe(5)
  })
})
