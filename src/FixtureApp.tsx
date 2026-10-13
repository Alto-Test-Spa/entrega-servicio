import { EntregaDocument } from './components/EntregaDocument'
import { getFixture } from './fixtures'

// Solo se carga en el build de pruebas (VITE_FIXTURES=1): renderiza el documento solo-lectura,
// sin barra, sin paneles y sin hablar con el Worker.
export default function FixtureApp({ name }: { name: string }) {
  const { state, def } = getFixture(name)
  return <EntregaDocument state={state} def={def} readOnly />
}
