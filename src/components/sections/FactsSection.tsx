import type { SectionDef } from '../../services/types'
import { keys } from '../../lib/keys'
import { EditableText } from '../EditableText'
import { setValue, valueOf, type RenderCtx } from './ctx'

type FactsDef = Extract<SectionDef, { kind: 'facts' }>

export function FactsSection({ section, ctx }: { section: FactsDef; ctx: RenderCtx }) {
  const { readOnly } = ctx
  return (
    <>
      <dl className="spec">
        {section.facts.map((f, i) => {
          const key = keys.fact(section.id, i)
          return (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd><EditableText value={valueOf(ctx, key, f.value)} onChange={(v) => setValue(ctx, key, v)} placeholder={f.hint} multiline readOnly={readOnly} /></dd>
            </div>
          )
        })}
      </dl>
      <div className="callout">
        <h4>Conclusión</h4>
        <EditableText
          value={valueOf(ctx, keys.conclusion(section.id), '')}
          onChange={(v) => setValue(ctx, keys.conclusion(section.id), v)}
          placeholder={section.conclusionHint}
          multiline
          readOnly={readOnly}
        />
      </div>
    </>
  )
}
