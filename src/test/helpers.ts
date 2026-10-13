import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { collectFields } from '../lib/fields'
import { newPhoto } from '../lib/photos'

// Deja el estado completo y válido: datos únicos, todos los campos obligatorios, plano cargado.
export function fillTemplate(state: EntregaState, def: ServiceDefinition): EntregaState {
  let s: EntregaState = {
    ...state,
    shared: { ...state.shared, client: 'DAG MS', asset: 'Comunidad Ranco', address: 'Luis Carrera #1289, Vitacura', executionDate: '17/09/2026' },
    layoutImage: 'data:image/png;base64,AAAA',
  }
  for (const f of collectFields(s, def)) {
    if (f.required && f.value.trim() === '') s = f.write(s, f.validity ? 'vigente hasta 12.03.2027' : 'dato')
  }
  return s
}

export const photoWithCaption = (caption: string) => ({ ...newPhoto('data:x'), caption })
