import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { buildContext } from '../lib/interpolate'
import { activeSections } from '../lib/sections'
import { Cover } from './Cover'
import { PrintStyles } from './PrintStyles'
import { applyOverrides } from '../lib/overrides'
import { SectionSheet } from './SectionSheet'
import { TableOfContents } from './TableOfContents'
import { renderSection } from './sections'
import type { RenderCtx } from './sections/ctx'

interface Props {
  state: EntregaState
  def: ServiceDefinition
  readOnly?: boolean
  update?: RenderCtx['update']
}

export function EntregaDocument({ state, def: baseDef, readOnly = false, update }: Props) {
  const def = applyOverrides(baseDef, state.values)
  const sections = activeSections(def, state.hiddenSections)
  const ctx: RenderCtx = { state, def, vars: buildContext(state), readOnly, update: update ?? (() => {}) }
  return (
    <div className="doc" data-folio={state.code}>
      <PrintStyles code={state.code} />
      <Cover state={state} def={def} />
      <TableOfContents sections={sections} />
      {sections.map((n) => (
        <SectionSheet key={n.section.id} numbered={n} ctx={ctx} baseTitle={baseDef.sections.find((x) => x.id === n.section.id)?.title ?? ''}>
          {renderSection(n.section, ctx)}
        </SectionSheet>
      ))}
    </div>
  )
}
