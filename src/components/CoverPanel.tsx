import type { EntregaState } from '../types'
import { PhotoPicker } from './PhotoPicker'

interface Props {
  state: EntregaState
  onChange: (patch: Partial<EntregaState>) => void
}

export function CoverPanel({ state, onChange }: Props) {
  return (
    <section className="box" aria-labelledby="h-cov">
      <h2 id="h-cov">Foto de portada</h2>
      <PhotoPicker label={state.coverPhoto ? 'Cambiar foto del edificio' : 'Subir foto del edificio'} maxDimension={1800} quality={0.82} onPhoto={(coverPhoto) => onChange({ coverPhoto })} />
      <div className="field" style={{ marginTop: 10 }}>
        <label htmlFor="cover-veil">Velo oscuro · {state.coverVeil} %</label>
        <input id="cover-veil" type="range" min={0} max={100} value={state.coverVeil} onChange={(e) => onChange({ coverVeil: Number(e.target.value) })} />
      </div>
      {state.coverPhoto && (
        <button type="button" className="sbtn" onClick={() => onChange({ coverPhoto: undefined })}>Quitar foto</button>
      )}
      <p className="hint">Opcional. Se comprime a 1800 px. Sin foto, la portada usa un fondo de marca.</p>
    </section>
  )
}
