import { describe, expect, it } from 'vitest'
import { initialState, normalizeState } from './template'

describe('initialState', () => {
  const s = initialState('anchors', new Date(2026, 8, 17, 10, 15, 0))
  it('crea un borrador con folio, fecha y emisor por defecto', () => {
    expect(s.code).toBe('EN-20260917-101500')
    expect(s.status).toBe('draft')
    expect(s.shared.executionDate).toBe('17/09/2026')
    expect(s.shared.issuerName).toBe('Camilo Jara')
    expect(s.shared.client).toBe('')
  })
  it('copia las filas de las tablas de la definición', () => {
    expect(s.tables.scope).toHaveLength(4)
    expect(s.tables.maintenance).toHaveLength(4)
  })
  it('un servicio desconocido falla con mensaje claro', () => {
    expect(() => initialState('nope')).toThrow('Servicio desconocido: nope')
  })
})

describe('normalizeState', () => {
  it('completa los campos que faltan en un documento viejo', () => {
    const n = normalizeState({ serviceId: 'anchors', code: 'EN-20260101-000000', shared: { client: 'X' } })
    expect(n.code).toBe('EN-20260101-000000')
    expect(n.shared.client).toBe('X')
    expect(n.shared.issuerName).toBe('Camilo Jara')
    expect(n.tables.scope).toHaveLength(4)
    expect(n.photos).toEqual([])
  })
})
