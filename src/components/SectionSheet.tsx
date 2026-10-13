import type { ReactNode } from 'react'
import type { NumberedSection } from '../lib/sections'

const GROUP_LABEL = { common: 'Común', service: 'Propia del servicio', closing: 'Cierre' } as const

// En pantalla es una hoja Carta; al imprimir fluye: el navegador la reparte en las hojas que necesite.
export function SectionSheet({ numbered, children }: { numbered: NumberedSection; children: ReactNode }) {
  const { section, number } = numbered
  return (
    <section className="sheet" data-sheet={section.id} data-sheet-kind={section.kind} data-sheet-title={section.title}>
      <div className="sheet-body">
        <p className="sec-eyebrow">
          <span>Sección {String(number).padStart(2, '0')}</span>
          <span className={`chip ${section.group === 'service' ? 'chip--signal' : ''}`}>{GROUP_LABEL[section.group]}</span>
        </p>
        <h3 className="sheet-title">{section.title}</h3>
        {children}
      </div>
    </section>
  )
}
