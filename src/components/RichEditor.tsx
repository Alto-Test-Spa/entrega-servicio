import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Editor, EditorContent, useEditor, useEditorState } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import HardBreak from '@tiptap/extension-hard-break'
import { Placeholder, UndoRedo } from '@tiptap/extensions'
import { sanitizeRich } from '../lib/richtext'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

// Un párrafo vacío es una línea en blanco: se guarda como <br> para que sobreviva al HTML mínimo.
const toStorage = (html: string) => sanitizeRich(html.replace(/<p><\/p>/g, '<p><br></p>'))

// Editor de texto con formato (TipTap). Solo existen negrita y listas, así que lo pegado o
// arrastrado se filtra por el esquema. El valor se guarda al perder el foco, y SOLO si cambió:
// pasar el cursor por un informe emitido no debe devolverlo a borrador.
export function RichEditor({ value, onChange, placeholder, readOnly }: Props) {
  const editor = useEditor({
    extensions: [Document, Paragraph, Text, Bold, BulletList, OrderedList, ListItem, HardBreak, UndoRedo, Placeholder.configure({ placeholder: placeholder ?? '' })],
    content: sanitizeRich(value),
    editable: !readOnly,
    immediatelyRender: true,
    editorProps: { attributes: { spellcheck: 'false' } },
    onBlur: ({ editor: ed }) => {
      const next = toStorage(ed.getHTML())
      if (next !== sanitizeRich(value)) onChange(next)
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!readOnly)
  }, [editor, readOnly])

  // Un cambio externo (datos enlazados, cargar otro informe) se refleja si no se está escribiendo.
  useEffect(() => {
    if (!editor || editor.isFocused) return
    const next = sanitizeRich(value)
    if (toStorage(editor.getHTML()) !== next) editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, value])

  const focused = useEditorState({ editor, selector: (s) => !!s.editor?.isFocused })

  return (
    <div className="editable editable--block editable--rich">
      <EditorContent editor={editor} />
      {focused && !readOnly && editor && createPortal(<FormatBar editor={editor} />, document.body)}
    </div>
  )
}

// Barra al pie de la ventana mientras se escribe. Los botones no roban el foco (mousedown cancelado).
function FormatBar({ editor }: { editor: Editor }) {
  const st = useEditorState({
    editor,
    selector: (s) => ({
      bold: s.editor.isActive('bold'), ul: s.editor.isActive('bulletList'), ol: s.editor.isActive('orderedList'),
      undo: s.editor.can().undo(), redo: s.editor.can().redo(),
    }),
  })
  const btn = (title: string, label: React.ReactNode, active: boolean, run: () => void, disabled = false) => (
    <button type="button" title={title} aria-label={title} aria-pressed={active} disabled={disabled} className={active ? 'is-on' : ''}
      onMouseDown={(e) => { e.preventDefault(); run() }}>{label}</button>
  )
  return (
    <div className="format-bar no-print" role="toolbar" aria-label="Formato de texto">
      {btn('Negrita (Ctrl+B)', <b>B</b>, st.bold, () => editor.chain().focus().toggleBold().run())}
      {btn('Lista con viñetas', '• Viñetas', st.ul, () => editor.chain().focus().toggleBulletList().run())}
      {btn('Lista numerada', '1. Numerada', st.ol, () => editor.chain().focus().toggleOrderedList().run())}
      <span className="format-sep" />
      {btn('Deshacer (Ctrl+Z)', '↶', false, () => editor.chain().focus().undo().run(), !st.undo)}
      {btn('Rehacer (Ctrl+Shift+Z)', '↷', false, () => editor.chain().focus().redo().run(), !st.redo)}
      <span className="format-hint">Shift+Enter = salto sin párrafo</span>
    </div>
  )
}
