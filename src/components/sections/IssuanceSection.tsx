import type { RenderCtx } from './ctx'

// Una sola persona, sin línea de firma y sin tabla de revisiones (decisión de Matías).
export function IssuanceSection({ ctx }: { ctx: RenderCtx }) {
  const { state } = ctx
  const s = state.shared
  return (
    <dl className="facts">
      <div><dt>Código del informe</dt><dd className="mono">{state.code}</dd></div>
      <div><dt>Revisión</dt><dd>Rev. 0 · Emisión inicial</dd></div>
      <div><dt>Fecha de ejecución</dt><dd>{s.executionDate || '—'}</dd></div>
      <div><dt>Emitido por</dt><dd><b>{s.issuerName || '—'}</b><br />{s.issuerRole || '—'}</dd></div>
    </dl>
  )
}
