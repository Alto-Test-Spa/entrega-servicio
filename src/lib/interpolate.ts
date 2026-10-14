import type { EntregaState } from '../types'

export const KNOWN_VARS = [
  'client', 'asset', 'address', 'contact', 'executionDate', 'quoteCode', 'surveyCode',
  'issuerName', 'issuerRole', 'folio',
] as const
export type KnownVar = (typeof KNOWN_VARS)[number]

// Una variable desconocida se deja tal cual ({{x}}): el validador la marca como texto sin reemplazar.
export function interpolate(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => (name in ctx ? ctx[name] : match))
}

export function buildContext(state: EntregaState): Record<KnownVar, string> {
  const s = state.shared
  return {
    client: s.client,
    asset: s.asset,
    address: s.address,
    contact: s.contact,
    executionDate: s.executionDate,
    quoteCode: s.quoteCode,
    surveyCode: s.surveyCode,
    issuerName: s.issuerName,
    issuerRole: s.issuerRole,
    folio: state.code,
  }
}
