import { useEffect, useRef, useState } from 'react'
import type { EntregaState, SharedData } from '../types'
import { SHARED_FIELDS } from '../lib/fields'
import { fromIsoDate, toIsoDate } from '../lib/date'
import { ApiError, fetchLinked, listLinked, type ReportSummary } from '../lib/api'
import { LINKED_KEYS, forceRelink, fromQuote, fromSurvey, linkConflicts, relink, surveysForQuote, type Autofill } from '../lib/links'

interface Props {
  state: EntregaState
  onChange: (patch: Partial<SharedData>) => void
  onRelink: (fn: (shared: SharedData, autofill: Autofill) => { shared: SharedData; autofill: Autofill }) => void
}

type Kind = 'economica' | 'informe'
type LinkKey = 'quoteCode' | 'surveyCode'

// Cada código enlazado se elige de una lista (no se escribe), y al elegirlo precarga cliente,
// activo, dirección y contacto.
const LINKS: Record<LinkKey, { kind: Kind; label: string; adapt: typeof fromQuote }> = {
  quoteCode: { kind: 'economica', label: 'la cotización', adapt: fromQuote },
  surveyCode: { kind: 'informe', label: 'el levantamiento', adapt: fromSurvey },
}

const DATA_LABEL = { client: 'Cliente', asset: 'Activo', address: 'Ubicación', contact: 'Contacto' } as const

const optionLabel = (r: ReportSummary) => [r.code, r.client, r.date].filter(Boolean).join(' · ')

