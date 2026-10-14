import { useState } from 'react'
import type { Issue } from '../lib/validate'
import { hasBlocks } from '../lib/validate'

interface Props {
  issues: Issue[]
  issued: boolean
  onIssue: () => void
}

export function IssuesPanel({ issues, issued, onIssue }: Props) {
  const [open, setOpen] = useState(false)
  const blocks = issues.filter((i) => i.level === 'block')
  const warns = issues.filter((i) => i.level === 'warn')
  const blocked = hasBlocks(issues)

  function goTo(sectionId?: string) {
    if (sectionId) document.querySelector(`[data-sheet="${sectionId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="gate no-print">
      <div className="gate-row">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="eyebrow">Antes de emitir</span>
          <span className={`pill ${blocks.length ? 'pill--bad' : 'pill--ok'}`}>{blocks.length} bloqueo{blocks.length === 1 ? '' : 's'}</span>
          <span className={`pill ${warns.length ? 'pill--warn' : 'pill--ok'}`}>{warns.length} aviso{warns.length === 1 ? '' : 's'}</span>
          {issued && <span className="pill pill--ok">Emitido · Rev. 0</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="toolbar-btn toolbar-btn--ghost" onClick={() => setOpen((v) => !v)}>{open ? 'Ocultar detalle' : 'Ver detalle'}</button>
          <button type="button" className="toolbar-btn" disabled={blocked || issued} onClick={onIssue}>{issued ? 'Emitido' : 'Marcar como emitido'}</button>
        </div>
      </div>
      {open && (
        <ul className="issues">
          {issues.length === 0 && <li>Todo en orden. El informe se puede emitir.</li>}
          {issues.map((i, k) => (
            <li key={k}>
              <span className={`tag tag--${i.level === 'block' ? 'bad' : 'warn'}`}>{i.level === 'block' ? 'Bloquea' : 'Aviso'}</span>
              <a onClick={() => goTo(i.sectionId)}>{i.message}</a>
            </li>
          ))}
        </ul>
      )}
      <p className="hint" style={{ margin: '8px 0 0' }}>
        {blocked ? 'Es un borrador: puedes seguir redactando e imprimir el PDF (sale con sello BORRADOR). El sello EMITIDO solo se puede poner cuando no queden bloqueos.' : issued ? 'Informe emitido: el PDF sale con el sello EMITIDO · REV. 0. Si editas algo, vuelve a borrador.' : 'Sin bloqueos: puedes marcarlo como emitido para que el PDF lleve el sello EMITIDO · REV. 0 (imprimir sirve en cualquier momento).'}
      </p>
    </div>
  )
}
