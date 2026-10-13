import { describe, expect, it } from 'vitest'
import { getService } from '../services'
import { fillTemplate } from '../test/helpers'
import { applyEdit, issueReport } from './issuance'
import { initialState } from './template'
import { validate } from './validate'

const def = getService('anchors')
const valid = () => fillTemplate(initialState('anchors', new Date(2026, 8, 17)), def)

describe('issuance', () => {
  it('emitir sin bloqueos fija el estado en issued', () => {
    const s = valid()
    expect(issueReport(s, validate(s, def)).status).toBe('issued')
  })
  it('emitir con bloqueos falla', () => {
    const s = initialState('anchors')
    expect(() => issueReport(s, validate(s, def))).toThrow('No se puede emitir')
  })
  it('editar un informe emitido lo devuelve a borrador', () => {
    const issued = { ...valid(), status: 'issued' as const }
    const edited = applyEdit(issued, { ...issued, shared: { ...issued.shared, client: 'Otro' } })
    expect(edited.status).toBe('draft')
  })
  it('una "edición" sin cambios (mismo objeto) no revierte la emisión', () => {
    const issued = { ...valid(), status: 'issued' as const }
    expect(applyEdit(issued, issued).status).toBe('issued')
  })
  it('pasar de borrador a emitido no se revierte', () => {
    const draft = valid()
    expect(applyEdit(draft, { ...draft, status: 'issued' }).status).toBe('issued')
  })
})
