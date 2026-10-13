import { MAX_PHOTOS, canAddServicePhoto, newPhoto } from '../../lib/photos'
import { PhotoGrid } from '../PhotoGrid'
import { PhotoPicker } from '../PhotoPicker'
import type { RenderCtx } from './ctx'

export function PhotosSection({ ctx }: { ctx: RenderCtx }) {
  const { state, readOnly, update } = ctx
  const full = !canAddServicePhoto(state.photos)
  return (
    <>
      <div className="cap-row no-print">
        <span className="cnt">{state.photos.length} / {MAX_PHOTOS} fotos · máximo</span>
        {!readOnly && <PhotoPicker label="+ Agregar foto" disabled={full} onPhoto={(d) => update((s) => (canAddServicePhoto(s.photos) ? { ...s, photos: [...s.photos, newPhoto(d)] } : s))} />}
      </div>
      <PhotoGrid
        photos={state.photos}
        readOnly={readOnly}
        onCaption={(id, caption) => update((s) => ({ ...s, photos: s.photos.map((p) => (p.id === id ? { ...p, caption } : p)) }))}
        onRemove={(id) => update((s) => ({ ...s, photos: s.photos.filter((p) => p.id !== id) }))}
      />
    </>
  )
}
