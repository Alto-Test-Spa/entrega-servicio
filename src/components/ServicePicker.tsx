import { useState } from 'react'
import { SERVICE_LIST } from '../services'
import type { EntregaState } from '../types'
import { HistoryMenu } from './HistoryMenu'
import { Wordmark } from './Wordmark'

interface Props {
  onStart: (serviceId: string) => void
  onLoad: (report: EntregaState) => void // abrir un informe ya guardado, sin crear uno nuevo
}

// El tipo de servicio se elige al inicio y precarga las secciones, los textos base y los campos
// propios.
export function ServicePicker({ onStart, onLoad }: Props) {
  const [serviceId, setServiceId] = useState(SERVICE_LIST[0].id)

  return (
    <main className="picker">
      <div><Wordmark tone="steel" textClassName="text-[17px]" /></div>
      <h1>Nuevo informe de entrega</h1>
      <p className="hint">Elige el servicio. Esto precarga las secciones y los textos base.</p>
      <div className="seg" role="group" aria-label="Tipo de servicio">
        {SERVICE_LIST.map((s) => (
          <button key={s.id} type="button" className="svc" aria-pressed={s.id === serviceId} onClick={() => setServiceId(s.id)}>
            <b>{s.label}</b>
            <br />
            <span className="mono">{s.codePrefix}</span>
          </button>
        ))}
      </div>
      <div className="picker-actions">
        <button type="button" className="toolbar-btn" onClick={() => onStart(serviceId)}>Crear informe</button>
        <span className="hint">o</span>
        <HistoryMenu currentCode="" onOpen={onLoad} />
      </div>
    </main>
  )
}
