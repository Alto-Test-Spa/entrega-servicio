import type { SharedData } from '../types'

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

// Rellena solo lo que está vacío (lo escrito a mano manda). La primera fuente tiene prioridad.
export function mergeLinked(shared: SharedData, ...sources: Linked[]): SharedData {
  const merged = { ...shared }
  for (const source of sources) {
    for (const key of ['client', 'asset', 'address', 'contact'] as const) {
      if (merged[key].trim() === '' && source[key]) merged[key] = source[key]!
    }
  }
  return merged
}
