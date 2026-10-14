import { generateId } from '../../lib/code'
import { MAX_PHOTOS, canAddFindingPhoto, countFindingPhotos, newPhoto } from '../../lib/photos'
import { SEVERITY_COLOR } from '../../lib/severity'
import { SEVERITY_LEVELS, type Finding } from '../../types'
import { EditableText } from '../EditableText'
import { PhotoGrid } from '../PhotoGrid'
import { PhotoPicker } from '../PhotoPicker'
import type { RenderCtx } from './ctx'

const blankFinding = (): Finding => ({
  id: generateId(), location: '', description: '', photos: [], severity: 'observation',
  immediateRisk: false, recommendation: '', commercialOpportunity: false,
})

export function FindingsSection({ ctx }: { ctx: RenderCtx }) {
  const { state, readOnly, update } = ctx
  const F = state.findings
  const total = countFindingPhotos(F)
  const risk = F.filter((f) => f.immediateRisk).length

  const patch = (id: string, p: Partial<Finding>) =>
    update((s) => ({ ...s, findings: s.findings.map((f) => (f.id === id ? { ...f, ...p } : f)) }))

  return (
    <>
      <p>Condiciones detectadas en terreno que no formaban parte del trabajo contratado. Se informan para conocimiento del cliente.</p>
      <div className="sum">
        <span><b>{F.length}</b> hallazgo{F.length === 1 ? '' : 's'}</span>
        <span><b>{risk}</b> con riesgo inmediato</span>
        <span className="no-print"><b>{total} / {MAX_PHOTOS}</b> fotos · máximo en esta sección</span>
      </div>

      {F.map((f, i) => (
        <article key={f.id} className="finding" style={{ borderLeftColor: SEVERITY_COLOR[f.severity] }}>
          <div className="finding-head">
            <div className="tags">
              <span className="sevb" style={{ background: SEVERITY_COLOR[f.severity] }}>{SEVERITY_LEVELS.find((l) => l.value === f.severity)?.label}</span>
              {f.immediateRisk && <span className="chip chip--signal">Riesgo inmediato</span>}
            </div>
            {!readOnly && (
              <div className="finding-controls no-print">
                <select aria-label={`Severidad del hallazgo ${i + 1}`} value={f.severity} onChange={(e) => patch(f.id, { severity: e.target.value as Finding['severity'] })}>
                  {SEVERITY_LEVELS.map((l) => (<option key={l.value} value={l.value}>{l.label}</option>))}
                </select>
                <label><input type="checkbox" checked={f.immediateRisk} onChange={(e) => patch(f.id, { immediateRisk: e.target.checked })} /> Riesgo inmediato</label>
                <label><input type="checkbox" checked={f.commercialOpportunity} onChange={(e) => patch(f.id, { commercialOpportunity: e.target.checked })} /> Oportunidad comercial (solo interno, no sale en el PDF)</label>
                <button type="button" className="sbtn" onClick={() => update((s) => ({ ...s, findings: s.findings.filter((x) => x.id !== f.id) }))}>Quitar hallazgo</button>
              </div>
            )}
            <dl className="finding-text">
              <div><dt>Ubicación</dt><dd><EditableText value={f.location} onChange={(v) => patch(f.id, { location: v })} placeholder="Dónde se detectó" readOnly={readOnly} /></dd></div>
              <div><dt>Descripción</dt><dd><EditableText value={f.description} onChange={(v) => patch(f.id, { description: v })} placeholder="Qué se vio" multiline readOnly={readOnly} /></dd></div>
              <div><dt>Recomendación</dt><dd><EditableText value={f.recommendation} onChange={(v) => patch(f.id, { recommendation: v })} placeholder="Qué se recomienda hacer" multiline readOnly={readOnly} /></dd></div>
            </dl>
          </div>
          {!readOnly && (
            <div className="cap-row no-print">
              <span className="cnt">{f.photos.length} foto{f.photos.length === 1 ? '' : 's'} de este hallazgo</span>
              <PhotoPicker label="+ Foto" disabled={!canAddFindingPhoto(F)} onPhoto={(d) => update((s) => (canAddFindingPhoto(s.findings) ? { ...s, findings: s.findings.map((x) => (x.id === f.id ? { ...x, photos: [...x.photos, newPhoto(d)] } : x)) } : s))} />
            </div>
          )}
          <PhotoGrid
            photos={f.photos}
            readOnly={readOnly}
            onCaption={(pid, caption) => patch(f.id, { photos: f.photos.map((p) => (p.id === pid ? { ...p, caption } : p)) })}
            onRemove={(pid) => patch(f.id, { photos: f.photos.filter((p) => p.id !== pid) })}
          />
        </article>
      ))}

      {!readOnly && (
        <button type="button" className="sbtn no-print" onClick={() => update((s) => ({ ...s, findings: [...s.findings, blankFinding()] }))}>
          + Agregar hallazgo
        </button>
      )}
      {F.length === 0 && <p className="hint">Sin hallazgos fuera de alcance. Si no se detectó nada, puedes ocultar esta sección.</p>}
    </>
  )
}
