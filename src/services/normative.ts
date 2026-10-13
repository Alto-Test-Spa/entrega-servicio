import type { AccessMode } from '../types'
import type { NormativeItem, ServiceDefinition } from './types'

// Propuesta basada en fuentes públicas (spec, Anexo A). Todo lo nuevo entra "por validar":
// avisa antes de emitir y no bloquea, hasta que Alto Test lo confirme.
export const GENERAL_NORMATIVE: NormativeItem[] = [
  { id: 'ley-16744', text: 'Ley N°16.744 · Seguro social contra accidentes del trabajo y enfermedades profesionales', status: 'to_validate' },
  { id: 'ds-44', text: 'D.S. N°44 · Reglamento de gestión preventiva de riesgos laborales (vigente desde 01.02.2025)', status: 'to_validate' },
  { id: 'ds-594', text: 'D.S. N°594 · Condiciones sanitarias y ambientales básicas en los lugares de trabajo', status: 'to_validate' },
]

export const HEIGHT_NORMATIVE_COMMON: NormativeItem[] = [
  { id: 'nch-1258', text: 'NCh 1258 · Equipos de protección personal contra caídas', status: 'to_validate' },
]

export const HEIGHT_NORMATIVE_BY_MODE: Record<AccessMode, NormativeItem[]> = {
  ground: [],
  suspended_platform: [
    { id: 'en-1808', text: 'EN 1808:2015 · Equipos de acceso suspendidos (plataformas y carros colgantes)', status: 'to_validate' },
  ],
  rope: [
    { id: 'en-12841', text: 'EN 12841 · Sistemas de acceso por cuerdas: dispositivos de ajuste de cuerda', status: 'to_validate' },
    { id: 'iso-22846', text: 'ISO 22846-1:2003 y 22846-2:2012 · Acceso por cuerdas: principios y código de práctica', status: 'to_validate' },
    { id: 'irata-icop', text: 'IRATA ICOP · Código internacional de práctica de acceso por cuerdas', status: 'to_validate' },
  ],
}

// Normativa del servicio + bloque de altura según la modalidad. Sin duplicados: gana la primera
// aparición (la del servicio, que puede ya estar validada).
export function normativeItems(def: ServiceDefinition, mode: AccessMode): NormativeItem[] {
  const height = mode === 'ground' ? [] : [...HEIGHT_NORMATIVE_COMMON, ...HEIGHT_NORMATIVE_BY_MODE[mode]]
  const seen = new Set<string>()
  return [...def.normative, ...height].filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)))
}
