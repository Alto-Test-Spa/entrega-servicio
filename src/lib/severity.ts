import type { Severity } from '../types'

// Mismo mapeo que informe_levantamiento: solo lo crítico lleva el naranjo pleno.
export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#c2491f',
  needs_action: '#e2723d',
  observation: '#4c6b7a',
  compliant: '#8fa3ad',
}
