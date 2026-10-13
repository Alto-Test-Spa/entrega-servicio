import type { EntregaState, SharedData } from '../types'
import { SHARED_FIELDS } from '../lib/fields'
import { formatDateInput, isValidDate } from '../lib/date'

interface Props {
  state: EntregaState
  onChange: (patch: Partial<SharedData>) => void
}

export function DataPanel({ state, onChange }: Props) {
  return (
    <section className="box" aria-labelledby="h-datos">
      <h2 id="h-datos">Datos únicos · se ingresan una vez</h2>
      {SHARED_FIELDS.map(({ key, label }) => {
        const value = state.shared[key]
        const invalid = key === 'executionDate' && value !== '' && !isValidDate(value)
        return (
          <div key={key} className={`field ${invalid ? 'field--error' : ''}`}>
            <label htmlFor={`d-${key}`}>{label}</label>
            <input
              id={`d-${key}`}
              value={value}
              autoComplete="off"
              placeholder={key === 'executionDate' ? 'dd/mm/aaaa' : undefined}
              onChange={(e) => onChange({ [key]: key === 'executionDate' ? formatDateInput(e.target.value) : e.target.value })}
            />
          </div>
        )
      })}
      <p className="hint">Cada dato se propaga a la portada, la identificación, los textos y la emisión.</p>
    </section>
  )
}
