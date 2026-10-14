import type { PhotoItem } from '../types'
import { EditableText } from './EditableText'

interface Props {
  photos: PhotoItem[]
  onCaption: (id: string, caption: string) => void
  onRemove: (id: string) => void
  readOnly?: boolean
}

// Rejilla de fotos grandes (2 columnas, 4:3): la misma para el registro fotográfico y para los
// hallazgos, porque la foto es la evidencia y es lo que hace vendible el informe.
export function PhotoGrid({ photos, onCaption, onRemove, readOnly }: Props) {
  return (
    <div className="photos">
      {photos.map((p, i) => (
        <figure key={p.id} className="photo">
          <div className="photo-frame">
            <img src={p.dataUrl} alt={p.caption || `Foto ${i + 1}`} />
            {!readOnly && (
              <button type="button" className="photo-remove no-print" title="Quitar foto" onClick={() => onRemove(p.id)}>×</button>
            )}
          </div>
          <figcaption className="cap">
            <EditableText value={p.caption} onChange={(v) => onCaption(p.id, v)} placeholder="Descripción de la foto" multiline readOnly={readOnly} />
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
