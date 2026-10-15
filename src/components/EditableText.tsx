import { useLayoutEffect, useRef } from 'react'
import type { ElementType } from 'react'
import { RichEditor } from './RichEditor'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean // texto con formato: negrita, listas y párrafos (RichEditor)
  readOnly?: boolean
  as?: ElementType
}

// Campo editable. Sin `multiline` es texto plano de una línea (`plaintext-only`, Enter no hace nada).
// Con `multiline` es el editor de texto con formato (RichEditor), guardado como HTML mínimo (lib/richtext).
// Guarda al perder el foco, y SOLO si el contenido cambió: pasar el cursor por un campo de un
// informe emitido no debe devolverlo a borrador.
export function EditableText({ value, onChange, placeholder, className, multiline, readOnly, as: Tag = 'span' }: Props) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (el && !multiline && el.textContent !== value) el.textContent = value
  }, [value, multiline])

  if (multiline) return <RichEditor value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} />

  return (
    <Tag
      ref={ref}
      contentEditable={readOnly ? false : 'plaintext-only'}
      suppressContentEditableWarning
      spellCheck={false}
      data-ph={placeholder}
      className={`editable ${className ?? ''}`}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }}
      onBlur={() => {
        const next = (ref.current?.textContent ?? '').trim()
        if (next !== value) onChange(next)
      }}
    />
  )
}
