import { useLayoutEffect, useRef } from 'react'
import type { ElementType } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean // Enter inserta un salto de línea; si no, Enter no hace nada
  readOnly?: boolean
  as?: ElementType
}

// Campo de texto plano editable. `plaintext-only` evita el HTML pegado y hace que Enter inserte
// "\n" (se imprime con white-space: pre-wrap). Guarda al perder el foco, y SOLO si el texto cambió:
// pasar el cursor por un campo de un informe emitido no debe devolverlo a borrador.
export function EditableText({ value, onChange, placeholder, className, multiline, readOnly, as: Tag = 'span' }: Props) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (el && el.textContent !== value) el.textContent = value
  }, [value])

  return (
    <Tag
      ref={ref}
      contentEditable={readOnly ? false : 'plaintext-only'}
      suppressContentEditableWarning
      spellCheck={false}
      data-ph={placeholder}
      className={`editable ${multiline ? 'editable--block' : ''} ${className ?? ''}`}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === 'Enter') e.preventDefault()
      }}
      onBlur={() => {
        const next = (ref.current?.textContent ?? '').trim()
        if (next !== value) onChange(next)
      }}
    />
  )
}
