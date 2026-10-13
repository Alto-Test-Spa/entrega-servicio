import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { veilBackground } from '../lib/veil'
import { SEVERITY_COLOR } from '../lib/severity'
import { Wordmark } from './Wordmark'

const ORDER = ['critical', 'needs_action', 'observation', 'compliant'] as const

export function Cover({ state, def }: { state: EntregaState; def: ServiceDefinition }) {
  const s = state.shared
  const counts = ORDER.map((sev) => ({ sev, n: state.findings.filter((f) => f.severity === sev).length })).filter((c) => c.n > 0)
  const opp = state.findings.filter((f) => f.commercialOpportunity).length
  const hasPhoto = !!state.coverPhoto
  return (
    <section className="sheet cover" data-sheet="cover">
      <div className="sheet-body cover-body" style={hasPhoto ? { backgroundImage: `url("${state.coverPhoto}")` } : undefined}>
        <div className="cover-veil" style={{ background: hasPhoto ? veilBackground(state.coverVeil) : 'none' }} aria-hidden="true" />
        <div className="cover-fade" aria-hidden="true" />
        <div className="cover-content">
          <Wordmark tone="signal" textClassName="text-[16px] text-paper" />
          <div className="cover-spacer" />
          <p className="cover-eyebrow">Informe de Entrega de Servicio</p>
          <h2 className="cover-title">{def.title}</h2>
          <p className="cover-sub">{[s.asset, s.address].filter(Boolean).join(' · ') || '—'}</p>
          <p className={`stamp ${state.status === 'issued' ? 'stamp--issued' : ''}`}>{state.status === 'issued' ? 'EMITIDO · REV. 0' : 'BORRADOR'}</p>
          <dl className="facts facts--cover">
            <div><dt>Cliente</dt><dd>{s.client || '—'}</dd></div>
            <div><dt>Activo</dt><dd>{s.asset || '—'}</dd></div>
            <div><dt>Ejecución</dt><dd>{s.executionDate || '—'}</dd></div>
            <div><dt>Folio</dt><dd className="mono">{state.code}</dd></div>
          </dl>
          <div className="band">
            {counts.length ? counts.map((c) => <i key={c.sev} style={{ flex: c.n, background: SEVERITY_COLOR[c.sev] }} />) : <i style={{ flex: 1, background: SEVERITY_COLOR.compliant }} />}
          </div>
          <p className="legend">
            {state.findings.length} hallazgo{state.findings.length === 1 ? '' : 's'} fuera de alcance · {opp} oportunidad{opp === 1 ? '' : 'es'} comercial{opp === 1 ? '' : 'es'}
          </p>
        </div>
      </div>
    </section>
  )
}
