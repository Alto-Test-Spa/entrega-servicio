import { interpolate } from '../../lib/interpolate'
import { keys } from '../../lib/keys'
import { nextIntervention } from '../../lib/summary'
import { EditableText } from '../EditableText'
import { setValue, valueOf, type RenderCtx } from './ctx'

// Los datos únicos se editan en el panel lateral; acá solo se muestran. Orden pensado para quien lee:
// primero el resultado y las cifras, luego la ficha de datos y, al final, el objetivo.
export function IdentificationSection({ ctx }: { ctx: RenderCtx }) {
  const { state, def, vars, readOnly } = ctx
  const s = state.shared
  const next = nextIntervention(state, def)
  const [nextWhen, ...nextWhat] = next.split(' · ')
  const dash = (v: string) => v || '—'
  return (
    <>
      <div className="callout">
        <h4>Resumen del resultado</h4>
        <EditableText
          value={valueOf(ctx, keys.summary, '')}
          onChange={(v) => setValue(ctx, keys.summary, v)}
          placeholder="Ej. 18 puntos instalados y ensayados, todos conformes; 1 desviación de ejecución documentada"
          multiline
          readOnly={readOnly}
        />
      </div>
      <div className="kpis">
        <div className="kpi"><span className="kpi-label">Hallazgos fuera de alcance</span><span className="kpi-n">{state.findings.length}</span></div>
        <div className="kpi"><span className="kpi-label">Con riesgo inmediato</span><span className="kpi-n">{state.findings.filter((f) => f.immediateRisk).length}</span></div>
        {next && (
          <div className="kpi">
            <span className="kpi-label">Próxima intervención</span>
            <span className="kpi-n kpi-n--text">{nextWhen}</span>
            {nextWhat.length > 0 && <span className="kpi-sub">{nextWhat.join(' · ')}</span>}
          </div>
        )}
      </div>

      <h4>Datos del servicio</h4>
      <dl className="spec">
        <div><dt>Cliente</dt><dd>{dash(s.client)}</dd></div>
        <div><dt>Activo</dt><dd>{dash(s.asset)}</dd></div>
        <div><dt>Ubicación</dt><dd>{dash(s.address)}</dd></div>
        {s.contact && <div><dt>Contacto</dt><dd>{s.contact}</dd></div>}
        <div><dt>Fecha de ejecución</dt><dd>{dash(s.executionDate)}</dd></div>
        <div><dt>Código del informe</dt><dd className="mono">{state.code} · Rev. 0</dd></div>
        {s.quoteCode && <div><dt>Cotización</dt><dd className="mono">{s.quoteCode}</dd></div>}
        {s.surveyCode && <div><dt>Levantamiento</dt><dd className="mono">{s.surveyCode}</dd></div>}
      </dl>

      <h4>Objetivo</h4>
      <p className="lead">{interpolate(def.intro, vars)}</p>
    </>
  )
}
