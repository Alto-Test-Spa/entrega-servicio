import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function boot() {
  const root = createRoot(document.getElementById('root')!)
  const fixture = new URLSearchParams(location.search).get('fixture')
  // La condición se resuelve en el build: sin VITE_FIXTURES=1 todo este bloque se elimina.
  if (import.meta.env.VITE_FIXTURES === '1' && fixture) {
    const { default: FixtureApp } = await import('./FixtureApp')
    root.render(<FixtureApp name={fixture} />)
    return
  }
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
void boot()
