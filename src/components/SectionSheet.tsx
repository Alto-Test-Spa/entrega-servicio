import type { ReactNode } from 'react'
import type { NumberedSection } from '../lib/sections'
import { keys } from '../lib/keys'
import { EditableText } from './EditableText'
import { setValue, type RenderCtx } from './sections/ctx'

const GROUP_LABEL = { common: 'Común', service: 'Propia del servicio', closing: 'Cierre' } as const

// En pantalla es una hoja Carta; al imprimir fluye: el navegador la reparte en las hojas que necesite.
export function SectionSheet({ numbered, ctx, baseTitle, children }: { numbered: NumberedSection; ctx: RenderCtx; baseTitle: string; children: ReactNode }) {
  const { section, number } = numbered
  return (
    <section className="sheet" data-sheet={section.id} data-sheet-kind={section.kind} data-sheet-title={section.title}>
      <div className="sheet-body">
        <p className="sec-eyebrow">
          <span>Sección {String(number).padStart(2, '0')}</span>
          <span className={`chip ${section.group === 'service' ? 'chip--signal' : ''}`}>{GROUP_LABEL[section.group]}</span>
        </p>
        <h3 className="sheet-title">
          <EditableText value={section.title} onChange={(v) => setValue(ctx, keys.title(section.id), v.trim() === baseTitle ? '' : v)} placeholder={baseTitle} readOnly={ctx.readOnly} />
        </h3>
        {children}
      </div>
    </section>
  )
}
