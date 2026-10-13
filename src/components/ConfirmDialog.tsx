interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="dialog-backdrop no-print" role="presentation" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <p className="dialog-title">{title}</p>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="toolbar-btn toolbar-btn--ghost" onClick={onCancel}>Cancelar</button>
          <button type="button" className="toolbar-btn" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
