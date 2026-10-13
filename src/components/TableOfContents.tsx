import type { NumberedSection } from '../lib/sections'

const GROUP_LABEL = { common: 'Común', service: 'Propia del servicio', closing: 'Cierre' } as const

export function TableOfContents({ sections }: { sections: NumberedSection[] }) {
  return (
    <section className="sheet" data-sheet="toc" data-sheet-title="Índice">
      <div className="sheet-body">
        <p className="sec-eyebrow">Contenido</p>
        <h3 className="sheet-title">Índice</h3>
        <ol className="toc">
          {sections.map(({ section, number }) => (
            <li key={section.id}>
              <span className="num">{String(number).padStart(2, '0')}</span>
              <span>{section.title}</span>
              <span className={`chip ${section.group === 'service' ? 'chip--signal' : ''}`}>{GROUP_LABEL[section.group]}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
