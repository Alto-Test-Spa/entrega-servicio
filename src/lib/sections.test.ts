import { describe, expect, it } from 'vitest'
import type { ServiceDefinition } from '../services/types'
import { activeSections, isHideable, toggleSection } from './sections'

const def: ServiceDefinition = {
  id: 't', label: 'T', codePrefix: 'T', title: 'T', intro: '',
  sections: [
    { id: 'identification', title: 'Identificación', group: 'common', fixed: true, kind: 'identification' },
    { id: 'scope', title: 'Alcance', group: 'common', kind: 'table', columns: [], rows: [] },
    { id: 'tests', title: 'Ensayos', group: 'service', kind: 'facts', facts: [], conclusionHint: '' },
    { id: 'photos', title: 'Fotos', group: 'common', kind: 'photos' },
    { id: 'findings', title: 'Hallazgos', group: 'closing', kind: 'findings' },
  ],
}

describe('sections', () => {
  it('numera de 1 a N en orden de documento', () => {
    expect(activeSections(def, []).map((s) => [s.section.id, s.number])).toEqual([
      ['identification', 1], ['scope', 2], ['tests', 3], ['photos', 4], ['findings', 5],
    ])
  })
  it('ocultar una sección renumera las siguientes', () => {
    expect(activeSections(def, ['tests']).map((s) => [s.section.id, s.number])).toEqual([
      ['identification', 1], ['scope', 2], ['photos', 3], ['findings', 4],
    ])
  })
  it('las secciones fijas no se pueden ocultar', () => {
    expect(isHideable(def, 'identification')).toBe(false)
    expect(toggleSection([], def, 'identification')).toEqual([])
    expect(activeSections(def, ['identification']).length).toBe(5)
  })
  it('toggle oculta y vuelve a mostrar', () => {
    const hidden = toggleSection([], def, 'photos')
    expect(hidden).toEqual(['photos'])
    expect(toggleSection(hidden, def, 'photos')).toEqual([])
  })
  it('ocultar todo lo ocultable deja un documento mínimo con numeración correcta', () => {
    const all = ['scope', 'tests', 'photos', 'findings']
    expect(activeSections(def, all).map((s) => [s.section.id, s.number])).toEqual([
      ['identification', 1],
    ])
  })
  it('ignora ids ocultos que ya no existen en la definición', () => {
    expect(activeSections(def, ['fantasma']).length).toBe(5)
  })
})
