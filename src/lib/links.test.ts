import { describe, expect, it } from 'vitest'
import { emptyShared } from './template'
import { fromQuote, fromSurvey, mergeLinked } from './links'

describe('adaptadores', () => {
  it('fromQuote toma cliente, activo, dirección y contacto de la cotización', () => {
    expect(fromQuote({ clientName: 'DAG MS', assetName: 'Comunidad Ranco', address: 'Luis Carrera #1289', email: 'a@b.cl', phone: '+56 9 1234 5678' })).toEqual({
      client: 'DAG MS', asset: 'Comunidad Ranco', address: 'Luis Carrera #1289', contact: 'a@b.cl · +56 9 1234 5678',
    })
  })
  it('fromQuote omite lo que falta y tolera un documento raro', () => {
    expect(fromQuote({ clientName: 'X' })).toEqual({ client: 'X' })
    expect(fromQuote(null)).toEqual({})
    expect(fromQuote('basura')).toEqual({})
    expect(fromQuote({ clientName: 42 })).toEqual({})
  })
  it('fromSurvey toma cliente, activo y contacto del levantamiento', () => {
    expect(fromSurvey({ clientName: 'DAG MS', clientAsset: 'Comunidad Ranco', clientContact: 'Admin' })).toEqual({
      client: 'DAG MS', asset: 'Comunidad Ranco', contact: 'Admin',
    })
  })
})

describe('mergeLinked', () => {
  it('rellena solo lo que está vacío y nunca pisa lo que la persona escribió', () => {
    const shared = { ...emptyShared(), client: 'Escrito a mano' }
    const merged = mergeLinked(shared, { client: 'De la cotización', asset: 'Torre A' })
    expect(merged.client).toBe('Escrito a mano')
    expect(merged.asset).toBe('Torre A')
  })
  it('la primera fuente tiene prioridad sobre la segunda (cotización antes que levantamiento)', () => {
    const merged = mergeLinked(emptyShared(), { asset: 'Cotización' }, { asset: 'Levantamiento', contact: 'Admin' })
    expect(merged.asset).toBe('Cotización')
    expect(merged.contact).toBe('Admin')
  })
  it('no toca los datos del emisor ni los códigos', () => {
    const shared = { ...emptyShared(), issuerName: 'Camilo Jara', quoteCode: 'COT-1' }
    const merged = mergeLinked(shared, { client: 'X' })
    expect(merged.issuerName).toBe('Camilo Jara')
    expect(merged.quoteCode).toBe('COT-1')
  })
})
