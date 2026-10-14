import type { ReactNode } from 'react'
import type { SectionDef } from '../../services/types'
import type { RenderCtx } from './ctx'
import { AnnexesSection } from './AnnexesSection'
import { FactsSection } from './FactsSection'
import { FindingsSection } from './FindingsSection'
import { IdentificationSection } from './IdentificationSection'
import { LayoutSection } from './LayoutSection'
import { PhotosSection } from './PhotosSection'
import { TableSection } from './TableSection'

// Un renderizador genérico por tipo de sección. Un servicio nuevo NO agrega componentes: usa estos.
export function renderSection(section: SectionDef, ctx: RenderCtx): ReactNode {
  switch (section.kind) {
    case 'identification': return <IdentificationSection ctx={ctx} />
    case 'table': return <TableSection section={section} ctx={ctx} />
    case 'facts': return <FactsSection section={section} ctx={ctx} />
    case 'layout': return <LayoutSection section={section} ctx={ctx} />
    case 'photos': return <PhotosSection ctx={ctx} />
    case 'annexes': return <AnnexesSection section={section} ctx={ctx} />
    case 'findings': return <FindingsSection ctx={ctx} />
  }
}
