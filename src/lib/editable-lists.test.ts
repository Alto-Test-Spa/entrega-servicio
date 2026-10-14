import { describe, expect, it } from 'vitest'
import { getService } from '../services'
import { fillTemplate } from '../test/helpers'
import { effectiveAnnexes, setAnnexes } from './annexes'
import { collectFields } from './fields'
import { initialState } from './template'
import { validate } from './validate'

const def = getService('anchors')
const base = () => fillTemplate(initialState('anchors', new Date(2026, 8, 17)), def)
const annexes = def.sections.find((s) => s.kind === 'annexes')!
if (annexes.kind !== 'annexes') throw new Error('anchors sin anexos')

describe('anexos editables', () => {
  it('toma vigencias ya escritas y deja agregar y quitar', () => {
    const s = base()
    const rows = effectiveAnnexes(s, annexes)
    expect(rows.length).toBeGreaterThan(0)
    const more = setAnnexes(s, annexes.id, [...rows, { title: 'Informe de ensayo', hasValidity: false, validity: '' }])
    expect(effectiveAnnexes(more, annexes)).toHaveLength(rows.length + 1)
    expect(validate(more, def).filter((i) => i.level === 'block')).toEqual([])
    const fewer = setAnnexes(s, annexes.id, rows.slice(1))
    expect(effectiveAnnexes(fewer, annexes)).toHaveLength(rows.length - 1)
  })
  it('un anexo sin título bloquea', () => {
    const s = base()
    const rows = effectiveAnnexes(s, annexes)
    const blank = setAnnexes(s, annexes.id, [...rows, { title: '', hasValidity: false, validity: '' }])
    expect(validate(blank, def).some((i) => i.level === 'block' && i.message.includes('Documentos de respaldo'))).toBe(true)
  })
})

describe('texto con formato en la validación', () => {
  it('un campo con solo saltos de línea cuenta como vacío', () => {
    const s = base()
    const f = collectFields(s, def).find((x) => x.label === 'Conclusión')!
    const empty = f.write(s, '<br><br>')
    expect(validate(empty, def).some((i) => i.level === 'block' && i.message.includes('vacío'))).toBe(true)
    const bold = f.write(s, '<b>Conforme</b><ul><li>uno</li></ul>')
    expect(validate(bold, def).filter((i) => i.level === 'block')).toEqual([])
  })
})

describe('documentos de respaldo: incluidos y aparte', () => {
  it('anclajes trae los entregables independientes de Alto Test como «aparte», con su referencia', () => {
    const rows = effectiveAnnexes(base(), annexes)
    expect(rows.filter((r) => r.delivery === 'separate').map((r) => r.title)).toEqual([
      'Certificado de conformidad de instalación Alto Test',
      'Informes de ensayo y trazabilidad (Hydrajaws Verify)',
      'Protocolo de uso del sistema de anclajes (AT-PT-ANC-02)',
    ])
    expect(rows.find((r) => r.title.startsWith('Certificado de conformidad'))?.validity).toBe('Validez de 12 meses')
  })
  it('un informe guardado sin «entrega» se lee como incluido', () => {
    const s = { ...base(), annexes: { annexes: [{ title: 'Viejo', hasValidity: false, validity: '' }] } }
    expect(effectiveAnnexes(s, annexes)[0].delivery).toBe('included')
  })
})

describe('resumen del resultado y secciones nuevas', () => {
  it('el resumen es obligatorio y bloquea si falta', () => {
    const s = base()
    const empty = { ...s, values: { ...s.values, 'identification.summary': '' } }
    expect(validate(empty, def).some((i) => i.level === 'block' && i.message.includes('Resumen del resultado'))).toBe(true)
  })
  it('la fecha estimada del plan se calcula y no cuenta como campo obligatorio', () => {
    const fields = collectFields(base(), def).filter((f) => f.sectionId === 'maintenance')
    expect(fields.length).toBe(4 * 3 + 1) // 4 hitos × (hito, actividad, alcance) + la nota; la fecha no se pide
  })
  it('la sección de observaciones de ejecución se puede ocultar si no hubo desviaciones', () => {
    const s = { ...initialState('anchors'), hiddenSections: ['execution'] }
    expect(collectFields(s, def).some((f) => f.sectionId === 'execution')).toBe(false)
  })
})