export function DataPanel({ state, onChange, onRelink }: Props) {
  const [status, setStatus] = useState('')
  // Datos que se mantuvieron porque ya tenían otro valor: se avisan y se pueden reemplazar.
  const [kept, setKept] = useState<{ keys: (typeof LINKED_KEYS)[number][]; sources: ReturnType<typeof fromQuote>[] } | null>(null)
  const [showAllSurveys, setShowAllSurveys] = useState(false)
  const lastRequest = useRef(0) // si eliges dos veces seguidas, solo cuenta la última respuesta
  // undefined = cargando; null = no se pudo leer
  const [lists, setLists] = useState<Record<Kind, ReportSummary[] | null | undefined>>({ economica: undefined, informe: undefined })

  useEffect(() => {
    let alive = true
    for (const kind of ['economica', 'informe'] as const) {
      listLinked(kind)
        .then((items) => alive && setLists((l) => ({ ...l, [kind]: items })))
        .catch(() => alive && setLists((l) => ({ ...l, [kind]: null })))
    }
    return () => { alive = false }
  }, [])

  // Al cambiar cualquiera de los dos selectores se vuelven a leer AMBOS documentos y se recalculan
  // los datos: la cotización manda sobre el levantamiento, y lo escrito a mano no se pisa.
  const clientOf = (quoteCode: string) => (quoteCode ? lists.economica?.find((r) => r.code === quoteCode)?.client : undefined)

  async function choose(key: LinkKey, code: string) {
    const codes = { quoteCode: state.shared.quoteCode, surveyCode: state.shared.surveyCode, [key]: code }
    // Jerarquía: la cotización manda. Si cambia y el levantamiento elegido no es de su activo, se quita.
    if (key === 'quoteCode' && codes.surveyCode && !showAllSurveys) {
      const keep = surveysForQuote(clientOf(code), lists.informe ?? []).some((r) => r.code === codes.surveyCode)
      if (!keep) codes.surveyCode = ''
    }
    onChange(key === 'quoteCode' ? { quoteCode: code, surveyCode: codes.surveyCode } : { [key]: code })
    const id = ++lastRequest.current
    setKept(null)
    const sources: ReturnType<typeof fromQuote>[] = []
    const messages: string[] = []
    for (const k of ['quoteCode', 'surveyCode'] as const) {
      const { kind, label, adapt } = LINKS[k]
      if (!codes[k]) continue
      try {
        sources.push(adapt(await fetchLinked(kind, codes[k])))
      } catch (e) {
        if (id !== lastRequest.current) return
        // Si un documento no se puede leer, no se recalcula nada: así no se borra lo que ya estaba cargado.
        return void setStatus(e instanceof ApiError && e.status === 404 ? `No existe ${label} ${codes[k]}.` : `No se pudo leer ${label}. Los datos no se cambiaron.`)
      }
    }
    if (id !== lastRequest.current) return
    const conflicts = linkConflicts(state.shared, state.linkedFill ?? {}, ...sources)
    onRelink((shared, autofill) => relink(shared, autofill, ...sources))
    setKept(conflicts.length ? { keys: conflicts, sources } : null)
    if (codes.quoteCode) messages.push('cotización')
    if (codes.surveyCode) messages.push('levantamiento')
    setStatus(messages.length ? `Datos cargados desde: ${messages.join(' y ')}.` : 'Enlaces quitados.')
  }

  return (
    <section className="box" aria-labelledby="h-datos">
      <h2 id="h-datos">Datos únicos · se ingresan una vez</h2>
      {(['quoteCode', 'surveyCode'] as const).map((key) => {
        const value = state.shared[key]
        const label = SHARED_FIELDS.find((f) => f.key === key)!.label
        const list = lists[LINKS[key].kind]
        const filtered = key === 'surveyCode' && !showAllSurveys
        const base = list ?? []
        const items = filtered ? surveysForQuote(clientOf(state.shared.quoteCode), base) : base
        // Un código ya guardado que la lista no trae (o mientras carga) se conserva como opción.
        const known = items.some((r) => r.code === value)
        const empty = list !== undefined && list !== null && items.length === 0
        return (
          <div key={key} className="field">
            <label htmlFor={`d-${key}`}>{label}</label>
            <select id={`d-${key}`} value={value} disabled={list === null || list === undefined} onChange={(e) => void choose(key, e.target.value)}>
              <option value="">{list === undefined ? 'Cargando…' : list === null ? 'No se pudo leer la lista' : empty ? 'Sin levantamientos de este activo' : 'Sin enlazar'}</option>
              {value && !known && <option value={value}>{value}</option>}
              {items.map((r) => (<option key={r.code} value={r.code}>{optionLabel(r)}</option>))}
            </select>
            {key === 'surveyCode' && state.shared.quoteCode && (
              <button type="button" className="link-btn" onClick={() => setShowAllSurveys((v) => !v)}>
                {showAllSurveys ? 'Ver solo los de este activo' : 'Ver todos los levantamientos'}
              </button>
            )}
          </div>
        )
      })}
      {SHARED_FIELDS.filter(({ key }) => key !== 'quoteCode' && key !== 'surveyCode').map(({ key, label }) => {
        const value = state.shared[key]
        if (key === 'executionDate') {
          return (
            <div key={key} className="field">
              <label htmlFor={`d-${key}`}>{label}</label>
              <input id={`d-${key}`} type="date" value={toIsoDate(value)} onChange={(e) => onChange({ [key]: fromIsoDate(e.target.value) })} />
            </div>
          )
        }
        return (
          <div key={key} className="field">
            <label htmlFor={`d-${key}`}>{label}</label>
            <input id={`d-${key}`} value={value} autoComplete="off" onChange={(e) => onChange({ [key]: e.target.value })} />
          </div>
        )
      })}
      {status && <p className="hint" role="status">{status}</p>}
      {kept && (
        <p className="hint hint--warn" role="status">
          Se mantuvo lo que ya había en: {kept.keys.map((k) => DATA_LABEL[k]).join(', ')}, porque es distinto de lo del documento.{' '}
          <button type="button" className="link-btn" onClick={() => { onRelink((shared, autofill) => forceRelink(shared, autofill, ...kept.sources)); setKept(null) }}>
            Reemplazar con los del documento
          </button>
        </p>
      )}
      <p className="hint">Cada dato se propaga a la portada, la identificación, los textos y la emisión. Primero la cotización, luego el levantamiento de ese activo: los datos se cargan de ahí y la cotización manda. Lo que escribiste o corregiste a mano no se pisa.</p>
    </section>
  )
}
