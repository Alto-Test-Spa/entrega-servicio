import type { NumberedSection } from '../lib/sections'

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
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
