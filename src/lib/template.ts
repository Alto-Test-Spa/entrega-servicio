import type { EntregaState, SharedData } from '../types'
import { generateCode } from './code'
import { todayDate } from './date'
import { DEFAULT_ISSUER } from '../services/common'
import { getService } from '../services'

export const DEFAULT_COVER_VEIL = 60

export function emptyShared(): SharedData {
  return { client: '', asset: '', address: '', contact: '', executionDate: '', quoteCode: '', surveyCode: '', issuerName: '', issuerRole: '' }
}

export function initialState(serviceId: string, now: Date = new Date()): EntregaState {
  const def = getService(serviceId)
  const tables: Record<string, string[][]> = {}
  for (const s of def.sections) if (s.kind === 'table') tables[s.id] = s.rows.map((r) => [...r])
  return {
    code: generateCode(now),
    serviceId,
    shared: { ...emptyShared(), ...DEFAULT_ISSUER, executionDate: todayDate(now) },
    hiddenSections: [],
    values: {},
    tables,
    coverVeil: DEFAULT_COVER_VEIL,
    photos: [],
    findings: [],
    status: 'draft',
  }
}

// Un documento guardado con una versión anterior puede venir sin algún campo nuevo: se completa
// con el estado inicial del mismo servicio. Un servicio que ya no existe lanza un error claro.
export function normalizeState(raw: unknown): EntregaState {
  const doc = (raw ?? {}) as Partial<EntregaState>
  const base = initialState(String(doc.serviceId ?? ''))
  return {
    ...base,
    ...doc,
    shared: { ...base.shared, ...doc.shared },
    tables: { ...base.tables, ...doc.tables },
    values: doc.values ?? {},
    hiddenSections: doc.hiddenSections ?? [],
    photos: doc.photos ?? [],
    findings: doc.findings ?? [],
  }
}
