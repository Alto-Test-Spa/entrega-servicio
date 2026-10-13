import type { SectionDef, ServiceDefinition } from '../services/types'

export interface NumberedSection {
  section: SectionDef
  number: number
}

export function isHideable(def: ServiceDefinition, id: string): boolean {
  const section = def.sections.find((s) => s.id === id)
  return !!section && !section.fixed
}

// ÚNICO lugar que calcula números de sección: el índice, los encabezados y la portada leen de acá.
export function activeSections(def: ServiceDefinition, hidden: string[]): NumberedSection[] {
  const hide = new Set(hidden)
  let n = 0
  return def.sections
    .filter((s) => s.fixed || !hide.has(s.id))
    .map((section) => ({ section, number: ++n }))
}

export function toggleSection(hidden: string[], def: ServiceDefinition, id: string): string[] {
  if (!isHideable(def, id)) return hidden
  return hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id]
}
