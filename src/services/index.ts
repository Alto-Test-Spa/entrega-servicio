import { anchors } from './anchors'
import type { ServiceDefinition } from './types'

// Agregar un servicio = escribir su archivo de definición y sumarlo acá.
export const SERVICES: Record<string, ServiceDefinition> = { anchors }
export const SERVICE_LIST: ServiceDefinition[] = Object.values(SERVICES)

export function getService(id: string): ServiceDefinition {
  const def = SERVICES[id]
  if (!def) throw new Error(`Servicio desconocido: ${id}`)
  return def
}
