import type { SectionDef } from '../../services/types'
import { keys } from '../../lib/keys'
import { EditableText } from '../EditableText'
import { setValue, valueOf, type RenderCtx } from './ctx'

type AnnexesDef = Extract<SectionDef, { kind: 'annexes' }>

export function AnnexesSection({ section, ctx }: { section: AnnexesDef; ctx: RenderCtx }) {
  return (
    <>
      <table className="t t--fixed">
        <thead><tr><th style={{ width: '10%' }}>Anexo</th><th>Documento</th><th style={{ width: '34%' }}>Vigencia</th></tr></thead>
        <tbody>
          {section.annexes.map((a, i) => {
            const key = keys.annexValidity(section.id, i)
            return (
              <tr key={a.letter} data-row>
                <td className="mono">{a.letter}</td>
                <td>{a.title}</td>
                <td>
                  {a.hasValidity ? (
                    <EditableText value={valueOf(ctx, key, '')} onChange={(v) => setValue(ctx, key, v)} placeholder="Ej. vigente hasta 12.03.2027" readOnly={ctx.readOnly} />
                  ) : (
                    <span className="chip">No aplica</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="hint no-print">La vigencia es texto libre. Una fecha vencida avisa antes de emitir, pero no bloquea.</p>
    </>
  )
}
