import type { EntregaState } from '../types'
import { normalizeState } from './template'

const BASE_URL = import.meta.env.VITE_REPORTS_ENDPOINT
const ACCESS_KEY_STORAGE = 'altotest_entrega_servicio_access_key'

// Tipo de documento de esta app: va en la ruta (/reports/entrega/:code). El Worker es compartido.
const KIND = 'entrega'

// Un valor de KV admite 25 MB. Se corta antes (20 MB) para dejar margen al sobre JSON.
export const MAX_DOC_BYTES = 20 * 1024 * 1024

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error'

export function getStoredAccessKey(): string {
  return localStorage.getItem(ACCESS_KEY_STORAGE) ?? ''
}
export function setStoredAccessKey(key: string) {
  localStorage.setItem(ACCESS_KEY_STORAGE, key)
}
export function clearStoredAccessKey() {
  localStorage.removeItem(ACCESS_KEY_STORAGE)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
      Authorization: `Bearer ${getStoredAccessKey()}`,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, text || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export interface ReportSummary {
  code: string
  client: string
  date: string
  updatedAt: number
}

interface ReportEnvelope {
  code: string
  kind: string
  client: string
  date: string
  updatedAt: number
  doc: unknown
}

export async function verifyAccessKey(key: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/reports/${KIND}`, { headers: { Authorization: `Bearer ${key}` } })
  return res.ok
}

export function listReports(): Promise<ReportSummary[]> {
  return request<ReportSummary[]>(`/reports/${KIND}`)
}

export async function fetchReport(code: string): Promise<EntregaState> {
  const envelope = await request<ReportEnvelope>(`/reports/${KIND}/${encodeURIComponent(code)}`)
  return normalizeState(envelope.doc)
}

// Lee el documento crudo de otra app de la familia (levantamiento o cotización) para precargar datos.
export async function fetchLinked(kind: 'informe' | 'economica', code: string): Promise<unknown> {
  const envelope = await request<ReportEnvelope>(`/reports/${kind}/${encodeURIComponent(code)}`)
  return envelope.doc
}

export function toEnvelopeBody(state: EntregaState) {
  const client = [state.shared.client, state.shared.asset].filter(Boolean).join(' — ')
  return { code: state.code, client, date: state.shared.executionDate, doc: state }
}

export function assertWithinSizeLimit(state: EntregaState): void {
  if (JSON.stringify(state).length > MAX_DOC_BYTES) {
    throw new ApiError(413, 'El informe quedó demasiado pesado para guardarlo en la nube. Quita o reemplaza fotos.')
  }
}

export function saveReport(state: EntregaState): Promise<{ ok: boolean; updatedAt: number }> {
  assertWithinSizeLimit(state)
  return request(`/reports/${KIND}/${encodeURIComponent(state.code)}`, {
    method: 'PUT',
    body: JSON.stringify(toEnvelopeBody(state)),
  })
}

export function deleteReport(code: string): Promise<{ ok: boolean }> {
  return request(`/reports/${KIND}/${encodeURIComponent(code)}`, { method: 'DELETE' })
}
