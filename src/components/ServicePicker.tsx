import { useState } from 'react'
import { SERVICE_LIST } from '../services'
import { ACCESS_MODE_LABEL } from '../lib/access'
import { ACCESS_MODES, type AccessMode } from '../types'
import { Wordmark } from './Wordmark'

interface Props {
  onStart: (serviceId: string, accessMode: AccessMode) => void
}

// El tipo de servicio y la modalidad de acceso se eligen al inicio y precargan secciones,
// normativa, textos base y campos propios.
export function ServicePicker({ onStart }: Props) {
  const [serviceId, setServiceId] = useState(SERVICE_LIST[0].id)
  const [mode, setMode] = useState<AccessMode>(SERVICE_LIST[0].defaultAccessMode)

  function pick(id: string) {
    setServiceId(id)
    const def = SERVICE_LIST.find((s) => s.id === id)
    if (def) setMode(def.defaultAccessMode)
  }

  return (
    <main className="picker">
      <Wordmark tone="steel" textClassName="text-[17px]" />
      <h1>Nuevo informe de entrega</h1>
      <p className="hint">Elige el servicio y cómo se accedió al trabajo. Esto precarga las secciones y la normativa.</p>
      <div className="seg" role="group" aria-label="Tipo de servicio">
        {SERVICE_LIST.map((s) => (
          <button key={s.id} type="button" className="svc" aria-pressed={s.id === serviceId} onClick={() => pick(s.id)}>
            <b>{s.label}</b>
            <br />
            <span className="mono">{s.codePrefix}</span>
          </button>
        ))}
      </div>
      <div className="seg" role="group" aria-label="Modalidad de acceso">
        {ACCESS_MODES.map((m) => (
          <button key={m} type="button" aria-pressed={m === mode} onClick={() => setMode(m)}>{ACCESS_MODE_LABEL[m]}</button>
        ))}
      </div>
      <button type="button" className="toolbar-btn" onClick={() => onStart(serviceId, mode)}>Crear informe</button>
    </main>
  )
}
