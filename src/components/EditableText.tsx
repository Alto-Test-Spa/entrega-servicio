import { useLayoutEffect, useRef, useState } from 'react'
import type { ElementType } from 'react'
import { createPortal } from 'react-dom'
import { sanitizeRich } from '../lib/richtext'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean // texto con formato: negrita, listas y saltos de línea
  readOnly?: boolean
  as?: ElementType
}

// Campo editable. Sin `multiline` es texto plano de una línea (`plaintext-only`, Enter no hace nada).
// Con `multiline` admite negrita, listas y saltos de línea, guardados como HTML mínimo (lib/richtext).
// Guarda al perder el foco, y SOLO si el contenido cambió: pasar el cursor por un campo de un
// informe emitido no debe devolverlo a borrador.
export function EditableText({ value, onChange, placeholder, className, multiline, readOnly, as: Tag = 'span' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [focused, setFocused] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (multiline) {
      const html = sanitizeRich(value)
      if (el.innerHTML !== html) el.innerHTML = html
    } else if (el.textContent !== value) el.textContent = value
  }, [value, multiline])

  const inList = () => {
    const node = window.getSelection()?.anchorNode
    const el = node instanceof Element ? node : node?.parentElement
    return !!el?.closest('li')
  }

  return (
    <>
      <Tag
        ref={ref}
        contentEditable={readOnly ? false : multiline ? true : 'plaintext-only'}
        suppressContentEditableWarning
        spellCheck={false}
        data-ph={placeholder}
        className={`editable ${multiline ? 'editable--block editable--rich' : ''} ${className ?? ''}`}
        onFocus={() => setFocused(true)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (!multiline) {
            if (e.key === 'Enter') e.preventDefault()
            return
          }
          // Enter hace un salto simple (no párrafos); dentro de una lista, el ítem siguiente.
          if (e.key === 'Enter' && !e.shiftKey && !inList()) {
            e.preventDefault()
            document.execCommand('insertLineBreak')
          }
          // Cursiva y subrayado no existen en el documento.
          if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'u')) e.preventDefault()
        }}
        onPaste={(e: React.ClipboardEvent) => {
          if (!multiline) return
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
        onDrop={(e: React.DragEvent) => { if (multiline) e.preventDefault() }}
        onBlur={() => {
          setFocused(false)
          const el = ref.current
          if (!el) return
          if (multiline) {
            const next = sanitizeRich(el.innerHTML)
            if (next !== sanitizeRich(value)) onChange(next)
          } else {
            const next = (el.textContent ?? '').trim()
            if (next !== value) onChange(next)
          }
        }}
      />
      {focused && multiline && !readOnly && createPortal(<FormatBar />, document.body)}
    </>
  )
}

// Barra fija al pie de la ventana mientras hay un campo con formato en edición. Los botones no
// roban el foco (mousedown cancelado), así que la selección sigue en el texto.
function FormatBar() {
  const run = (cmd: string) => (e: React.MouseEvent) => { e.preventDefault(); document.execCommand(cmd) }
  return (
    <div className="format-bar no-print" role="toolbar" aria-label="Formato de texto">
      <button type="button" title="Negrita (Ctrl+B)" onMouseDown={run('bold')}><b>B</b></button>
      <button type="button" title="Lista con viñetas" onMouseDown={run('insertUnorderedList')}>• Lista</button>
      <button type="button" title="Lista numerada" onMouseDown={run('insertOrderedList')}>1. Lista</button>
      <span className="format-hint">Enter = salto de línea</span>
    </div>
  )
}
