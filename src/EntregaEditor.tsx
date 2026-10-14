import { useEffect, useMemo, useState } from 'react'
import { useEntregaStore } from './lib/store'
import { getService } from './services'
import { validate } from './lib/validate'
import { issueReport } from './lib/issuance'
import { toggleSection } from './lib/sections'
import { ServicePicker } from './components/ServicePicker'
import { Toolbar } from './components/Toolbar'
import { SidePanel } from './components/SidePanel'
import { DataPanel } from './components/DataPanel'
import { SectionsPanel } from './components/SectionsPanel'
import { CoverPanel } from './components/CoverPanel'
import { IssuesPanel } from './components/IssuesPanel'
import { ConfirmDialog } from './components/ConfirmDialog'
import { EntregaDocument } from './components/EntregaDocument'

export default function EntregaEditor({ onAuthExpired }: { onAuthExpired: () => void }) {
  const { state, update, startReport, loadReport, reset, syncState, booting } = useEntregaStore(onAuthExpired)
  const [confirmNew, setConfirmNew] = useState(false)
  const serviceId = state?.serviceId
  const def = useMemo(() => (serviceId ? getService(serviceId) : null), [serviceId])
  const issues = useMemo(() => (state && def ? validate(state, def) : []), [state, def])
  const code = state?.code

  // Durante la impresión el título pasa a ser el folio: Chrome lo usa como nombre del PDF.
  useEffect(() => {
    if (!code) return
    const base = document.title
    const before = () => { document.title = code }
    const after = () => { document.title = base }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [code])

  if (booting) return <div className="boot-screen">Cargando…</div>
  if (!state || !def) return <ServicePicker onStart={(id) => startReport(id)} />

  return (
    <>
      <Toolbar state={state} serviceLabel={def.label} syncState={syncState} onNew={() => setConfirmNew(true)} onLoad={loadReport} />
      <div className="editor-layout">
        <SidePanel>
          <DataPanel
            state={state}
            onChange={(patch) => update((s) => ({ ...s, shared: { ...s.shared, ...patch } }))}
            onRelink={(fn) => update((s) => { const r = fn(s.shared, s.linkedFill ?? {}); return { ...s, shared: r.shared, linkedFill: r.autofill } })}
          />
          <CoverPanel state={state} onChange={(patch) => update((s) => ({ ...s, ...patch }))} />
          <SectionsPanel def={def} hidden={state.hiddenSections} onToggle={(id) => update((s) => ({ ...s, hiddenSections: toggleSection(s.hiddenSections, def, id) }))} />
        </SidePanel>
        <main>
          <IssuesPanel issues={issues} issued={state.status === 'issued'} onIssue={() => update((s) => issueReport(s, validate(s, def)))} />
          <EntregaDocument state={state} def={def} update={update} />
        </main>
      </div>
      <ConfirmDialog
        open={confirmNew}
        title="Crear un informe nuevo"
        message="El informe actual queda guardado en el Historial. ¿Empezar uno nuevo?"
        confirmLabel="Crear nuevo"
        onConfirm={() => { setConfirmNew(false); reset() }}
        onCancel={() => setConfirmNew(false)}
      />
    </>
  )
}
