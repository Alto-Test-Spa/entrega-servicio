import { describe, expect, it } from 'vitest'
import { emptyShared } from './template'
import { forceRelink, fromQuote, fromSurvey, linkConflicts, relink, surveysForQuote } from './links'

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

describe('relink', () => {
  it('rellena lo vacío y recuerda lo que cargó', () => {
    const r = relink(emptyShared(), {}, { client: 'Cot', asset: 'Torre A' })
    expect(r.shared).toMatchObject({ client: 'Cot', asset: 'Torre A' })
    expect(r.autofill).toEqual({ client: 'Cot', asset: 'Torre A' })
  })
  it('al cambiar de documento reemplaza lo que había cargado el anterior', () => {
    const first = relink(emptyShared(), {}, { client: 'Cliente 1', asset: 'Torre A', address: 'Calle 1' })
    const second = relink(first.shared, first.autofill, { client: 'Cliente 2', asset: 'Torre B' })
    expect(second.shared).toMatchObject({ client: 'Cliente 2', asset: 'Torre B' })
    expect(second.shared.address).toBe('') // el nuevo documento no la trae: se limpia
  })
  it('nunca pisa lo que la persona escribió a mano, ni antes ni después de cargar', () => {
    const typed = { ...emptyShared(), client: 'Escrito a mano' }
    expect(relink(typed, {}, { client: 'Cot' }).shared.client).toBe('Escrito a mano')
    const loaded = relink(emptyShared(), {}, { asset: 'Torre A' })
    const edited = { ...loaded.shared, asset: 'Torre A (norte)' }
    expect(relink(edited, loaded.autofill, { asset: 'Torre B' }).shared.asset).toBe('Torre A (norte)')
  })
  it('la primera fuente manda sobre la segunda (cotización antes que levantamiento)', () => {
    const r = relink(emptyShared(), {}, { asset: 'Cotización' }, { asset: 'Levantamiento', contact: 'Admin' })
    expect(r.shared.asset).toBe('Cotización')
    expect(r.shared.contact).toBe('Admin')
  })
  it('quitar la fuente limpia solo lo que ella había cargado', () => {
    const loaded = relink({ ...emptyShared(), contact: 'A mano' }, {}, { client: 'Cot', contact: 'Cot contacto' })
    const cleared = relink(loaded.shared, loaded.autofill)
    expect(cleared.shared.client).toBe('')
    expect(cleared.shared.contact).toBe('A mano')
  })
  it('no toca los datos del emisor ni los códigos', () => {
    const shared = { ...emptyShared(), issuerName: 'Camilo Jara', quoteCode: 'COT-1' }
    const r = relink(shared, {}, { client: 'X' }).shared
    expect(r.issuerName).toBe('Camilo Jara')
    expect(r.quoteCode).toBe('COT-1')
  })
})

describe('surveysForQuote', () => {
  const survey = (code: string, client: string) => ({ code, client, date: '', updatedAt: 0 })
  const all = [survey('IL-1', 'DAG — Comunidad Ranco'), survey('IL-2', 'DAG — Edificio Egeo'), survey('IL-3', 'otro — Egeo')]
  it('sin cotización elegida muestra todos los levantamientos', () => {
    expect(surveysForQuote(undefined, all)).toEqual(all)
  })
  it('con cotización muestra solo los del mismo cliente y activo', () => {
    expect(surveysForQuote('DAG — Edificio Egeo', all).map((r) => r.code)).toEqual(['IL-2'])
  })
  it('ignora mayúsculas, tildes y espacios de más al comparar', () => {
    expect(surveysForQuote('  dag  —  edificio EGEO ', all).map((r) => r.code)).toEqual(['IL-2'])
    expect(surveysForQuote('DAG — Comunidad Ranco', [survey('IL-9', 'dag — comunidád  ranco')]).map((r) => r.code)).toEqual(['IL-9'])
  })
  it('una cotización sin levantamientos de su activo da una lista vacía', () => {
    expect(surveysForQuote('X — Y', all)).toEqual([])
  })
})

describe('conflictos entre lo escrito y lo enlazado', () => {
  const typed = { ...emptyShared(), client: 'Blanco Propiedad', asset: 'Mare Nostrum' }
  it('avisa los datos que se mantuvieron porque el documento trae otro valor', () => {
    expect(linkConflicts(typed, {}, { client: 'CBRE', asset: 'Mare Nostrum', address: 'Calle 1' })).toEqual(['client'])
  })
  it('no avisa lo que se puede reemplazar sin riesgo (vacío o cargado antes por un enlace)', () => {
    const loaded = relink(emptyShared(), {}, { client: 'DAG' })
    expect(linkConflicts(loaded.shared, loaded.autofill, { client: 'CBRE' })).toEqual([])
  })
  it('forceRelink reemplaza con lo del documento y deja lo que este no trae', () => {
    const r = forceRelink(typed, {}, { client: 'CBRE' })
    expect(r.shared).toMatchObject({ client: 'CBRE', asset: 'Mare Nostrum' })
    expect(r.autofill).toEqual({ client: 'CBRE' })
    // y después un cambio de enlace ya lo trata como cargado, no como escrito a mano
    expect(relink(r.shared, r.autofill, { client: 'Otro' }).shared.client).toBe('Otro')
  })
})
