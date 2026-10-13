import type { AccessMode } from '../types'

export const ACCESS_MODE_LABEL: Record<AccessMode, string> = {
  ground: 'A nivel de piso o azotea',
  suspended_platform: 'Altura · carro colgante',
  rope: 'Altura · cuerdas (rappel)',
}

// El carro colgante exige el N.º de serie: queda entre corchetes a propósito, así que
// el validador bloquea la emisión hasta que la persona lo reemplace.
export const ACCESS_EQUIPMENT: Record<AccessMode, string> = {
  ground: 'Escalas y pértigas telescópicas',
  suspended_platform: 'Carro colgante · N.º de serie [por completar]',
  rope: 'Acceso por cuerdas · línea de trabajo y de seguridad independientes',
}
