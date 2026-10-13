import { normativeItems } from '../../services/normative'
import { ACCESS_MODE_LABEL } from '../../lib/access'
import { keys } from '../../lib/keys'
import { EditableText } from '../EditableText'
import { setValue, valueOf, type RenderCtx } from './ctx'

export function NormativeSection({ ctx }: { ctx: RenderCtx }) {
  const { state, def, readOnly } = ctx
  const items = normativeItems(def, state.accessMode)
  return (
    <>
      <p>
        Normas de referencia aplicadas a este servicio y a la modalidad de acceso{' '}
        <b>{ACCESS_MODE_LABEL[state.accessMode].toLowerCase()}</b>.
      </p>
      <table className="t t--fixed">
        <thead><tr><th>Norma</th><th style={{ width: '18%' }}>Estado</th></tr></thead>
        <tbody>
          {items.map((n, i) => {
            const key = keys.norm(state.accessMode, i)
            return (
              <tr key={n.id} data-row>
                <td><EditableText value={valueOf(ctx, key, n.text)} onChange={(v) => setValue(ctx, key, v)} readOnly={readOnly} /></td>
                <td><span className={`chip ${n.status === 'validated' ? '' : 'chip--signal'}`}>{n.status === 'validated' ? 'validada' : 'por validar'}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
