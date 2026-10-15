import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { veilBackground } from '../lib/veil'
import { SEVERITY_COLOR } from '../lib/severity'
import { keys } from '../lib/keys'
import { EditableText } from './EditableText'
import { setValue, valueOf, type RenderCtx } from './sections/ctx'
import { Wordmark } from './Wordmark'

const ORDER = ['critical', 'needs_action', 'observation', 'compliant'] as const

export function Cover({ state, def, ctx }: { state: EntregaState; def: ServiceDefinition; ctx: RenderCtx }) {
  const s = state.shared
  const counts = ORDER.map((sev) => ({ sev, n: state.findings.filter((f) => f.severity === sev).length })).filter((c) => c.n > 0)
  const hasPhoto = !!state.coverPhoto
  return (
    <section className="sheet cover" data-sheet="cover">
      <div className="sheet-body cover-body" style={hasPhoto ? { backgroundImage: `url("${state.coverPhoto}")` } : undefined}>
        <div className="cover-veil" style={{ background: hasPhoto ? veilBackground(state.coverVeil) : 'none' }} aria-hidden="true" />
        <div className="cover-fade" aria-hidden="true" />
        <div className="cover-content">
          <div><Wordmark tone="signal" textClassName="text-[16px] text-paper" /></div>
          <div className="cover-spacer" />
          <p className="cover-eyebrow">
            <EditableText value={valueOf(ctx, keys.coverEyebrow, '') || 'Informe de Entrega de Servicio'} onChange={(v) => setValue(ctx, keys.coverEyebrow, v)} placeholder="Informe de Entrega de Servicio" readOnly={ctx.readOnly} />
          </p>
          <h2 className="cover-title">
            <EditableText value={valueOf(ctx, keys.coverTitle, '') || def.title} onChange={(v) => setValue(ctx, keys.coverTitle, v)} placeholder={def.title} readOnly={ctx.readOnly} />
          </h2>
          <p className="cover-sub">{[s.asset, s.address].filter(Boolean).join(' · ') || '—'}</p>
          <p className={`stamp ${state.status === 'issued' ? 'stamp--issued' : ''}`}>{state.status === 'issued' ? 'EMITIDO · REV. 0' : 'BORRADOR'}</p>
          <dl className="facts facts--cover">
            <div><dt>Cliente</dt><dd>{s.client || '—'}</dd></div>
            <div><dt>Activo</dt><dd>{s.asset || '—'}</dd></div>
            <div><dt>Ejecución</dt><dd>{s.executionDate || '—'}</dd></div>
            <div><dt>Folio</dt><dd className="mono">{state.code}</dd></div>
            {s.quoteCode && <div><dt>Cotización</dt><dd className="mono">{s.quoteCode}</dd></div>}
            {s.surveyCode && <div><dt>Levantamiento</dt><dd className="mono">{s.surveyCode}</dd></div>}
            <div><dt>Emitido por</dt><dd><b>{s.issuerName || '—'}</b><br />{s.issuerRole || '—'}</dd></div>
          </dl>
          <div className="band">
            {counts.length ? counts.map((c) => <i key={c.sev} style={{ flex: c.n, background: SEVERITY_COLOR[c.sev] }} />) : <i style={{ flex: 1, background: SEVERITY_COLOR.compliant }} />}
          </div>
          <p className="legend">
            {state.findings.length} hallazgo{state.findings.length === 1 ? '' : 's'} fuera de alcance
          </p>
        </div>
      </div>
    </section>
  )
}
