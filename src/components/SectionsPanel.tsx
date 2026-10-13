import type { SectionDef, ServiceDefinition } from '../services/types'
import { activeSections } from '../lib/sections'

interface Props {
  def: ServiceDefinition
  hidden: string[]
  onToggle: (id: string) => void
}

const GROUP_LABEL = { common: 'Secciones comunes', service: 'Propias de este servicio', closing: 'Cierre' } as const

export function SectionsPanel({ def, hidden, onToggle }: Props) {
  const numbered = new Map(activeSections(def, hidden).map((n) => [n.section.id, n]))
  let last = ''
  return (
    <section className="box" aria-labelledby="h-sec">
      <h2 id="h-sec">Secciones · ocultables</h2>
      <ul className="toggles">
        {def.sections.map((s: SectionDef) => {
          const n = numbered.get(s.id)
          const heading = s.group !== last ? ((last = s.group), <li className="grp">{GROUP_LABEL[s.group]}</li>) : null
          return (
            <li key={s.id} style={{ display: 'contents' }}>
              {heading}
              <label>
                <span className="n">{n ? String(n.number).padStart(2, '0') : '–'}</span>
                <input type="checkbox" checked={!!n} disabled={s.fixed} onChange={() => onToggle(s.id)} />
                <span>{s.title}{s.fixed ? ' (fija)' : ''}</span>
              </label>
            </li>
          )
        })}
      </ul>
      <p className="hint">Al ocultar una sección, el índice y la numeración se ajustan solos.</p>
    </section>
  )
}
