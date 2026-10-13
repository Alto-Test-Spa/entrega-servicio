import type { SectionDef } from '../../services/types'
import { keys } from '../../lib/keys'
import { EditableText } from '../EditableText'
import { PhotoPicker } from '../PhotoPicker'
import { setValue, valueOf, type RenderCtx } from './ctx'

type LayoutDef = Extract<SectionDef, { kind: 'layout' }>

export function LayoutSection({ section, ctx }: { section: LayoutDef; ctx: RenderCtx }) {
  const { state, readOnly, update } = ctx
  return (
    <>
      {state.layoutImage ? (
        <figure className="layout-figure">
          <img className="layout-img" src={state.layoutImage} alt="Plano de ubicación de los puntos" />
          {!readOnly && (
            <button type="button" className="sbtn no-print" onClick={() => update((s) => ({ ...s, layoutImage: undefined }))}>Quitar plano</button>
          )}
        </figure>
      ) : (
        <div className="dropzone">
          <span className="chip chip--signal">Falta el plano</span>
          <p className="no-print">{section.instruction}</p>
          {!readOnly && <PhotoPicker label="Cargar plano" onPhoto={(dataUrl) => update((s) => ({ ...s, layoutImage: dataUrl }))} />}
        </div>
      )}
      <p className="legend-text">
        <EditableText
          value={valueOf(ctx, keys.legend(section.id), section.legend)}
          onChange={(v) => setValue(ctx, keys.legend(section.id), v)}
          multiline
          readOnly={readOnly}
        />
      </p>
    </>
  )
}
