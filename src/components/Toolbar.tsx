import FilePlus from 'reicon-react/icons/FilePlus'
import Printer from 'reicon-react/icons/Printer'
import type { EntregaState } from '../types'
import type { SyncState } from '../lib/api'
import { Logomark } from './Logomark'
import { HistoryMenu } from './HistoryMenu'
import { SyncStatus } from './SyncStatus'

interface Props {
  state: EntregaState
  serviceLabel: string
  syncState: SyncState
  onNew: () => void
  onLoad: (state: EntregaState) => void
}

export function Toolbar({ state, serviceLabel, syncState, onNew, onLoad }: Props) {
  return (
    <div className="toolbar no-print">
      <span className="toolbar-brand">
        <Logomark tone="signal" width={26} height={11} />
        ALTO&nbsp;TEST
      </span>
      <div className="toolbar-group">
        <span className="eyebrow">{serviceLabel}</span>
        {/* El folio es de solo lectura: cambiarlo dejaría huérfano el documento ya guardado. */}
        <span className="mono">{state.code}</span>
        <span className={`pill ${state.status === 'issued' ? 'pill--ok' : 'pill--warn'}`}>{state.status === 'issued' ? 'Emitido · Rev. 0' : 'Borrador'}</span>
      </div>
      <SyncStatus state={syncState} />
      <div className="toolbar-spacer" />
      <HistoryMenu currentCode={state.code} onOpen={onLoad} />
      <button type="button" className="toolbar-btn toolbar-btn--ghost" onClick={onNew}>
        <FilePlus size={14} strokeWidth={2} className="icon" />
        Nuevo
      </button>
      <button type="button" className="toolbar-btn" onClick={() => window.print()} title="Para el PDF con pie de página usa Chrome o Edge">
        <Printer size={14} strokeWidth={2} className="icon" />
        Imprimir / PDF
      </button>
    </div>
  )
}
