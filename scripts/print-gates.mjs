// Genera el PDF real de cada fixture con Chromium y corre las compuertas de scripts/pdf_gates.py.
import { chromium } from 'playwright'
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const PORT = 4173
const FIXTURES = ['ranco', 'minimal', 'stress', 'glass', 'seals']
const PY = process.env.PY ?? '.venv-gates/bin/python'
mkdirSync('out', { recursive: true })

const server = spawn('npx', ['vite', 'preview', '--outDir', 'dist-test', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const stop = () => server.kill()
process.on('exit', stop)

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`http://localhost:${PORT}/`)).ok) return } catch { /* aún no */ }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('El servidor de preview no arrancó')
}

let failed = false
try {
  await waitForServer()
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
  for (const name of FIXTURES) {
    const page = await browser.newPage({ viewport: { width: 816, height: 1056 } })
    await page.goto(`http://localhost:${PORT}/?fixture=${name}`)
    await page.waitForSelector('.doc')
    await page.emulateMedia({ media: 'print' })

    // Compuerta 1: nada ensancha el documento (si lo hiciera, Chrome encogería todo el PDF).
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    if (scrollWidth > 816) { console.error(`✗ ${name}: scrollWidth ${scrollWidth} > 816 (el PDF se encogería)`); failed = true }

    const manifest = await page.evaluate(() => {
      const text = (el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()
      const sheets = [...document.querySelectorAll('[data-sheet-title]')]
      return {
        titles: sheets.map((s) => s.getAttribute('data-sheet-title')),
        chunks: [...document.querySelectorAll('.sheet .editable, .sheet-title, .sheet td, .sheet dd, .sheet p')].filter((el) => !el.closest('.no-print')).map(text).filter((t) => t.length > 3),
        // Cada fila de tabla y cada hallazgo (cabecera + primera foto) deben quedar enteros en una sola hoja.
        groups: [
          ...[...document.querySelectorAll('.sheet tr[data-row]')].map((tr) => [...tr.querySelectorAll('td')].map(text).filter(Boolean)),
          ...[...document.querySelectorAll('.finding')].map((f) => [text(f.querySelector('.finding-head')), text(f.querySelector('.cap'))].filter(Boolean)),
        ].filter((g) => g.length > 0),
      }
    })
    writeFileSync(`out/${name}.manifest.json`, JSON.stringify(manifest))
    await page.pdf({ path: `out/${name}.pdf`, preferCSSPageSize: true, printBackground: true })
    await page.close()

    const r = spawnSync(PY, ['-I', 'scripts/pdf_gates.py', `out/${name}.pdf`, `out/${name}.manifest.json`, name], { stdio: 'inherit' })
    if (r.status !== 0) failed = true
  }
  await browser.close()
} finally {
  stop()
}
process.exit(failed ? 1 : 0)
