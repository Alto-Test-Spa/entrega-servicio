import { describe, expect, it } from 'vitest'
import { ApiError, MAX_DOC_BYTES, assertWithinSizeLimit, toEnvelopeBody } from './api'
import { initialState } from './template'

describe('toEnvelopeBody', () => {
  it('arma el sobre {code, client, date, doc} del Worker', () => {
    const s = initialState('anchors', new Date(2026, 8, 17, 10, 15, 0))
    const withClient = { ...s, shared: { ...s.shared, client: 'DAG MS', asset: 'Comunidad Ranco' } }
    const body = toEnvelopeBody(withClient)
    expect(body.code).toBe('EN-20260917-101500')
    expect(body.client).toBe('DAG MS — Comunidad Ranco')
    expect(body.date).toBe('17/09/2026')
    expect(body.doc).toBe(withClient)
  })
  it('sin cliente ni activo, el resumen queda vacío', () => {
    expect(toEnvelopeBody(initialState('anchors')).client).toBe('')
  })
})

describe('assertWithinSizeLimit', () => {
  it('deja pasar un documento normal', () => {
    expect(() => assertWithinSizeLimit(initialState('anchors'))).not.toThrow()
  })
  it('rechaza antes de enviar un documento que supera el límite de KV', () => {
    const s = { ...initialState('anchors'), coverPhoto: 'x'.repeat(MAX_DOC_BYTES + 1) }
    let err: unknown
    try { assertWithinSizeLimit(s) } catch (e) { err = e }
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(413)
    expect((err as ApiError).message).toContain('demasiado pesado')
  })
})
