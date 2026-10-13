import type { EntregaState } from '../../types'
import type { ServiceDefinition } from '../../services/types'
import { effectiveValue } from '../../lib/fields'

export interface RenderCtx {
  state: EntregaState
  def: ServiceDefinition
  vars: Record<string, string> // contexto de interpolación (buildContext)
  readOnly: boolean
  update: (fn: (s: EntregaState) => EntregaState) => void
}

export const valueOf = (ctx: RenderCtx, key: string, fallback: string) => effectiveValue(ctx.state, key, fallback, ctx.vars)

export const setValue = (ctx: RenderCtx, key: string, value: string) =>
  ctx.update((s) => ({ ...s, values: { ...s.values, [key]: value } }))
