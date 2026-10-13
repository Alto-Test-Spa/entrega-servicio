import { interpolate } from '../../lib/interpolate'
import { ACCESS_MODE_LABEL } from '../../lib/access'
import type { RenderCtx } from './ctx'

// Los datos únicos se editan en el panel lateral; acá solo se muestran.
export function IdentificationSection({ ctx }: { ctx: RenderCtx }) {
  const { state, def, vars } = ctx
  const s = state.shared
  return (
    <>
      <p className="lead">{interpolate(def.intro, vars)}</p>
      <dl className="facts">
        <div><dt>Código del informe</dt><dd className="mono">{state.code}</dd></div>
        <div><dt>Revisión</dt><dd>Rev. 0</dd></div>
        <div><dt>Cliente</dt><dd>{s.client || '—'}</dd></div>
        <div><dt>Activo</dt><dd>{s.asset || '—'}</dd></div>
        <div><dt>Ubicación</dt><dd>{s.address || '—'}</dd></div>
        {s.contact && <div><dt>Contacto</dt><dd>{s.contact}</dd></div>}
        <div><dt>Fecha de ejecución</dt><dd>{s.executionDate || '—'}</dd></div>
        <div><dt>Modalidad de acceso</dt><dd>{ACCESS_MODE_LABEL[state.accessMode]}</dd></div>
      </dl>
      {(s.quoteCode || s.surveyCode) && (
        <>
          <h4>Trazabilidad del activo</h4>
          <div className="chips">
            {s.surveyCode && <span className="chip chip--signal">Levantamiento {s.surveyCode}</span>}
            {s.quoteCode && <span className="chip chip--signal">Cotización {s.quoteCode}</span>}
          </div>
        </>
      )}
    </>
  )
}
