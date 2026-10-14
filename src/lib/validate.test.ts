import { describe, expect, it } from 'vitest'
import { SERVICE_LIST, getService } from '../services'
import { fillTemplate, photoWithCaption } from '../test/helpers'
import { initialState } from './template'
import { hasBlocks, validate } from './validate'
import { newPhoto } from './photos'

const def = getService('anchors')
const valid = () => fillTemplate(initialState('anchors', new Date(2026, 8, 17)), def)
const msgs = (s: ReturnType<typeof valid>, level: 'block' | 'warn') =>
  validate(s, def).filter((i) => i.level === level).map((i) => i.message)

describe('validate', () => {
  it('la plantilla vacía bloquea por datos únicos y campos vacíos', () => {
    const issues = validate(initialState('anchors'), def)
    expect(hasBlocks(issues)).toBe(true)
    expect(issues.some((i) => i.message.includes('Cliente'))).toBe(true)
    expect(issues.some((i) => /campo\(s\) vacío\(s\)/.test(i.message))).toBe(true)
  })

  it('un documento completo no tiene bloqueos', () => {
    expect(msgs(valid(), 'block')).toEqual([])
  })

  it('una vigencia vencida solo avisa, nunca bloquea', () => {
    const s = valid()
    const withExpired = { ...s, values: { ...s.values, 'tests.fact2': 'N.º 4521 · vigente hasta 30.06.2026' } }
    expect(msgs(withExpired, 'block')).toEqual([])
    expect(msgs(withExpired, 'warn').some((m) => m.includes('Vigencia vencida'))).toBe(true)
  })

  it('una vigencia futura no avisa', () => {
    expect(msgs(valid(), 'warn').some((m) => m.includes('Vigencia vencida'))).toBe(false)
  })

  it('bloquea el texto de plantilla sin reemplazar entre corchetes', () => {
    const s = valid()
    const bad = { ...s, values: { ...s.values, 'tests.fact1': '[N.º / fecha / vigencia]' } }
    expect(msgs(bad, 'block').some((m) => m.includes('Texto de plantilla sin reemplazar'))).toBe(true)
  })

  it('bloquea la palabra "Incorporar" y las variables {{x}} sin resolver', () => {
    const s = valid()
    const a = { ...s, values: { ...s.values, 'tests.conclusion': 'Incorporar el resultado' } }
    const b = { ...s, values: { ...s.values, 'tests.conclusion': 'Obra en {{nope}}' } }
    expect(msgs(a, 'block').some((m) => m.includes('Texto de plantilla'))).toBe(true)
    expect(msgs(b, 'block').some((m) => m.includes('Texto de plantilla'))).toBe(true)
  })

  it('bloquea una sección de plano visible sin imagen y deja de bloquear si se oculta', () => {
    const s = { ...valid(), layoutImage: undefined }
    expect(msgs(s, 'block').some((m) => m.includes('plano'))).toBe(true)
    expect(msgs({ ...s, hiddenSections: ['layout'] }, 'block')).toEqual([])
  })

  it('los problemas de una sección oculta no cuentan', () => {
    const s = valid()
    const bad = { ...s, values: { ...s.values, 'tests.fact1': '[por completar]' }, hiddenSections: ['tests'] }
    expect(msgs(bad, 'block')).toEqual([])
  })

  it('bloquea una fecha de ejecución en otro formato con un mensaje claro', () => {
    for (const bad of ['17-09-2026', '17/9/2026', '31/02/2026']) {
      const s = valid()
      const m = msgs({ ...s, shared: { ...s.shared, executionDate: bad } }, 'block')
      expect(m.some((x) => x.includes('Fecha de ejecución') && x.includes('dd/mm/aaaa'))).toBe(true)
    }
  })

  it('con fecha inválida no revienta el aviso de vigencias', () => {
    const s = valid()
    const bad = { ...s, shared: { ...s.shared, executionDate: 'ayer' }, values: { ...s.values, 'tests.fact2': 'hasta 30.06.2026' } }
    expect(() => validate(bad, def)).not.toThrow()
  })

  it('bloquea una foto sin descripción y más de 6 fotos', () => {
    const s = valid()
    expect(msgs({ ...s, photos: [newPhoto('data:x')] }, 'block').some((m) => m.includes('vacío'))).toBe(true)
    const seven = Array.from({ length: 7 }, (_, i) => photoWithCaption(`f${i}`))
    expect(msgs({ ...s, photos: seven }, 'block').some((m) => m.includes('máximo de 6 fotos'))).toBe(true)
  })

  it('bloquea más de 6 fotos repartidas entre los hallazgos', () => {
    const s = valid()
    const f = (n: number) => ({
      id: String(n), location: 'a', description: 'b', recommendation: 'c', severity: 'observation' as const,
      immediateRisk: false, commercialOpportunity: false, photos: Array.from({ length: 4 }, (_, i) => photoWithCaption(`p${n}${i}`)),
    })
    expect(msgs({ ...s, findings: [f(1), f(2)] }, 'block').some((m) => m.includes('hallazgos') && m.includes('máximo de 6 fotos'))).toBe(true)
  })

  it('los datos opcionales (contacto, códigos enlazados) no bloquean', () => {
    const s = valid()
    expect(msgs({ ...s, shared: { ...s.shared, contact: '', quoteCode: '', surveyCode: '' } }, 'block')).toEqual([])
  })
})

describe.each(SERVICE_LIST.map((d) => [d.id, d] as const))('servicio %s completo', (id, d) => {
  it('un documento completo no tiene bloqueos', () => {
    const s = fillTemplate(initialState(id, new Date(2026, 8, 17)), d)
    // El marcador del carro colgante es intencional: se prueba aparte.
    const blocks = validate(s, d).filter((i) => i.level === 'block')
    expect(blocks).toEqual([])
  })
})

describe('registros flexibles (sellos)', () => {
  const seals = getService('seals')
  it('solo el sector es obligatorio en «Sellos repuestos»; el resto puede quedar vacío', () => {
    const s = fillTemplate(initialState('seals', new Date(2026, 8, 17)), seals)
    const rows = [['Cara norte', '', '', '', '']]
    const v = { ...s, tables: { ...s.tables, replaced: rows }, values: { ...s.values, 'replaced.note': '' } }
    expect(validate(v, seals).filter((i) => i.level === 'block')).toEqual([])
  })
})
