import { useState } from 'react'
import { EntregaDocument } from './components/EntregaDocument'
import { getFixture } from './fixtures'

// Solo se carga en el build de pruebas (VITE_FIXTURES=1): renderiza el documento sin barra, sin
// paneles y sin hablar con el Worker. Solo-lectura, salvo con `&edit=1` (pruebas del editor).
export default function FixtureApp({ name }: { name: string }) {
  const { state: initial, def } = getFixture(name)
  const [state, setState] = useState(initial)
  const editable = new URLSearchParams(location.search).get('edit') === '1'
  return <EntregaDocument state={state} def={def} readOnly={!editable} update={editable ? (fn) => setState(fn) : undefined} />
}
