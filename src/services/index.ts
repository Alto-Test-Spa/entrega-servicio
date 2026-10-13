import { anchors } from './anchors'
import { glass } from './glass'
import { seals } from './seals'
import type { ServiceDefinition } from './types'

// Agregar un servicio = escribir su archivo de definición y sumarlo acá.
export const SERVICES: Record<string, ServiceDefinition> = { anchors, glass, seals }
export const SERVICE_LIST: ServiceDefinition[] = Object.values(SERVICES)

export function getService(id: string): ServiceDefinition {
  const def = SERVICES[id]
  if (!def) throw new Error(`Servicio desconocido: ${id}`)
  return def
}
