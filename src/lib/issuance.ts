import type { EntregaState } from '../types'
import { hasBlocks, type Issue } from './validate'

// Cualquier edición real de un informe emitido lo devuelve a borrador (decisión de Matías).
// Si `next` es el mismo objeto no hubo edición; si pasa de borrador a emitido es la emisión.
export function applyEdit(prev: EntregaState, next: EntregaState): EntregaState {
  if (next === prev) return prev
  if (prev.status === 'issued' && next.status === 'issued') return { ...next, status: 'draft' }
  return next
}

export function issueReport(state: EntregaState, issues: Issue[]): EntregaState {
  if (hasBlocks(issues)) throw new Error('No se puede emitir: hay bloqueos pendientes')
  return { ...state, status: 'issued' }
}
