import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { dueLabel } from './date'
import { activeSections } from './sections'

// Próxima intervención recomendada: el primer hito del plan de mantención (visible) con su fecha
// calculada. Vacío si el plan está oculto, no hay fecha de ejecución o ningún hito dice meses.
export function nextIntervention(state: EntregaState, def: ServiceDefinition): string {
  const plan = activeSections(def, state.hiddenSections).find((s) => s.section.id === 'maintenance')?.section
  if (!plan || plan.kind !== 'table') return ''
  const rows = state.tables[plan.id] ?? plan.rows
  for (const row of rows) {
    const label = dueLabel(state.shared.executionDate, row[0] ?? '')
    if (label) return `${label} · ${row[1] ?? ''}`.replace(/ · $/, '')
  }
  return ''
}
