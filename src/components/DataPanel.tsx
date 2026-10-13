import { useState } from 'react'
import type { EntregaState, SharedData } from '../types'
import { SHARED_FIELDS } from '../lib/fields'
import { formatDateInput, isValidDate } from '../lib/date'
import { ApiError, fetchLinked } from '../lib/api'
import { fromQuote, fromSurvey, mergeLinked } from '../lib/links'

interface Props {
  state: EntregaState
  onChange: (patch: Partial<SharedData>) => void
  onMerge: (merge: (shared: SharedData) => SharedData) => void
}

export function DataPanel({ state, onChange, onMerge }: Props) {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  // Lee la cotización y/o el levantamiento enlazados y precarga cliente, activo, dirección y contacto.
  async function loadLinked() {
    const { quoteCode, surveyCode } = state.shared
    if (!quoteCode.trim() && !surveyCode.trim()) return void setStatus('Escribe el código de la cotización o del levantamiento.')
    setLoading(true)
    setStatus('')
    const messages: string[] = []
    const sources: Partial<SharedData>[] = []
    for (const [kind, code, adapt, label] of [
      ['economica', quoteCode.trim(), fromQuote, 'la cotización'],
      ['informe', surveyCode.trim(), fromSurvey, 'el levantamiento'],
    ] as const) {
      if (!code) continue
      try {
        sources.push(adapt(await fetchLinked(kind, code)))
        messages.push(`Datos de ${label} cargados.`)
      } catch (e) {
        messages.push(e instanceof ApiError && e.status === 404 ? `No existe ${label} ${code}.` : `No se pudo leer ${label}. Completa a mano.`)
      }
    }
    if (sources.length) onMerge((shared) => mergeLinked(shared, ...sources))
    setStatus(messages.join(' '))
    setLoading(false)
  }

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
      <button type="button" className="sbtn" disabled={loading} onClick={() => void loadLinked()}>
        {loading ? 'Cargando…' : 'Cargar datos de los códigos enlazados'}
      </button>
      {status && <p className="hint" role="status">{status}</p>}
      <p className="hint">Cada dato se propaga a la portada, la identificación, los textos y la emisión. Lo que ya escribiste no se pisa.</p>
    </section>
  )
}
