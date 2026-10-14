import type { SharedData } from '../types'
import type { ReportSummary } from './api'

type Linked = Partial<Pick<SharedData, 'client' | 'asset' | 'address' | 'contact'>>

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)

function pick(entries: [keyof Linked, string | undefined][]): Linked {
  const out: Linked = {}
  for (const [key, value] of entries) if (value !== undefined) out[key] = value
  return out
}

// Adaptadores tolerantes: un campo que no exista o no sea texto se omite, nunca lanza.
export function fromQuote(doc: unknown): Linked {
  if (!doc || typeof doc !== 'object') return {}
  const d = doc as Record<string, unknown>
  const contact = [str(d.email), str(d.phone)].filter(Boolean).join(' · ') || undefined
  return pick([['client', str(d.clientName)], ['asset', str(d.assetName)], ['address', str(d.address)], ['contact', contact]])
}

export function fromSurvey(doc: unknown): Linked {
  if (!doc || typeof doc !== 'object') return {}
  const d = doc as Record<string, unknown>
  return pick([['client', str(d.clientName)], ['asset', str(d.clientAsset)], ['contact', str(d.clientContact)]])
}

export type Autofill = Partial<Record<keyof Linked, string>>
export const LINKED_KEYS = ['client', 'asset', 'address', 'contact'] as const

const isReplaceable = (shared: SharedData, autofill: Autofill, key: keyof Linked) =>
  shared[key].trim() === '' || shared[key] === autofill[key]

// Datos que `relink` va a mantener aunque el documento enlazado traiga otro valor (escritos a mano, o
// de antes de que se registrara qué cargó cada enlace). La interfaz los avisa y ofrece reemplazarlos.
export function linkConflicts(shared: SharedData, autofill: Autofill, ...sources: Linked[]): (keyof Linked)[] {
  return LINKED_KEYS.filter((key) => {
    const next = sources.map((s) => s[key]).find((v) => v !== undefined)
    return next !== undefined && next !== shared[key] && !isReplaceable(shared, autofill, key)
  })
}

// Reemplazo explícito (lo pidió la persona): pisa con lo que traen los documentos; lo que no traen se deja.
export function forceRelink(shared: SharedData, autofill: Autofill, ...sources: Linked[]): { shared: SharedData; autofill: Autofill } {
  const nextShared = { ...shared }
  const nextFill: Autofill = { ...autofill }
  for (const key of LINKED_KEYS) {
    const next = sources.map((s) => s[key]).find((v) => v !== undefined)
    if (next === undefined) continue
    nextShared[key] = next
    nextFill[key] = next
  }
  return { shared: nextShared, autofill: nextFill }
}

// Recalcula los datos que vienen de los documentos enlazados. Por campo manda la primera fuente que lo
// trae (cotización antes que levantamiento). Se reemplaza lo que estaba vacío o lo que cargó antes un
// enlace (`autofill` recuerda qué se cargó); lo que la persona escribió o corrigió a mano no se toca.
export function relink(shared: SharedData, autofill: Autofill, ...sources: Linked[]): { shared: SharedData; autofill: Autofill } {
  const nextShared = { ...shared }
  const nextFill: Autofill = { ...autofill }
  for (const key of LINKED_KEYS) {
    const next = sources.map((s) => s[key]).find((v) => v !== undefined) ?? ''
    if (!isReplaceable(shared, autofill, key)) continue
    nextShared[key] = next
    if (next) nextFill[key] = next
    else delete nextFill[key]
  }
  return { shared: nextShared, autofill: nextFill }
}

const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

// Los resúmenes de cotización y levantamiento llevan "Cliente — Activo" con el mismo formato.
// Con una cotización elegida, solo se ofrecen los levantamientos de ese cliente y activo.
export function surveysForQuote(quoteClient: string | undefined, surveys: ReportSummary[]): ReportSummary[] {
  if (quoteClient === undefined) return surveys
  return surveys.filter((r) => norm(r.client) === norm(quoteClient))
}
