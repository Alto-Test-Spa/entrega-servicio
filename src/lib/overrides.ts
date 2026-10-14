import type { ServiceDefinition } from '../services/types'
import { keys } from './keys'

// Títulos de sección y encabezados de tabla que quien emite renombró en este informe. Vacío = el original.
export function applyOverrides(def: ServiceDefinition, values: Record<string, string>): ServiceDefinition {
  return {
    ...def,
    sections: def.sections.map((s) => {
      const title = values[keys.title(s.id)]?.trim() || s.title
      if (s.kind !== 'table') return { ...s, title }
      return { ...s, title, columns: s.columns.map((c, i) => ({ ...c, label: values[keys.column(s.id, i)]?.trim() || c.label })) }
    }),
  }
}
