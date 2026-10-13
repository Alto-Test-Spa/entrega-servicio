# Informe de Entrega de Servicio — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la app `entrega_servicio_react`: una plantilla única de informe de entrega de servicio donde cada servicio (anclajes, limpieza de vidrios, reposición de sellos) es una definición de datos, con secciones ocultables, datos únicos, hallazgos fuera de alcance, validación antes de emitir y PDF Carta vertical.

**Architecture:** App Vite + React 19 + TS + Tailwind v4 igual a sus hermanas de `informes/` y `venta/`, con el Worker compartido `altotest-documentos` (`kind="entrega"`) como fuente de verdad. El contenido sale de `ServiceDefinition` (datos) y de `EntregaState` (lo que escribe la persona). Un conjunto fijo de renderizadores genéricos dibuja cada tipo de sección. La paginación es **nativa del navegador** (`@page` con cajas de margen), sin medir en JS.

**Tech Stack:** Vite 8, React 19, TypeScript, Tailwind v4 (`@tailwindcss/vite`), `reicon-react`, `oxlint`, Vitest (lógica pura), Playwright + `pypdf`/`pypdfium2` (compuertas de PDF).

**Spec:** `docs/superpowers/specs/2026-10-13-entrega-servicio-design.md` (maqueta aprobada: https://claude.ai/artifact/G7KfCvHLTsqkr5DqBWCuci)

## Global Constraints

- Directorio del proyecto: `/home/meraki/altotest/informes/entrega_servicio_react` (repo git propio, rama `main`). Todas las rutas del plan son relativas a él, salvo que se indique otra cosa.
- Código en inglés, comentarios en español, contenido del documento en español. No mezclar los tres registros.
- Puerto de desarrollo fijo **5213**. `kind = "entrega"`. Folio `EN-aaaammdd-hhmmss`. **No se modifica el Worker.**
- Documento **Carta vertical** (8,5 × 11 in). Cada sección empieza en hoja nueva. Pie `ALTO TEST · folio` y `Página n de N` en cajas de margen de `@page`. La portada sale a sangre y sin pie.
- **Máximo 6 fotos en total** en el registro fotográfico y **máximo 6 en total** entre todos los hallazgos. La foto de portada no cuenta.
- Las vigencias son **texto**; una vigencia vencida **avisa y nunca bloquea**.
- La sección final se llama **Emisión** y muestra **una sola persona**, sin firma y sin tabla de revisiones. Siempre `Rev. 0`.
- Editar un informe emitido lo devuelve a **borrador**.
- Autoguardado: debounce `3000` ms, guard de no-op, flush en `visibilitychange → hidden`, no guarda hasta la primera edición real.
- Un texto base **nunca afirma un resultado** (por ejemplo "conforme"): los resultados los escribe quien ejecutó.
- Las reglas de impresión van **fuera de `@layer`**. Todo texto editable lleva la clase `.editable` (`overflow-wrap: anywhere`). Tablas con `table-layout: fixed`.
- Logo: el `Wordmark`/`Logomark` de `informes/informe_levantamiento` (placa y perno en los extremos), copiado tal cual.
- Commits terminan con el trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (segundo `-m`).
- No hacer `git push`, crear repos en GitHub ni tocar Vercel sin confirmación explícita de Matías.

## Review Focus

Entradas que el spec no nombra y que más probablemente le fallen a quien use la app, de más a menos probable:

1. **Una cadena larga sin espacios** (una URL de 300 caracteres) escrita en cualquier campo no debe encoger el PDF. Esperado: sigue Carta a escala 100 % y la cadena se parte. Test: Tarea 10 (fixture `stress`).
2. **Foto ilegible o formato no soportado** (HEIC, archivo corrupto, 0 bytes). Esperado: mensaje claro y el informe queda intacto. Test: Tarea 7 (`imageErrorMessage`).
3. **Ocultar todas las secciones ocultables.** Esperado: queda un documento mínimo válido (portada, índice, identificación y emisión) con numeración correcta. Test: Tarea 3 y fixture `minimal` de la Tarea 10.
4. **Fecha de ejecución escrita a mano en otro formato** (`17-09-2026`, `17/9/2026`). Esperado: bloquea con mensaje claro y no rompe el aviso de vigencias. Test: Tarea 5.
5. **Informe con fotos pesadas que supera los 25 MB por valor de KV.** Esperado: el guardado se rechaza antes de enviar, con aviso visible. Test: Tarea 6 (`assertWithinSizeLimit`).

---

## Estructura de archivos

```
package.json, vite.config.ts, tsconfig*.json, index.html, .env.example, .gitignore, CLAUDE.md
public/favicon.svg
scripts/print-gates.mjs, scripts/pdf_gates.py
src/
  main.tsx, App.tsx, EntregaEditor.tsx, FixtureApp.tsx, index.css, vite-env.d.ts
  types.ts                         estado del documento
  services/
    types.ts                       ServiceDefinition, SectionDef, etc.
    common.ts                      fábricas de secciones comunes + emisor por defecto
    normative.ts                   normativa general / altura / por modalidad
    anchors.ts, glass.ts, seals.ts una definición por servicio
    index.ts                       registro SERVICES, SERVICE_LIST, getService
  lib/
    code.ts, date.ts, image.ts, photos.ts, veil.ts, severity.ts
    access.ts                      etiquetas y equipo por modalidad
    interpolate.ts                 {{variables}} → datos únicos
    keys.ts                        claves de celdas (values)
    sections.ts                    secciones activas + numeración (única fuente de números)
    template.ts                    initialState, normalizeState
    fields.ts                      collectFields (todo lo editable de las secciones visibles)
    validate.ts                    validate(): bloqueos y avisos
    issuance.ts                    applyEdit, issueReport
    links.ts                       adaptadores levantamiento/cotización → datos únicos
    api.ts, store.ts               nube (copiado y adaptado de informe_levantamiento)
  components/
    AccessGate, SyncStatus, Logomark, Wordmark   (copiados)
    EditableText, PhotoPicker, PhotoGrid, ConfirmDialog
    Toolbar, HistoryMenu, ServicePicker, SidePanel, DataPanel, SectionsPanel, CoverPanel, IssuesPanel
    Cover, TableOfContents, SectionSheet, PrintStyles, EntregaDocument
    sections/ ctx.ts, index.tsx, IdentificationSection, NormativeSection, TableSection,
              FactsSection, LayoutSection, PhotosSection, AnnexesSection, FindingsSection, IssuanceSection
  fixtures/index.ts                datos de prueba para las compuertas de PDF
```

---

### Task 1: Andamiaje del proyecto

**Files:**
- Create: `package.json`, `vite.config.ts`, `index.html`, `.env.example`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/index.css`, `public/favicon.svg`
- Copy: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `.oxlintrc.json`

**Interfaces:**
- Produces: `npm run dev|build|lint|test`, tokens de marca en `src/index.css` (`--color-paper`, `--color-ink`, `--color-steel`, `--color-signal`…), clases de barra de herramientas, historial, sync y portón de acceso.

- [ ] **Step 1: Inicializar repo y copiar configuración de la familia**

```bash
cd /home/meraki/altotest/informes/entrega_servicio_react
git init -b main
SRC=../informe_levantamiento
cp $SRC/tsconfig.json $SRC/tsconfig.app.json $SRC/tsconfig.node.json $SRC/.oxlintrc.json $SRC/.gitignore .
mkdir -p public scripts src/components/sections src/lib src/services src/fixtures
cp $SRC/public/favicon.svg public/favicon.svg
cp $SRC/index.html index.html
sed -i 's#<title>.*</title>#<title>ALTO TEST — Informe de Entrega de Servicio</title>#' index.html
printf '.venv-gates\ndist-test\nout\n' >> .gitignore
printf 'VITE_REPORTS_ENDPOINT=https://altotest-documentos.altotest.workers.dev\n' > .env.example
cp .env.example .env
```

- [ ] **Step 2: Crear `package.json`**

```json
{
  "name": "entrega-servicio",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:test": "VITE_FIXTURES=1 tsc -b && VITE_FIXTURES=1 vite build --outDir dist-test --emptyOutDir",
    "test": "vitest run",
    "test:pdf": "npm run build:test && node scripts/print-gates.mjs",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "reicon-react": "^1.2.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.4",
    "oxlint": "^1.75.0",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.2",
    "vite": "^8.2.0"
  }
}
```

- [ ] **Step 3: Instalar dependencias y las herramientas de prueba**

Run: `npm install && npm install -D vitest playwright`
Expected: instala sin errores. Si `npm` informa `ERESOLVE` por el `peerDependencies` de Vitest con Vite 8, ejecuta `npm view vitest peerDependencies` e instala la versión de Vitest cuyo rango incluya Vite 8, sin usar `--force`.
Luego: `npx playwright install chromium` (descarga ~115 MB).

- [ ] **Step 4: `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5213 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```

- [ ] **Step 5: Archivos mínimos de `src`**

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx` (se reemplaza en la Tarea 6):
```tsx
export default function App() {
  return <div className="boot-screen">Entrega de servicio</div>
}
```

- [ ] **Step 6: CSS base copiando la barra, historial, sync y portón de la familia**

Las líneas 1–342 de `informe_levantamiento/src/index.css` contienen `@theme`, `@layer base`, la apertura de `@layer components` con `.icon`, `.eyebrow`, barra de herramientas, historial, estado de sincronización, portón de acceso y `.boot-screen`. Quedan con `@layer components` **abierto**; se cierra en la Tarea 8.

```bash
sed -n 1,342p ../informe_levantamiento/src/index.css > src/index.css
printf '\n  /* (se completa en la Tarea 8) */\n}\n' >> src/index.css
```

- [ ] **Step 7: Verificar que compila y que los tests corren vacíos**

Run: `npm run build && npx vitest run --passWithNoTests && npm run lint`
Expected: `build` termina en `✓ built`; vitest sin tests pasa; `oxlint` sin errores.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: andamiaje Vite+React+TS+Tailwind con tokens de marca" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Tipos y utilidades básicas

**Files:**
- Create: `src/types.ts`, `src/lib/code.ts`, `src/lib/date.ts`, `src/lib/image.ts`, `src/lib/photos.ts`, `src/lib/severity.ts`
- Test: `src/lib/code.test.ts`, `src/lib/date.test.ts`, `src/lib/photos.test.ts`
- Modify: `docs/superpowers/specs/2026-10-13-entrega-servicio-design.md` (deltas del spec)

**Interfaces:**
- Produces:
  - `types.ts`: `AccessMode`, `ACCESS_MODES`, `Severity`, `SEVERITY_LEVELS`, `PhotoItem`, `Finding`, `SharedData`, `DocStatus`, `EntregaState`.
  - `code.ts`: `generateCode(now?: Date): string`, `isValidCode(code: string): boolean`, `generateId(): string`.
  - `date.ts`: `todayDate(now?: Date): string`, `formatDateInput(v: string): string`, `isValidDate(v: string): boolean`, `parseLooseDate(text: string): Date | null`.
  - `image.ts`: `compressImage(file: File, maxDimension?: number, quality?: number): Promise<string>`, `imageErrorMessage(err: unknown): string`.
  - `photos.ts`: `MAX_PHOTOS`, `countFindingPhotos(f: Finding[]): number`, `canAddServicePhoto(p: PhotoItem[]): boolean`, `canAddFindingPhoto(f: Finding[]): boolean`, `newPhoto(dataUrl: string): PhotoItem`.
  - `severity.ts`: `SEVERITY_COLOR: Record<Severity, string>`.

- [ ] **Step 1: `src/types.ts`**

```ts
export type AccessMode = 'ground' | 'suspended_platform' | 'rope'
export const ACCESS_MODES: AccessMode[] = ['ground', 'suspended_platform', 'rope']

export type Severity = 'critical' | 'needs_action' | 'observation' | 'compliant'
export const SEVERITY_LEVELS: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Crítico' },
  { value: 'needs_action', label: 'Requiere intervención' },
  { value: 'observation', label: 'Observación' },
  { value: 'compliant', label: 'Conforme' },
]

export interface PhotoItem {
  id: string
  dataUrl: string
  caption: string
}

export interface Finding {
  id: string
  location: string
  description: string
  photos: PhotoItem[]
  severity: Severity
  immediateRisk: boolean
  recommendation: string
  commercialOpportunity: boolean
}

// Datos únicos: se ingresan una vez y se propagan a todo el informe.
export interface SharedData {
  client: string
  asset: string
  address: string
  contact: string
  executionDate: string // dd/mm/aaaa
  quoteCode: string // COT-… (opcional)
  surveyCode: string // IL-… (opcional)
  issuerName: string
  issuerRole: string
}

export type DocStatus = 'draft' | 'issued'

export interface EntregaState {
  code: string
  serviceId: string
  accessMode: AccessMode
  shared: SharedData
  hiddenSections: string[]
  // Texto editado de hechos, conclusión, leyenda, normativa y vigencias de anexos, por clave (lib/keys.ts)
  values: Record<string, string>
  // Filas de cada sección de tipo tabla, por id de sección (se copian de la definición al crear)
  tables: Record<string, string[][]>
  coverPhoto?: string
  coverVeil: number // 0–100
  photos: PhotoItem[] // registro fotográfico del servicio ejecutado, máx. 6
  findings: Finding[]
  layoutImage?: string
  status: DocStatus
}
```

- [ ] **Step 2: Test de `code` (falla)**

`src/lib/code.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { generateCode, isValidCode } from './code'

describe('code', () => {
  it('genera EN-aaaammdd-hhmmss', () => {
    expect(generateCode(new Date(2026, 8, 17, 10, 15, 0))).toBe('EN-20260917-101500')
  })
  it('valida el formato', () => {
    expect(isValidCode('EN-20260917-101500')).toBe(true)
    expect(isValidCode('IL-20260917-101500')).toBe(false)
    expect(isValidCode('EN-2026-1')).toBe(false)
  })
})
```

- [ ] **Step 3: Test de `date` (falla)**

`src/lib/date.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { formatDateInput, isValidDate, parseLooseDate, todayDate } from './date'

describe('date', () => {
  it('todayDate usa dd/mm/aaaa', () => {
    expect(todayDate(new Date(2026, 8, 7))).toBe('07/09/2026')
  })
  it('autoformatea con barras', () => {
    expect(formatDateInput('17092026')).toBe('17/09/2026')
  })
  it('valida fechas reales', () => {
    expect(isValidDate('17/09/2026')).toBe(true)
    expect(isValidDate('31/02/2026')).toBe(false)
    expect(isValidDate('17-09-2026')).toBe(false)
    expect(isValidDate('17/9/2026')).toBe(false)
  })
  it('parseLooseDate lee dd.mm.aaaa y dd/mm/aaaa', () => {
    expect(parseLooseDate('Vence 30.06.2026')).toEqual(new Date(2026, 5, 30))
    expect(parseLooseDate('30/06/2026')).toEqual(new Date(2026, 5, 30))
  })
  it('parseLooseDate lee mm.aaaa como el último día del mes', () => {
    expect(parseLooseDate('02.2028')).toEqual(new Date(2028, 1, 29))
  })
  it('parseLooseDate devuelve null si no hay fecha legible', () => {
    expect(parseLooseDate('vigente')).toBeNull()
    expect(parseLooseDate('31.02.2026')).toBeNull()
    expect(parseLooseDate('13.2026')).toBeNull()
  })
})
```

- [ ] **Step 4: Test de `photos` (falla)**

`src/lib/photos.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import type { Finding, PhotoItem } from '../types'
import { MAX_PHOTOS, canAddFindingPhoto, canAddServicePhoto, countFindingPhotos, newPhoto } from './photos'

const photos = (n: number): PhotoItem[] => Array.from({ length: n }, () => newPhoto('data:x'))
const finding = (n: number): Finding => ({
  id: 'f', location: '', description: '', photos: photos(n), severity: 'observation',
  immediateRisk: false, recommendation: '', commercialOpportunity: false,
})

describe('photos', () => {
  it('el tope es 6', () => expect(MAX_PHOTOS).toBe(6))
  it('el registro del servicio admite hasta 6', () => {
    expect(canAddServicePhoto(photos(5))).toBe(true)
    expect(canAddServicePhoto(photos(6))).toBe(false)
  })
  it('los hallazgos comparten el tope de 6 en total', () => {
    const fs = [finding(4), finding(1)]
    expect(countFindingPhotos(fs)).toBe(5)
    expect(canAddFindingPhoto(fs)).toBe(true)
    expect(canAddFindingPhoto([finding(4), finding(2)])).toBe(false)
  })
  it('cada foto nueva trae id propio y descripción vacía', () => {
    const [a, b] = photos(2)
    expect(a.id).not.toBe(b.id)
    expect(a.caption).toBe('')
  })
})
```

- [ ] **Step 5: Ejecutar y ver que fallan**

Run: `npx vitest run`
Expected: FAIL — `Failed to resolve import "./code"` (y los otros dos módulos).

- [ ] **Step 6: Implementación**

`src/lib/code.ts`:
```ts
const CODE_PATTERN = /^EN-\d{8}-\d{6}$/

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// Mismo formato que el resto de la familia (PT-, COT-, IL-): EN-aaaammdd-hhmmss.
export function generateCode(now: Date = new Date()): string {
  const date = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`
  return `EN-${date}-${time}`
}

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code)
}

export function generateId(): string {
  return crypto.randomUUID()
}
```

`src/lib/date.ts`:
```ts
export function todayDate(now: Date = new Date()): string {
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${now.getFullYear()}`
}

// Autoformato progresivo: agrega las barras mientras se escribe.
export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/')
}

function buildDate(year: number, month: number, day: number): Date | null {
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day ? d : null
}

// Estricta: solo dd/mm/aaaa con ceros (la fecha de ejecución).
export function isValidDate(value: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  return !!m && buildDate(Number(m[3]), Number(m[2]), Number(m[1])) !== null
}

// Laxa: busca una fecha dentro de un texto libre (vigencias escritas por una persona).
// dd.mm.aaaa o dd/mm/aaaa → ese día; mm.aaaa → último día del mes (la lectura más permisiva,
// para no avisar vencimientos de más).
export function parseLooseDate(text: string): Date | null {
  const full = /(\d{2})[./](\d{2})[./](\d{4})/.exec(text)
  if (full) return buildDate(Number(full[3]), Number(full[2]), Number(full[1]))
  const monthYear = /(?<!\d)(\d{2})[./](\d{4})/.exec(text)
  if (monthYear) {
    const month = Number(monthYear[1])
    if (month < 1 || month > 12) return null
    return new Date(Number(monthYear[2]), month, 0)
  }
  return null
}
```

`src/lib/photos.ts`:
```ts
import type { Finding, PhotoItem } from '../types'
import { generateId } from './code'

// Tope por sección (pedido de Matías): 6 en el registro del servicio y 6 en total en hallazgos.
export const MAX_PHOTOS = 6

export function countFindingPhotos(findings: Finding[]): number {
  return findings.reduce((n, f) => n + f.photos.length, 0)
}

export function canAddServicePhoto(photos: PhotoItem[]): boolean {
  return photos.length < MAX_PHOTOS
}

export function canAddFindingPhoto(findings: Finding[]): boolean {
  return countFindingPhotos(findings) < MAX_PHOTOS
}

export function newPhoto(dataUrl: string): PhotoItem {
  return { id: generateId(), dataUrl, caption: '' }
}
```

`src/lib/severity.ts`:
```ts
import type { Severity } from '../types'

// Mismo mapeo que informe_levantamiento: solo lo crítico lleva el naranjo pleno.
export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#c2491f',
  needs_action: '#e2723d',
  observation: '#4c6b7a',
  compliant: '#8fa3ad',
}
```

`src/lib/image.ts`:
```ts
// Las fotos se guardan como base64 dentro del documento (un valor de KV admite 25 MB):
// se comprimen en el navegador antes de guardarlas.
export async function compressImage(file: File, maxDimension = 1600, quality = 0.78): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar el lienzo para comprimir la imagen')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}

// Mensaje para la persona cuando una foto no se puede leer (HEIC, archivo corrupto, vacío).
export function imageErrorMessage(err: unknown): string {
  const detail = err instanceof Error && err.message ? ` (${err.message})` : ''
  return `No se pudo leer esa imagen. Prueba con un archivo JPG o PNG${detail}.`
}
```

- [ ] **Step 7: Test de `imageErrorMessage` y correr todo**

Agregar a `src/lib/photos.test.ts`:
```ts
import { imageErrorMessage } from './image'

describe('imageErrorMessage', () => {
  it('sugiere JPG o PNG y no revienta con valores raros', () => {
    expect(imageErrorMessage(new Error('boom'))).toContain('JPG o PNG')
    expect(imageErrorMessage('texto')).toContain('JPG o PNG')
    expect(imageErrorMessage(undefined)).toContain('JPG o PNG')
  })
})
```
Run: `npx vitest run`
Expected: PASS (todos).

- [ ] **Step 8: Deltas del spec**

En `docs/superpowers/specs/2026-10-13-entrega-servicio-design.md` agregar al final de la sección 5 (después del bloque de `EntregaState`):

```markdown
**Ajustes decididos al planificar (2026-10-13):**
- `SharedData` incluye `contact: string` (contacto del cliente, opcional, se precarga desde la cotización o el levantamiento).
- `EntregaState.tables: Record<string, string[][]>` guarda las filas de cada sección de tipo tabla (se copian de la definición al crear), para poder agregar y quitar filas.
- Los campos de ficha (`FactItem`) llevan `hint` (ayuda de pantalla, no es contenido del documento) y no traen valor por defecto cuando dependen del trabajo: un campo vacío bloquea la emisión en vez de usar un marcador entre corchetes.
- `NormativeItem` lleva `id` para no duplicar una norma que aparece en el servicio y en el bloque de altura.
- El folio es de solo lectura en la app.
```

- [ ] **Step 9: Commit**

```bash
npx tsc -b && npm run lint
git add -A
git commit -m "feat: tipos del documento y utilidades de código, fecha, fotos e imagen" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Motor de secciones, interpolación y claves

**Files:**
- Create: `src/services/types.ts`, `src/lib/access.ts`, `src/lib/interpolate.ts`, `src/lib/keys.ts`, `src/lib/sections.ts`
- Test: `src/lib/sections.test.ts`, `src/lib/interpolate.test.ts`

**Interfaces:**
- Consumes: `EntregaState`, `AccessMode`, `SharedData` de `src/types.ts`.
- Produces:
  - `services/types.ts`: `NormStatus`, `NormativeItem {id,text,status}`, `TableColumn`, `FactItem`, `AnnexDef`, `SectionGroup`, `SectionDef`, `SectionKind`, `ServiceDefinition`.
  - `access.ts`: `ACCESS_MODE_LABEL`, `ACCESS_EQUIPMENT` (ambos `Record<AccessMode,string>`).
  - `interpolate.ts`: `KNOWN_VARS`, `KnownVar`, `interpolate(text, ctx)`, `buildContext(state): Record<string,string>`.
  - `keys.ts`: `keys.fact(sec,i)`, `keys.conclusion(sec)`, `keys.legend(sec)`, `keys.annexValidity(sec,i)`, `keys.norm(mode,i)`.
  - `sections.ts`: `NumberedSection {section: SectionDef; number: number}`, `activeSections(def, hidden)`, `toggleSection(hidden, def, id)`, `isHideable(def, id)`.

- [ ] **Step 1: `src/services/types.ts`**

```ts
import type { AccessMode } from '../types'

export type NormStatus = 'validated' | 'to_validate'

export interface NormativeItem {
  id: string // estable, para no duplicar una norma que viene del servicio y del bloque de altura
  text: string
  status: NormStatus
}

export interface TableColumn {
  label: string
  width?: string // p. ej. '12%'
}

export interface FactItem {
  label: string
  value: string // admite {{variables}}; vacío si depende del trabajo
  hint?: string // ayuda de pantalla, no es contenido del documento
  validity?: boolean // texto con una fecha de vigencia que se compara con la fecha de ejecución
}

export interface AnnexDef {
  letter: string
  title: string
  hasValidity: boolean
}

export type SectionGroup = 'common' | 'service' | 'closing'

interface SectionBase {
  id: string
  title: string
  group: SectionGroup
  fixed?: boolean // no se puede ocultar
}

export type SectionDef = SectionBase &
  (
    | { kind: 'identification' }
    | { kind: 'normative' }
    | { kind: 'table'; columns: TableColumn[]; rows: string[][] }
    | { kind: 'facts'; facts: FactItem[]; conclusionHint: string }
    | { kind: 'layout'; instruction: string; legend: string }
    | { kind: 'photos' }
    | { kind: 'annexes'; annexes: AnnexDef[] }
    | { kind: 'findings' }
    | { kind: 'issuance' }
  )

export type SectionKind = SectionDef['kind']

export interface ServiceDefinition {
  id: string
  label: string
  codePrefix: string // p. ej. 'AT-R-ANC'
  defaultAccessMode: AccessMode
  title: string
  intro: string // admite {{variables}}
  normative: NormativeItem[]
  sections: SectionDef[] // en orden de documento
}
```

- [ ] **Step 2: `src/lib/access.ts`**

```ts
import type { AccessMode } from '../types'

export const ACCESS_MODE_LABEL: Record<AccessMode, string> = {
  ground: 'A nivel de piso o azotea',
  suspended_platform: 'Altura · carro colgante',
  rope: 'Altura · cuerdas (rappel)',
}

// El carro colgante exige el N.º de serie: queda entre corchetes a propósito, así que
// el validador bloquea la emisión hasta que la persona lo reemplace.
export const ACCESS_EQUIPMENT: Record<AccessMode, string> = {
  ground: 'Escalas y pértigas telescópicas',
  suspended_platform: 'Carro colgante · N.º de serie [por completar]',
  rope: 'Acceso por cuerdas · línea de trabajo y de seguridad independientes',
}
```

- [ ] **Step 3: Tests de interpolación (fallan)**

`src/lib/interpolate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { KNOWN_VARS, interpolate } from './interpolate'

describe('interpolate', () => {
  it('reemplaza variables conocidas', () => {
    expect(interpolate('Obra en {{asset}} ({{client}})', { asset: 'Torre A', client: 'DAG MS' })).toBe(
      'Obra en Torre A (DAG MS)',
    )
  })
  it('tolera espacios dentro de las llaves', () => {
    expect(interpolate('{{ asset }}', { asset: 'X' })).toBe('X')
  })
  it('deja intacta una variable desconocida para que el validador la detecte', () => {
    expect(interpolate('Hola {{nope}}', { asset: 'X' })).toBe('Hola {{nope}}')
  })
  it('un dato único vacío se reemplaza por texto vacío', () => {
    expect(interpolate('[{{asset}}]', { asset: '' })).toBe('[]')
  })
  it('la lista de variables conocidas incluye las de modalidad', () => {
    expect(KNOWN_VARS).toContain('accessEquipment')
    expect(KNOWN_VARS).toContain('executionDate')
  })
})
```

- [ ] **Step 4: Tests de secciones (fallan)**

`src/lib/sections.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import type { ServiceDefinition } from '../services/types'
import { activeSections, isHideable, toggleSection } from './sections'

const def: ServiceDefinition = {
  id: 't', label: 'T', codePrefix: 'T', defaultAccessMode: 'ground', title: 'T', intro: '', normative: [],
  sections: [
    { id: 'identification', title: 'Identificación', group: 'common', fixed: true, kind: 'identification' },
    { id: 'normative', title: 'Normativa', group: 'common', kind: 'normative' },
    { id: 'tests', title: 'Ensayos', group: 'service', kind: 'facts', facts: [], conclusionHint: '' },
    { id: 'photos', title: 'Fotos', group: 'common', kind: 'photos' },
    { id: 'issuance', title: 'Emisión', group: 'closing', fixed: true, kind: 'issuance' },
  ],
}

describe('sections', () => {
  it('numera de 1 a N en orden de documento', () => {
    expect(activeSections(def, []).map((s) => [s.section.id, s.number])).toEqual([
      ['identification', 1], ['normative', 2], ['tests', 3], ['photos', 4], ['issuance', 5],
    ])
  })
  it('ocultar una sección renumera las siguientes', () => {
    expect(activeSections(def, ['tests']).map((s) => [s.section.id, s.number])).toEqual([
      ['identification', 1], ['normative', 2], ['photos', 3], ['issuance', 4],
    ])
  })
  it('las secciones fijas no se pueden ocultar', () => {
    expect(isHideable(def, 'identification')).toBe(false)
    expect(toggleSection([], def, 'identification')).toEqual([])
    expect(activeSections(def, ['identification', 'issuance']).length).toBe(5)
  })
  it('toggle oculta y vuelve a mostrar', () => {
    const hidden = toggleSection([], def, 'photos')
    expect(hidden).toEqual(['photos'])
    expect(toggleSection(hidden, def, 'photos')).toEqual([])
  })
  it('ocultar todo lo ocultable deja un documento mínimo con numeración correcta', () => {
    const all = ['normative', 'tests', 'photos']
    expect(activeSections(def, all).map((s) => [s.section.id, s.number])).toEqual([
      ['identification', 1], ['issuance', 2],
    ])
  })
  it('ignora ids ocultos que ya no existen en la definición', () => {
    expect(activeSections(def, ['fantasma']).length).toBe(5)
  })
})
```

- [ ] **Step 5: Ejecutar y ver que fallan**

Run: `npx vitest run src/lib/interpolate.test.ts src/lib/sections.test.ts`
Expected: FAIL — módulos no existen.

- [ ] **Step 6: Implementación**

`src/lib/interpolate.ts`:
```ts
import type { EntregaState } from '../types'
import { ACCESS_EQUIPMENT, ACCESS_MODE_LABEL } from './access'

export const KNOWN_VARS = [
  'client', 'asset', 'address', 'contact', 'executionDate', 'quoteCode', 'surveyCode',
  'issuerName', 'issuerRole', 'folio', 'accessMode', 'accessEquipment',
] as const
export type KnownVar = (typeof KNOWN_VARS)[number]

// Una variable desconocida se deja tal cual ({{x}}): el validador la marca como texto sin reemplazar.
export function interpolate(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => (name in ctx ? ctx[name] : match))
}

export function buildContext(state: EntregaState): Record<KnownVar, string> {
  const s = state.shared
  return {
    client: s.client,
    asset: s.asset,
    address: s.address,
    contact: s.contact,
    executionDate: s.executionDate,
    quoteCode: s.quoteCode,
    surveyCode: s.surveyCode,
    issuerName: s.issuerName,
    issuerRole: s.issuerRole,
    folio: state.code,
    accessMode: ACCESS_MODE_LABEL[state.accessMode],
    accessEquipment: ACCESS_EQUIPMENT[state.accessMode],
  }
}
```

`src/lib/keys.ts`:
```ts
import type { AccessMode } from '../types'

// Claves de `EntregaState.values`: una por cada texto editable que no vive en tables/photos/findings.
export const keys = {
  fact: (sectionId: string, index: number) => `${sectionId}.fact${index}`,
  conclusion: (sectionId: string) => `${sectionId}.conclusion`,
  legend: (sectionId: string) => `${sectionId}.legend`,
  annexValidity: (sectionId: string, index: number) => `${sectionId}.annex${index}.validity`,
  // La normativa va por modalidad: lo editado para una no se filtra a otra.
  norm: (mode: AccessMode, index: number) => `normative.${mode}.${index}`,
}
```

`src/lib/sections.ts`:
```ts
import type { SectionDef, ServiceDefinition } from '../services/types'

export interface NumberedSection {
  section: SectionDef
  number: number
}

export function isHideable(def: ServiceDefinition, id: string): boolean {
  const section = def.sections.find((s) => s.id === id)
  return !!section && !section.fixed
}

// ÚNICO lugar que calcula números de sección: el índice, los encabezados y la portada leen de acá.
export function activeSections(def: ServiceDefinition, hidden: string[]): NumberedSection[] {
  const hide = new Set(hidden)
  let n = 0
  return def.sections
    .filter((s) => s.fixed || !hide.has(s.id))
    .map((section) => ({ section, number: ++n }))
}

export function toggleSection(hidden: string[], def: ServiceDefinition, id: string): string[] {
  if (!isHideable(def, id)) return hidden
  return hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id]
}
```

- [ ] **Step 7: Correr y ver que pasan**

Run: `npx vitest run && npx tsc -b`
Expected: PASS y sin errores de tipos.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: motor de secciones ocultables, numeración e interpolación de datos únicos" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Definiciones de servicio — registro y anclajes

**Files:**
- Create: `src/services/normative.ts`, `src/services/common.ts`, `src/services/anchors.ts`, `src/services/index.ts`
- Test: `src/services/services.test.ts`

**Interfaces:**
- Consumes: tipos de `services/types.ts`, `KNOWN_VARS` de `lib/interpolate.ts`.
- Produces:
  - `normative.ts`: `GENERAL_NORMATIVE`, `HEIGHT_NORMATIVE_COMMON`, `HEIGHT_NORMATIVE_BY_MODE`, `normativeItems(def, mode): NormativeItem[]`.
  - `common.ts`: `DEFAULT_ISSUER`, y las fábricas `identificationSection()`, `normativeSection()`, `scopeSection(columns, rows)`, `photosSection()`, `maintenanceSection(rows)`, `annexesSection(annexes)`, `findingsSection()`, `issuanceSection()`.
  - `index.ts`: `SERVICES: Record<string, ServiceDefinition>`, `SERVICE_LIST: ServiceDefinition[]`, `getService(id): ServiceDefinition`.

- [ ] **Step 1: Test genérico de definiciones (falla)**

`src/services/services.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { KNOWN_VARS } from '../lib/interpolate'
import { normativeItems } from './normative'
import { SERVICE_LIST, SERVICES, getService } from './index'
import type { SectionDef } from './types'

const VAR_RE = /\{\{\s*(\w+)\s*\}\}/g

function texts(section: SectionDef): string[] {
  switch (section.kind) {
    case 'table': return [section.title, ...section.columns.map((c) => c.label), ...section.rows.flat()]
    case 'facts': return [section.title, ...section.facts.flatMap((f) => [f.label, f.value, f.hint ?? '']), section.conclusionHint]
    case 'layout': return [section.title, section.instruction, section.legend]
    case 'annexes': return [section.title, ...section.annexes.map((a) => a.title)]
    default: return [section.title]
  }
}

describe.each(SERVICE_LIST.map((d) => [d.id, d] as const))('definición %s', (_id, def) => {
  it('tiene ids de sección únicos', () => {
    const ids = def.sections.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('empieza con la identificación fija y termina con la emisión fija', () => {
    expect(def.sections[0]).toMatchObject({ kind: 'identification', fixed: true })
    expect(def.sections.at(-1)).toMatchObject({ kind: 'issuance', fixed: true })
  })
  it('deja los hallazgos justo antes de la emisión', () => {
    expect(def.sections.at(-2)?.kind).toBe('findings')
  })
  it('incluye las secciones comunes', () => {
    const kinds = def.sections.map((s) => s.kind)
    for (const k of ['normative', 'table', 'photos', 'annexes', 'findings'] as const) expect(kinds).toContain(k)
  })
  it('cada fila de tabla tiene tantas celdas como columnas', () => {
    for (const s of def.sections) if (s.kind === 'table') for (const r of s.rows) expect(r.length).toBe(s.columns.length)
  })
  it('solo usa variables conocidas en sus textos', () => {
    const all = [def.title, def.intro, ...def.normative.map((n) => n.text), ...def.sections.flatMap(texts)]
    for (const t of all) for (const m of t.matchAll(VAR_RE)) expect(KNOWN_VARS).toContain(m[1])
  })
  it('ningún texto base trae marcadores entre corchetes', () => {
    const all = [def.title, def.intro, ...def.normative.map((n) => n.text), ...def.sections.flatMap(texts)]
    for (const t of all) expect(t).not.toMatch(/\[[^\]]{2,}\]/)
  })
  it('la normativa nunca repite una norma', () => {
    for (const mode of ['ground', 'suspended_platform', 'rope'] as const) {
      const ids = normativeItems(def, mode).map((n) => n.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('registro', () => {
  it('getService devuelve la definición o falla con un mensaje claro', () => {
    expect(getService('anchors').id).toBe('anchors')
    expect(() => getService('nope')).toThrow('Servicio desconocido: nope')
  })
})

describe('anclajes (referencia: Dossier de Ranco)', () => {
  const def = SERVICES.anchors
  it('arma las secciones del dossier en orden', () => {
    expect(def.sections.map((s) => s.id)).toEqual([
      'identification', 'normative', 'scope', 'tests', 'layout', 'photos', 'maintenance', 'annexes', 'findings', 'issuance',
    ])
  })
  it('tiene las cuatro normas validadas del proyecto', () => {
    expect(def.normative.filter((n) => n.status === 'validated').map((n) => n.id)).toEqual([
      'en-795', 'en-365', 'nch-1258', 'ds-594',
    ])
  })
  it('a nivel de piso no suma normativa de altura; en cuerdas sí, sin duplicar NCh 1258', () => {
    expect(normativeItems(def, 'ground').length).toBe(4)
    const rope = normativeItems(def, 'rope')
    expect(rope.length).toBeGreaterThan(4)
    expect(rope.filter((n) => n.id === 'nch-1258')).toHaveLength(1)
    expect(rope.find((n) => n.id === 'nch-1258')?.status).toBe('validated')
  })
  it('el plan de mantención parte de 6 meses y alterna inspección y ensayo', () => {
    const plan = def.sections.find((s) => s.id === 'maintenance')
    expect(plan?.kind === 'table' && plan.rows.map((r) => r[0])).toEqual(['6 meses', '12 meses', '18 meses', '24 meses'])
  })
  it('los datos que dependen del trabajo no traen valor por defecto', () => {
    const tests = def.sections.find((s) => s.id === 'tests')
    const calib = tests?.kind === 'facts' ? tests.facts.find((f) => f.label === 'Certificado de calibración') : undefined
    expect(calib?.value).toBe('')
    expect(calib?.validity).toBe(true)
  })
})
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run src/services`
Expected: FAIL — `Failed to resolve import "./index"`.

- [ ] **Step 3: `src/services/normative.ts`**

```ts
import type { AccessMode } from '../types'
import type { NormativeItem, ServiceDefinition } from './types'

// Propuesta basada en fuentes públicas (spec, Anexo A). Todo lo nuevo entra "por validar":
// avisa antes de emitir y no bloquea, hasta que Alto Test lo confirme.
export const GENERAL_NORMATIVE: NormativeItem[] = [
  { id: 'ley-16744', text: 'Ley N°16.744 · Seguro social contra accidentes del trabajo y enfermedades profesionales', status: 'to_validate' },
  { id: 'ds-44', text: 'D.S. N°44 · Reglamento de gestión preventiva de riesgos laborales (vigente desde 01.02.2025)', status: 'to_validate' },
  { id: 'ds-594', text: 'D.S. N°594 · Condiciones sanitarias y ambientales básicas en los lugares de trabajo', status: 'to_validate' },
]

export const HEIGHT_NORMATIVE_COMMON: NormativeItem[] = [
  { id: 'nch-1258', text: 'NCh 1258 · Equipos de protección personal contra caídas', status: 'to_validate' },
]

export const HEIGHT_NORMATIVE_BY_MODE: Record<AccessMode, NormativeItem[]> = {
  ground: [],
  suspended_platform: [
    { id: 'en-1808', text: 'EN 1808:2015 · Equipos de acceso suspendidos (plataformas y carros colgantes)', status: 'to_validate' },
  ],
  rope: [
    { id: 'en-12841', text: 'EN 12841 · Sistemas de acceso por cuerdas: dispositivos de ajuste de cuerda', status: 'to_validate' },
    { id: 'iso-22846', text: 'ISO 22846-1:2003 y 22846-2:2012 · Acceso por cuerdas: principios y código de práctica', status: 'to_validate' },
    { id: 'irata-icop', text: 'IRATA ICOP · Código internacional de práctica de acceso por cuerdas', status: 'to_validate' },
  ],
}

// Normativa del servicio + bloque de altura según la modalidad. Sin duplicados: gana la primera
// aparición (la del servicio, que puede ya estar validada).
export function normativeItems(def: ServiceDefinition, mode: AccessMode): NormativeItem[] {
  const height = mode === 'ground' ? [] : [...HEIGHT_NORMATIVE_COMMON, ...HEIGHT_NORMATIVE_BY_MODE[mode]]
  const seen = new Set<string>()
  return [...def.normative, ...height].filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)))
}
```

- [ ] **Step 4: `src/services/common.ts`**

```ts
import type { AnnexDef, SectionDef, TableColumn } from './types'

// El Dossier de Ranco traía dos cargos distintos para la misma persona. Este es el único lugar
// donde se define; Alto Test debe confirmarlo.
export const DEFAULT_ISSUER = { issuerName: 'Camilo Jara', issuerRole: 'Gerente Comercial y Operaciones' }

export const identificationSection = (): SectionDef => ({
  id: 'identification', title: 'Identificación', group: 'common', fixed: true, kind: 'identification',
})
export const normativeSection = (): SectionDef => ({
  id: 'normative', title: 'Normativa de referencia', group: 'common', kind: 'normative',
})
export const scopeSection = (columns: TableColumn[], rows: string[][]): SectionDef => ({
  id: 'scope', title: 'Alcance ejecutado', group: 'common', kind: 'table', columns, rows,
})
export const photosSection = (): SectionDef => ({
  id: 'photos', title: 'Registro fotográfico', group: 'common', kind: 'photos',
})
export const maintenanceSection = (rows: string[][]): SectionDef => ({
  id: 'maintenance', title: 'Plan de mantención', group: 'common', kind: 'table',
  columns: [{ label: 'Hito', width: '16%' }, { label: 'Actividad recomendada', width: '32%' }, { label: 'Alcance general' }],
  rows,
})
export const annexesSection = (annexes: AnnexDef[]): SectionDef => ({
  id: 'annexes', title: 'Anexos', group: 'common', kind: 'annexes', annexes,
})
export const findingsSection = (): SectionDef => ({
  id: 'findings', title: 'Hallazgos fuera de alcance', group: 'closing', kind: 'findings',
})
export const issuanceSection = (): SectionDef => ({
  id: 'issuance', title: 'Emisión', group: 'closing', fixed: true, kind: 'issuance',
})

export const SCOPE_COLUMNS: TableColumn[] = [
  { label: 'Ítem', width: '9%' }, { label: 'Actividad ejecutada' }, { label: 'Cantidad', width: '16%' }, { label: 'Observación', width: '22%' },
]
```

- [ ] **Step 5: `src/services/anchors.ts`**

```ts
import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection, issuanceSection,
  maintenanceSection, normativeSection, photosSection, scopeSection,
} from './common'
import type { ServiceDefinition } from './types'

// Basado en el Dossier de Ranco (AT-R-ANC-001-INS00). Los datos propios del trabajo (cantidades,
// técnicos, certificados) quedan vacíos: los llena quien ejecutó, y el validador bloquea si faltan.
export const anchors: ServiceDefinition = {
  id: 'anchors',
  label: 'Instalación de anclajes',
  codePrefix: 'AT-R-ANC',
  defaultAccessMode: 'ground',
  title: 'Instalación y verificación de anclajes',
  intro:
    'Documentar y respaldar técnicamente la instalación y verificación de los sistemas de anclaje ejecutados por Alto Test SpA en {{asset}}, consolidando la trazabilidad del servicio y los antecedentes necesarios para su futura inspección y mantenimiento.',
  normative: [
    { id: 'en-795', text: 'EN 795:2012 · Dispositivos de anclaje', status: 'validated' },
    { id: 'en-365', text: 'EN 365:2004 · Requisitos generales de uso e instrucciones', status: 'validated' },
    { id: 'nch-1258', text: 'NCh 1258 · Equipos de protección personal contra caídas', status: 'validated' },
    { id: 'ds-594', text: 'D.S. N°594 · Condiciones sanitarias y ambientales básicas en los lugares de trabajo', status: 'validated' },
  ],
  sections: [
    identificationSection(),
    normativeSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Instalación de sistema de anclaje mecánico sobre perfilería metálica', '', ''],
      ['02', 'Instalación de sistema de anclaje químico sobre elementos de hormigón', '', ''],
      ['03', 'Ensayo no destructivo (END) a anclajes mecánicos instalados', '', ''],
      ['04', 'Ensayo no destructivo (END) a anclajes químicos instalados', '', ''],
    ]),
    {
      id: 'tests', title: 'Resultados de ensayos', group: 'service', kind: 'facts',
      facts: [
        { label: 'Tipo de ensayo', value: 'Proof test / ensayo no destructivo' },
        { label: 'Equipo', value: '', hint: 'Marca, modelo y N.º de serie del extractómetro' },
        { label: 'Certificado de calibración', value: '', validity: true, hint: 'N.º de certificado y vigencia (ej. N.º 123 · vigente hasta 12.03.2027)' },
        { label: 'Criterio de ensayo', value: '', hint: 'Carga y tiempo (ej. 6 kN · 60 s)' },
        { label: 'Fecha de ensayo', value: '{{executionDate}}' },
        { label: 'Técnicos responsables', value: '', hint: 'Nombres de quienes ejecutaron los ensayos' },
      ],
      conclusionHint: 'Resultado de los ensayos frente al criterio de aceptación',
    },
    {
      id: 'layout', title: 'Layout de puntos / As-built', group: 'service', kind: 'layout',
      instruction: 'Sube el plano, layout o croquis final con la ubicación real y la codificación de los elementos intervenidos.',
      legend: 'Plano de ubicación y codificación de los puntos intervenidos en {{asset}}.',
    },
    photosSection(),
    maintenanceSection([
      ['6 meses', 'Inspección + mantención preventiva', 'Revisión general, limpieza, identificación, componentes, marcas de control y condición visible del sustrato.'],
      ['12 meses', 'Ensayo no destructivo de carga', 'Ensayo de los puntos conforme al criterio técnico aplicable y registro de resultados.'],
      ['18 meses', 'Inspección + mantención preventiva', 'Nueva revisión general y mantención preventiva.'],
      ['24 meses', 'Ensayo no destructivo de carga', 'Nuevo ciclo de ensayos y registro de resultados.'],
    ]),
    annexesSection([
      { letter: 'A', title: 'Fichas técnicas y antecedentes de los componentes instalados', hasValidity: false },
      { letter: 'B', title: 'Certificado de calibración del extractómetro / Pull Tester', hasValidity: true },
      { letter: 'C', title: 'Certificado de calibración de llave de torque', hasValidity: true },
      { letter: 'D', title: 'Certificaciones y/o acreditaciones vigentes del personal técnico responsable', hasValidity: true },
    ]),
    findingsSection(),
    issuanceSection(),
  ],
}
```

- [ ] **Step 6: `src/services/index.ts`**

```ts
import { anchors } from './anchors'
import type { ServiceDefinition } from './types'

// Agregar un servicio = escribir su archivo de definición y sumarlo acá.
export const SERVICES: Record<string, ServiceDefinition> = { anchors }
export const SERVICE_LIST: ServiceDefinition[] = Object.values(SERVICES)

export function getService(id: string): ServiceDefinition {
  const def = SERVICES[id]
  if (!def) throw new Error(`Servicio desconocido: ${id}`)
  return def
}
```

- [ ] **Step 7: Correr y ver que pasan**

Run: `npx vitest run && npx tsc -b`
Expected: PASS (incluye los tests de `describe.each` y de anclajes).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: definiciones de servicio, normativa por modalidad y servicio de anclajes" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Estado inicial, campos, validación y emisión

**Files:**
- Create: `src/lib/template.ts`, `src/lib/fields.ts`, `src/lib/validate.ts`, `src/lib/issuance.ts`, `src/test/helpers.ts`
- Test: `src/lib/template.test.ts`, `src/lib/validate.test.ts`, `src/lib/issuance.test.ts`

**Interfaces:**
- Consumes: Tareas 2–4 (`types`, `date`, `code`, `sections`, `interpolate`, `keys`, `normativeItems`, `getService`, `DEFAULT_ISSUER`).
- Produces:
  - `template.ts`: `DEFAULT_COVER_VEIL`, `emptyShared()`, `initialState(serviceId, now?)`, `normalizeState(raw: unknown)`.
  - `fields.ts`: `SHARED_FIELDS`, `interface Field {sectionId,label,value,required,validity,write}`, `effectiveValue(state,key,fallback,ctx)`, `collectFields(state, def): Field[]`.
  - `validate.ts`: `IssueLevel`, `interface Issue {level; message; sectionId?}`, `PLACEHOLDER_RE`, `validate(state, def): Issue[]`, `hasBlocks(issues): boolean`.
  - `issuance.ts`: `applyEdit(prev, next)`, `issueReport(state, issues)`.
  - `test/helpers.ts`: `fillTemplate(state, def): EntregaState` (rellena todo lo obligatorio con datos válidos).

- [ ] **Step 1: `src/lib/template.ts`**

```ts
import type { EntregaState, SharedData } from '../types'
import { generateCode } from './code'
import { todayDate } from './date'
import { DEFAULT_ISSUER } from '../services/common'
import { getService } from '../services'

export const DEFAULT_COVER_VEIL = 60

export function emptyShared(): SharedData {
  return { client: '', asset: '', address: '', contact: '', executionDate: '', quoteCode: '', surveyCode: '', issuerName: '', issuerRole: '' }
}

export function initialState(serviceId: string, now: Date = new Date()): EntregaState {
  const def = getService(serviceId)
  const tables: Record<string, string[][]> = {}
  for (const s of def.sections) if (s.kind === 'table') tables[s.id] = s.rows.map((r) => [...r])
  return {
    code: generateCode(now),
    serviceId,
    accessMode: def.defaultAccessMode,
    shared: { ...emptyShared(), ...DEFAULT_ISSUER, executionDate: todayDate(now) },
    hiddenSections: [],
    values: {},
    tables,
    coverVeil: DEFAULT_COVER_VEIL,
    photos: [],
    findings: [],
    status: 'draft',
  }
}

// Un documento guardado con una versión anterior puede venir sin algún campo nuevo: se completa
// con el estado inicial del mismo servicio. Un servicio que ya no existe lanza un error claro.
export function normalizeState(raw: unknown): EntregaState {
  const doc = (raw ?? {}) as Partial<EntregaState>
  const base = initialState(String(doc.serviceId ?? ''))
  return {
    ...base,
    ...doc,
    shared: { ...base.shared, ...doc.shared },
    tables: { ...base.tables, ...doc.tables },
    values: doc.values ?? {},
    hiddenSections: doc.hiddenSections ?? [],
    photos: doc.photos ?? [],
    findings: doc.findings ?? [],
  }
}
```

- [ ] **Step 2: `src/lib/fields.ts`**

```ts
import type { EntregaState, SharedData } from '../types'
import type { SectionDef, ServiceDefinition } from '../services/types'
import { normativeItems } from '../services/normative'
import { buildContext, interpolate } from './interpolate'
import { keys } from './keys'
import { activeSections } from './sections'

export interface Field {
  sectionId: string
  label: string
  value: string // valor efectivo (lo escrito, o el texto base ya interpolado)
  required: boolean
  validity: boolean
  write: (state: EntregaState, value: string) => EntregaState
}

export const SHARED_FIELDS: { key: keyof SharedData; label: string; required: boolean }[] = [
  { key: 'client', label: 'Cliente', required: true },
  { key: 'asset', label: 'Activo', required: true },
  { key: 'address', label: 'Ubicación', required: true },
  { key: 'contact', label: 'Contacto del cliente', required: false },
  { key: 'executionDate', label: 'Fecha de ejecución', required: true },
  { key: 'quoteCode', label: 'Cotización enlazada', required: false },
  { key: 'surveyCode', label: 'Levantamiento enlazado', required: false },
  { key: 'issuerName', label: 'Emitido por', required: true },
  { key: 'issuerRole', label: 'Cargo de quien emite', required: true },
]

// Si la clave existe (aunque esté vacía) manda lo escrito; si no, el texto base interpolado.
export function effectiveValue(state: EntregaState, key: string, fallback: string, ctx: Record<string, string>): string {
  return key in state.values ? state.values[key] : interpolate(fallback, ctx)
}

const writeValue = (key: string) => (s: EntregaState, v: string): EntregaState => ({ ...s, values: { ...s.values, [key]: v } })

function sectionFields(section: SectionDef, state: EntregaState, def: ServiceDefinition, ctx: Record<string, string>): Field[] {
  const base = { sectionId: section.id }
  const val = (key: string, fallback: string) => effectiveValue(state, key, fallback, ctx)
  switch (section.kind) {
    case 'identification':
      return SHARED_FIELDS.map(({ key, label, required }) => ({
        ...base, label, value: state.shared[key], required, validity: false,
        write: (s, v) => ({ ...s, shared: { ...s.shared, [key]: v } }),
      }))
    case 'normative':
      return normativeItems(def, state.accessMode).map((n, i) => ({
        ...base, label: `Norma ${i + 1}`, value: val(keys.norm(state.accessMode, i), n.text), required: true, validity: false,
        write: writeValue(keys.norm(state.accessMode, i)),
      }))
    case 'table': {
      const rows = state.tables[section.id] ?? section.rows
      return rows.flatMap((row, r) =>
        row.map((cell, c) => ({
          ...base, label: `${section.title} · fila ${r + 1}`, value: interpolate(cell, ctx), required: true, validity: false,
          write: (s: EntregaState, v: string): EntregaState => ({
            ...s,
            tables: { ...s.tables, [section.id]: (s.tables[section.id] ?? section.rows).map((rr, ri) => (ri === r ? rr.map((cc, ci) => (ci === c ? v : cc)) : rr)) },
          }),
        })),
      )
    }
    case 'facts':
      return [
        ...section.facts.map((f, i) => ({
          ...base, label: f.label, value: val(keys.fact(section.id, i), f.value), required: true, validity: !!f.validity,
          write: writeValue(keys.fact(section.id, i)),
        })),
        { ...base, label: 'Conclusión', value: val(keys.conclusion(section.id), ''), required: true, validity: false, write: writeValue(keys.conclusion(section.id)) },
      ]
    case 'layout':
      return [{ ...base, label: 'Leyenda del plano', value: val(keys.legend(section.id), section.legend), required: true, validity: false, write: writeValue(keys.legend(section.id)) }]
    case 'photos':
      return state.photos.map((p, i) => ({
        ...base, label: `Foto ${i + 1}`, value: p.caption, required: true, validity: false,
        write: (s, v) => ({ ...s, photos: s.photos.map((pp, pi) => (pi === i ? { ...pp, caption: v } : pp)) }),
      }))
    case 'annexes':
      return section.annexes.flatMap((a, i) =>
        a.hasValidity
          ? [{ ...base, label: `Anexo ${a.letter} · vigencia`, value: val(keys.annexValidity(section.id, i), ''), required: true, validity: true, write: writeValue(keys.annexValidity(section.id, i)) }]
          : [],
      )
    case 'findings':
      return state.findings.flatMap((f, i) => {
        const patch = (p: Partial<typeof f>) => (s: EntregaState): EntregaState => ({ ...s, findings: s.findings.map((ff, fi) => (fi === i ? { ...ff, ...p } : ff)) })
        const text = (label: string, value: string, prop: 'location' | 'description' | 'recommendation'): Field => ({
          ...base, label: `Hallazgo ${i + 1} · ${label}`, value, required: true, validity: false, write: (s, v) => patch({ [prop]: v })(s),
        })
        const caps = f.photos.map((p, j): Field => ({
          ...base, label: `Hallazgo ${i + 1} · foto ${j + 1}`, value: p.caption, required: true, validity: false,
          write: (s, v) => patch({ photos: f.photos.map((pp, pj) => (pj === j ? { ...pp, caption: v } : pp)) })(s),
        }))
        return [text('ubicación', f.location, 'location'), text('descripción', f.description, 'description'), text('recomendación', f.recommendation, 'recommendation'), ...caps]
      })
    case 'issuance':
      return []
  }
}

// Todo lo editable de las secciones VISIBLES. Lo oculto no se valida ni cuenta.
export function collectFields(state: EntregaState, def: ServiceDefinition): Field[] {
  const ctx = buildContext(state)
  return activeSections(def, state.hiddenSections).flatMap(({ section }) => sectionFields(section, state, def, ctx))
}
```

- [ ] **Step 3: Helper de pruebas `src/test/helpers.ts`**

```ts
import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { collectFields } from '../lib/fields'
import { newPhoto } from '../lib/photos'

// Deja el estado completo y válido: datos únicos, todos los campos obligatorios, plano cargado.
export function fillTemplate(state: EntregaState, def: ServiceDefinition): EntregaState {
  let s: EntregaState = {
    ...state,
    shared: { ...state.shared, client: 'DAG MS', asset: 'Comunidad Ranco', address: 'Luis Carrera #1289, Vitacura', executionDate: '17/09/2026' },
    layoutImage: 'data:image/png;base64,AAAA',
  }
  for (const f of collectFields(s, def)) {
    if (f.required && f.value.trim() === '') s = f.write(s, f.validity ? 'vigente hasta 12.03.2027' : 'dato')
  }
  return s
}

export const photoWithCaption = (caption: string) => ({ ...newPhoto('data:x'), caption })
```

- [ ] **Step 4: Tests de `template` (fallan)**

`src/lib/template.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { initialState, normalizeState } from './template'

describe('initialState', () => {
  const s = initialState('anchors', new Date(2026, 8, 17, 10, 15, 0))
  it('crea un borrador con folio, fecha y emisor por defecto', () => {
    expect(s.code).toBe('EN-20260917-101500')
    expect(s.status).toBe('draft')
    expect(s.shared.executionDate).toBe('17/09/2026')
    expect(s.shared.issuerName).toBe('Camilo Jara')
    expect(s.shared.client).toBe('')
  })
  it('copia las filas de las tablas de la definición', () => {
    expect(s.tables.scope).toHaveLength(4)
    expect(s.tables.maintenance).toHaveLength(4)
  })
  it('un servicio desconocido falla con mensaje claro', () => {
    expect(() => initialState('nope')).toThrow('Servicio desconocido: nope')
  })
})

describe('normalizeState', () => {
  it('completa los campos que faltan en un documento viejo', () => {
    const n = normalizeState({ serviceId: 'anchors', code: 'EN-20260101-000000', shared: { client: 'X' } })
    expect(n.code).toBe('EN-20260101-000000')
    expect(n.shared.client).toBe('X')
    expect(n.shared.issuerName).toBe('Camilo Jara')
    expect(n.tables.scope).toHaveLength(4)
    expect(n.photos).toEqual([])
  })
})
```

- [ ] **Step 5: Tests de validación (fallan)**

`src/lib/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { getService } from '../services'
import { fillTemplate, photoWithCaption } from '../test/helpers'
import { initialState } from './template'
import { hasBlocks, validate } from './validate'
import { newPhoto } from './photos'

const def = getService('anchors')
const valid = () => fillTemplate(initialState('anchors', new Date(2026, 8, 17)), def)
const msgs = (s: ReturnType<typeof valid>, level: 'block' | 'warn') =>
  validate(s, def).filter((i) => i.level === level).map((i) => i.message)

describe('validate', () => {
  it('la plantilla vacía bloquea por datos únicos y campos vacíos', () => {
    const issues = validate(initialState('anchors'), def)
    expect(hasBlocks(issues)).toBe(true)
    expect(issues.some((i) => i.message.includes('Cliente'))).toBe(true)
    expect(issues.some((i) => /campo\(s\) vacío\(s\)/.test(i.message))).toBe(true)
  })

  it('un documento completo no tiene bloqueos', () => {
    expect(msgs(valid(), 'block')).toEqual([])
  })

  it('una vigencia vencida solo avisa, nunca bloquea', () => {
    const s = valid()
    const withExpired = { ...s, values: { ...s.values, 'tests.fact2': 'N.º 4521 · vigente hasta 30.06.2026' } }
    expect(msgs(withExpired, 'block')).toEqual([])
    expect(msgs(withExpired, 'warn').some((m) => m.includes('Vigencia vencida'))).toBe(true)
  })

  it('una vigencia futura no avisa', () => {
    expect(msgs(valid(), 'warn').some((m) => m.includes('Vigencia vencida'))).toBe(false)
  })

  it('bloquea el texto de plantilla sin reemplazar entre corchetes', () => {
    const s = valid()
    const bad = { ...s, values: { ...s.values, 'tests.fact1': '[N.º / fecha / vigencia]' } }
    expect(msgs(bad, 'block').some((m) => m.includes('Texto de plantilla sin reemplazar'))).toBe(true)
  })

  it('bloquea la palabra "Incorporar" y las variables {{x}} sin resolver', () => {
    const s = valid()
    const a = { ...s, values: { ...s.values, 'tests.conclusion': 'Incorporar el resultado' } }
    const b = { ...s, values: { ...s.values, 'tests.conclusion': 'Obra en {{nope}}' } }
    expect(msgs(a, 'block').some((m) => m.includes('Texto de plantilla'))).toBe(true)
    expect(msgs(b, 'block').some((m) => m.includes('Texto de plantilla'))).toBe(true)
  })

  it('el equipo del carro colgante trae un marcador que bloquea hasta reemplazarlo', () => {
    const s = valid()
    const carro = { ...s, accessMode: 'suspended_platform' as const, values: { ...s.values, 'tests.fact1': '{{accessEquipment}}' } }
    expect(msgs(carro, 'block').some((m) => m.includes('Texto de plantilla'))).toBe(true)
  })

  it('bloquea una sección de plano visible sin imagen y deja de bloquear si se oculta', () => {
    const s = { ...valid(), layoutImage: undefined }
    expect(msgs(s, 'block').some((m) => m.includes('plano'))).toBe(true)
    expect(msgs({ ...s, hiddenSections: ['layout'] }, 'block')).toEqual([])
  })

  it('los problemas de una sección oculta no cuentan', () => {
    const s = valid()
    const bad = { ...s, values: { ...s.values, 'tests.fact1': '[por completar]' }, hiddenSections: ['tests'] }
    expect(msgs(bad, 'block')).toEqual([])
  })

  it('bloquea una fecha de ejecución en otro formato con un mensaje claro', () => {
    for (const bad of ['17-09-2026', '17/9/2026', '31/02/2026']) {
      const s = valid()
      const m = msgs({ ...s, shared: { ...s.shared, executionDate: bad } }, 'block')
      expect(m.some((x) => x.includes('Fecha de ejecución') && x.includes('dd/mm/aaaa'))).toBe(true)
    }
  })

  it('con fecha inválida no revienta el aviso de vigencias', () => {
    const s = valid()
    const bad = { ...s, shared: { ...s.shared, executionDate: 'ayer' }, values: { ...s.values, 'tests.fact2': 'hasta 30.06.2026' } }
    expect(() => validate(bad, def)).not.toThrow()
  })

  it('bloquea una foto sin descripción y más de 6 fotos', () => {
    const s = valid()
    expect(msgs({ ...s, photos: [newPhoto('data:x')] }, 'block').some((m) => m.includes('vacío'))).toBe(true)
    const seven = Array.from({ length: 7 }, (_, i) => photoWithCaption(`f${i}`))
    expect(msgs({ ...s, photos: seven }, 'block').some((m) => m.includes('máximo de 6 fotos'))).toBe(true)
  })

  it('bloquea más de 6 fotos repartidas entre los hallazgos', () => {
    const s = valid()
    const f = (n: number) => ({
      id: String(n), location: 'a', description: 'b', recommendation: 'c', severity: 'observation' as const,
      immediateRisk: false, commercialOpportunity: false, photos: Array.from({ length: 4 }, (_, i) => photoWithCaption(`p${n}${i}`)),
    })
    expect(msgs({ ...s, findings: [f(1), f(2)] }, 'block').some((m) => m.includes('hallazgos') && m.includes('máximo de 6 fotos'))).toBe(true)
  })

  it('la normativa por validar avisa una sola vez, sin bloquear', () => {
    const s = { ...valid(), accessMode: 'rope' as const }
    const warns = msgs(s, 'warn').filter((m) => m.includes('por validar'))
    expect(warns).toHaveLength(1)
    expect(msgs(s, 'block').filter((m) => m.includes('por validar'))).toHaveLength(0)
  })

  it('los datos opcionales (contacto, códigos enlazados) no bloquean', () => {
    const s = valid()
    expect(msgs({ ...s, shared: { ...s.shared, contact: '', quoteCode: '', surveyCode: '' } }, 'block')).toEqual([])
  })
})
```

- [ ] **Step 6: Tests de emisión (fallan)**

`src/lib/issuance.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { getService } from '../services'
import { fillTemplate } from '../test/helpers'
import { applyEdit, issueReport } from './issuance'
import { initialState } from './template'
import { validate } from './validate'

const def = getService('anchors')
const valid = () => fillTemplate(initialState('anchors', new Date(2026, 8, 17)), def)

describe('issuance', () => {
  it('emitir sin bloqueos fija el estado en issued', () => {
    const s = valid()
    expect(issueReport(s, validate(s, def)).status).toBe('issued')
  })
  it('emitir con bloqueos falla', () => {
    const s = initialState('anchors')
    expect(() => issueReport(s, validate(s, def))).toThrow('No se puede emitir')
  })
  it('editar un informe emitido lo devuelve a borrador', () => {
    const issued = { ...valid(), status: 'issued' as const }
    const edited = applyEdit(issued, { ...issued, shared: { ...issued.shared, client: 'Otro' } })
    expect(edited.status).toBe('draft')
  })
  it('una "edición" sin cambios (mismo objeto) no revierte la emisión', () => {
    const issued = { ...valid(), status: 'issued' as const }
    expect(applyEdit(issued, issued).status).toBe('issued')
  })
  it('pasar de borrador a emitido no se revierte', () => {
    const draft = valid()
    expect(applyEdit(draft, { ...draft, status: 'issued' }).status).toBe('issued')
  })
})
```

- [ ] **Step 7: Ejecutar y ver que fallan**

Run: `npx vitest run src/lib`
Expected: FAIL — `Failed to resolve import "./validate"` / `./issuance`.

- [ ] **Step 8: `src/lib/validate.ts`**

```ts
import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { normativeItems } from '../services/normative'
import { isValidDate, parseLooseDate } from './date'
import { collectFields } from './fields'
import { countFindingPhotos, MAX_PHOTOS } from './photos'
import { activeSections } from './sections'

export type IssueLevel = 'block' | 'warn'
export interface Issue {
  level: IssueLevel
  message: string
  sectionId?: string
}

// Corchetes con contenido, la palabra "Incorporar" (instrucción de plantilla) y {{variables}} sin resolver.
export const PLACEHOLDER_RE = /\[[^\]]{2,}\]|\bIncorporar\b|\{\{[^}]*\}\}/

export function hasBlocks(issues: Issue[]): boolean {
  return issues.some((i) => i.level === 'block')
}

export function validate(state: EntregaState, def: ServiceDefinition): Issue[] {
  const issues: Issue[] = []
  const sections = activeSections(def, state.hiddenSections)
  const titleOf = (id: string) => sections.find((s) => s.section.id === id)?.section.title ?? id
  const fields = collectFields(state, def)

  // 1. Obligatorios vacíos: un aviso por dato único; los demás se agrupan por sección.
  const emptyBySection = new Map<string, number>()
  for (const f of fields) {
    if (!f.required || f.value.trim() !== '') continue
    if (f.sectionId === 'identification') issues.push({ level: 'block', message: `Falta ${f.label}`, sectionId: 'identification' })
    else emptyBySection.set(f.sectionId, (emptyBySection.get(f.sectionId) ?? 0) + 1)
  }
  for (const [id, n] of emptyBySection) issues.push({ level: 'block', message: `${n} campo(s) vacío(s) en «${titleOf(id)}»`, sectionId: id })

  // 2. Texto de plantilla sin reemplazar: el primero de cada sección.
  const seen = new Set<string>()
  for (const f of fields) {
    const m = PLACEHOLDER_RE.exec(f.value)
    if (m && !seen.has(f.sectionId)) {
      seen.add(f.sectionId)
      issues.push({ level: 'block', message: `Texto de plantilla sin reemplazar en «${titleOf(f.sectionId)}»: ${m[0].slice(0, 48)}`, sectionId: f.sectionId })
    }
  }

  // 3. Fecha de ejecución.
  const dateOk = isValidDate(state.shared.executionDate)
  if (state.shared.executionDate.trim() !== '' && !dateOk) {
    issues.push({ level: 'block', message: 'Fecha de ejecución inválida: usa el formato dd/mm/aaaa (por ejemplo 17/09/2026)', sectionId: 'identification' })
  }

  // 4. Plano visible sin imagen.
  const layout = sections.find((s) => s.section.kind === 'layout')
  if (layout && !state.layoutImage) issues.push({ level: 'block', message: `Falta cargar el plano en «${layout.section.title}»`, sectionId: layout.section.id })

  // 5. Topes de fotos (defensivo: la interfaz ya los impide).
  const photos = sections.find((s) => s.section.kind === 'photos')
  if (photos && state.photos.length > MAX_PHOTOS) issues.push({ level: 'block', message: `El registro fotográfico tiene un máximo de ${MAX_PHOTOS} fotos`, sectionId: photos.section.id })
  const findings = sections.find((s) => s.section.kind === 'findings')
  if (findings && countFindingPhotos(state.findings) > MAX_PHOTOS) issues.push({ level: 'block', message: `Los hallazgos tienen un máximo de ${MAX_PHOTOS} fotos en total`, sectionId: findings.section.id })

  // 6. Avisos que NO bloquean: vigencias vencidas y normativa por validar.
  if (dateOk) {
    const execution = parseLooseDate(state.shared.executionDate)
    for (const f of fields) {
      if (!f.validity) continue
      const until = parseLooseDate(f.value)
      if (until && execution && until < execution) {
        issues.push({ level: 'warn', message: `Vigencia vencida a la fecha de ejecución en «${titleOf(f.sectionId)}»: ${f.value.trim().slice(0, 48)}`, sectionId: f.sectionId })
      }
    }
  }
  const normative = sections.find((s) => s.section.kind === 'normative')
  if (normative) {
    const pending = normativeItems(def, state.accessMode).filter((n) => n.status === 'to_validate').length
    if (pending > 0) issues.push({ level: 'warn', message: `${pending} norma(s) de referencia por validar`, sectionId: normative.section.id })
  }
  return issues
}
```

Nota: `parseLooseDate('17/09/2026')` interpreta `dd/mm/aaaa` (mismo regex), por eso sirve para la fecha de ejecución.

- [ ] **Step 9: `src/lib/issuance.ts`**

```ts
import type { EntregaState } from '../types'
import { hasBlocks, type Issue } from './validate'

// Cualquier edición real de un informe emitido lo devuelve a borrador (decisión de Matías).
// Si `next` es el mismo objeto no hubo edición; si pasa de borrador a emitido es la emisión.
export function applyEdit(prev: EntregaState, next: EntregaState): EntregaState {
  if (next === prev) return prev
  if (prev.status === 'issued' && next.status === 'issued') return { ...next, status: 'draft' }
  return next
}

export function issueReport(state: EntregaState, issues: Issue[]): EntregaState {
  if (hasBlocks(issues)) throw new Error('No se puede emitir: hay bloqueos pendientes')
  return { ...state, status: 'issued' }
}
```

- [ ] **Step 10: Correr y ver que pasan**

Run: `npx vitest run && npx tsc -b && npm run lint`
Expected: PASS. Si falla `la normativa por validar avisa una sola vez`, revisar que `validate` empuje un único aviso de normativa (no uno por norma).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: estado inicial, campos editables, validación (bloqueos y avisos) y emisión" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Nube, almacén y acceso

**Files:**
- Create: `src/lib/api.ts`, `src/lib/store.ts`, `src/EntregaEditor.tsx` (stub, se reemplaza en la Tarea 9)
- Copy: `src/components/AccessGate.tsx`, `src/components/SyncStatus.tsx`, `src/components/Logomark.tsx`, `src/components/Wordmark.tsx`
- Modify: `src/App.tsx`
- Test: `src/lib/api.test.ts`

**Interfaces:**
- Consumes: `EntregaState`, `normalizeState`, `initialState`, `generateCode/isValidCode`, `applyEdit`.
- Produces:
  - `api.ts`: `SyncState`, `ApiError`, `getStoredAccessKey/setStoredAccessKey/clearStoredAccessKey`, `verifyAccessKey(key)`, `ReportSummary {code,client,date,updatedAt}`, `listReports()`, `fetchReport(code): Promise<EntregaState>`, `saveReport(state)`, `deleteReport(code)`, `fetchLinked(kind: 'informe' | 'economica', code): Promise<unknown>`, `toEnvelopeBody(state)`, `MAX_DOC_BYTES`, `assertWithinSizeLimit(state)`.
  - `store.ts`: `useEntregaStore(onAuthExpired)` → `{ state: EntregaState | null, update(fn), startReport(serviceId), loadReport(state), reset(), syncState, booting }`.

- [ ] **Step 1: Copiar componentes de la familia**

```bash
SRC=../informe_levantamiento/src/components
cp $SRC/AccessGate.tsx $SRC/SyncStatus.tsx $SRC/Logomark.tsx $SRC/Wordmark.tsx src/components/
```
No requieren cambios: `AccessGate` importa `./Wordmark` y `SyncStatus` importa `SyncState` de `../lib/api` (lo exporta el `api.ts` de este paso).

- [ ] **Step 2: Test de `api` (falla)**

`src/lib/api.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { ApiError, MAX_DOC_BYTES, assertWithinSizeLimit, toEnvelopeBody } from './api'
import { initialState } from './template'

describe('toEnvelopeBody', () => {
  it('arma el sobre {code, client, date, doc} del Worker', () => {
    const s = initialState('anchors', new Date(2026, 8, 17, 10, 15, 0))
    const withClient = { ...s, shared: { ...s.shared, client: 'DAG MS', asset: 'Comunidad Ranco' } }
    const body = toEnvelopeBody(withClient)
    expect(body.code).toBe('EN-20260917-101500')
    expect(body.client).toBe('DAG MS — Comunidad Ranco')
    expect(body.date).toBe('17/09/2026')
    expect(body.doc).toBe(withClient)
  })
  it('sin cliente ni activo, el resumen queda vacío', () => {
    expect(toEnvelopeBody(initialState('anchors')).client).toBe('')
  })
})

describe('assertWithinSizeLimit', () => {
  it('deja pasar un documento normal', () => {
    expect(() => assertWithinSizeLimit(initialState('anchors'))).not.toThrow()
  })
  it('rechaza antes de enviar un documento que supera el límite de KV', () => {
    const s = { ...initialState('anchors'), coverPhoto: 'x'.repeat(MAX_DOC_BYTES + 1) }
    let err: unknown
    try { assertWithinSizeLimit(s) } catch (e) { err = e }
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(413)
    expect((err as ApiError).message).toContain('demasiado pesado')
  })
})
```

- [ ] **Step 3: Ejecutar y ver que falla**

Run: `npx vitest run src/lib/api.test.ts`
Expected: FAIL — `Failed to resolve import "./api"`.

- [ ] **Step 4: `src/lib/api.ts`** (adaptado de `informe_levantamiento/src/lib/api.ts`)

```ts
import type { EntregaState } from '../types'
import { normalizeState } from './template'

const BASE_URL = import.meta.env.VITE_REPORTS_ENDPOINT
const ACCESS_KEY_STORAGE = 'altotest_entrega_servicio_access_key'

// Tipo de documento de esta app: va en la ruta (/reports/entrega/:code). El Worker es compartido.
const KIND = 'entrega'

// Un valor de KV admite 25 MB. Se corta antes (20 MB) para dejar margen al sobre JSON.
export const MAX_DOC_BYTES = 20 * 1024 * 1024

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error'

export function getStoredAccessKey(): string {
  return localStorage.getItem(ACCESS_KEY_STORAGE) ?? ''
}
export function setStoredAccessKey(key: string) {
  localStorage.setItem(ACCESS_KEY_STORAGE, key)
}
export function clearStoredAccessKey() {
  localStorage.removeItem(ACCESS_KEY_STORAGE)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
      Authorization: `Bearer ${getStoredAccessKey()}`,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, text || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export interface ReportSummary {
  code: string
  client: string
  date: string
  updatedAt: number
}

interface ReportEnvelope {
  code: string
  kind: string
  client: string
  date: string
  updatedAt: number
  doc: unknown
}

export async function verifyAccessKey(key: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/reports/${KIND}`, { headers: { Authorization: `Bearer ${key}` } })
  return res.ok
}

export function listReports(): Promise<ReportSummary[]> {
  return request<ReportSummary[]>(`/reports/${KIND}`)
}

export async function fetchReport(code: string): Promise<EntregaState> {
  const envelope = await request<ReportEnvelope>(`/reports/${KIND}/${encodeURIComponent(code)}`)
  return normalizeState(envelope.doc)
}

// Lee el documento crudo de otra app de la familia (levantamiento o cotización) para precargar datos.
export async function fetchLinked(kind: 'informe' | 'economica', code: string): Promise<unknown> {
  const envelope = await request<ReportEnvelope>(`/reports/${kind}/${encodeURIComponent(code)}`)
  return envelope.doc
}

export function toEnvelopeBody(state: EntregaState) {
  const client = [state.shared.client, state.shared.asset].filter(Boolean).join(' — ')
  return { code: state.code, client, date: state.shared.executionDate, doc: state }
}

export function assertWithinSizeLimit(state: EntregaState): void {
  if (JSON.stringify(state).length > MAX_DOC_BYTES) {
    throw new ApiError(413, 'El informe quedó demasiado pesado para guardarlo en la nube. Quita o reemplaza fotos.')
  }
}

export function saveReport(state: EntregaState): Promise<{ ok: boolean; updatedAt: number }> {
  assertWithinSizeLimit(state)
  return request(`/reports/${KIND}/${encodeURIComponent(state.code)}`, {
    method: 'PUT',
    body: JSON.stringify(toEnvelopeBody(state)),
  })
}

export function deleteReport(code: string): Promise<{ ok: boolean }> {
  return request(`/reports/${KIND}/${encodeURIComponent(code)}`, { method: 'DELETE' })
}
```

- [ ] **Step 5: `src/lib/store.ts`** (adaptado de `informe_levantamiento/src/lib/store.ts`; sin Deshacer; el documento puede no existir todavía)

```ts
import { useEffect, useRef, useState } from 'react'
import type { EntregaState } from '../types'
import { initialState, normalizeState } from './template'
import { applyEdit } from './issuance'
import { fetchReport, saveReport, ApiError } from './api'
import type { SyncState } from './api'

// Copia local del último informe activo: solo para no dejar la pantalla en blanco si el Worker no
// responde. La nube manda.
const MIRROR_KEY = 'altotest_entrega_servicio_mirror'

// Espera de inactividad antes de subir. El plan free de KV da 1000 escrituras/día compartidas
// entre todas las apps de Alto Test.
const AUTOSAVE_DEBOUNCE_MS = 3000

const serialize = (s: EntregaState) => JSON.stringify(s)

function readMirror(): EntregaState | null {
  const saved = localStorage.getItem(MIRROR_KEY)
  if (!saved) return null
  try {
    return normalizeState(JSON.parse(saved))
  } catch {
    return null
  }
}

function writeMirror(s: EntregaState) {
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(s))
  } catch (e) {
    console.warn('No se pudo escribir la copia local del informe:', e)
  }
}

export function useEntregaStore(onAuthExpired: () => void) {
  const [state, setState] = useState<EntregaState | null>(() => readMirror())
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [booting, setBooting] = useState(() => !!readMirror())
  const saveSeq = useRef(0)
  const hadMirrorOnBoot = useRef(!!readMirror())
  // Un informe recién creado (o recién elegido el servicio) que nadie tocó no se guarda. Se compara
  // por referencia y no con un flag de una sola consumición: StrictMode monta cada efecto dos veces.
  const pristine = useRef<EntregaState | null>(state)
  const lastSaved = useRef(state ? serialize(state) : '')
  const onAuthExpiredRef = useRef(onAuthExpired)
  useEffect(() => {
    onAuthExpiredRef.current = onAuthExpired
  })

  // Al montar, si había un informe activo se vuelve a pedir al Worker: la nube manda.
  useEffect(() => {
    const mirror = readMirror()
    if (!mirror) return
    fetchReport(mirror.code)
      .then((fresh) => {
        setState(fresh)
        writeMirror(fresh)
        lastSaved.current = serialize(fresh)
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) return void onAuthExpiredRef.current()
        if (e instanceof ApiError && e.status === 404) return // nunca guardado
        setSyncState('offline')
      })
      .finally(() => setBooting(false))
  }, [])

  useEffect(() => {
    if (!state) return
    if (!hadMirrorOnBoot.current && state === pristine.current) return
    const seq = ++saveSeq.current
    const t = setTimeout(async () => {
      const snapshot = serialize(state)
      if (snapshot === lastSaved.current) return
      writeMirror(state)
      setSyncState('saving')
      try {
        await saveReport(state)
        if (saveSeq.current === seq) {
          lastSaved.current = snapshot
          setSyncState('saved')
        }
      } catch (e) {
        if (saveSeq.current !== seq) return
        if (e instanceof ApiError) {
          if (e.status === 401) return void onAuthExpiredRef.current()
          setSyncState('error')
        } else setSyncState('offline')
      }
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [state])

  // Con 3 s de debounce, cambiar de pestaña podría perder los últimos segundos: se fuerza el guardado.
  useEffect(() => {
    const flushIfHidden = () => {
      if (document.visibilityState !== 'hidden' || !state) return
      const snapshot = serialize(state)
      if (snapshot === lastSaved.current) return
      const seq = ++saveSeq.current
      writeMirror(state)
      saveReport(state)
        .then(() => {
          if (saveSeq.current === seq) lastSaved.current = snapshot
        })
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', flushIfHidden)
    return () => document.removeEventListener('visibilitychange', flushIfHidden)
  }, [state])

  function update(fn: (s: EntregaState) => EntregaState) {
    setState((prev) => (prev ? applyEdit(prev, fn(prev)) : prev))
  }

  function startReport(serviceId: string, accessMode?: EntregaState['accessMode']) {
    const s = initialState(serviceId)
    const fresh = accessMode ? { ...s, accessMode } : s
    pristine.current = fresh
    hadMirrorOnBoot.current = false
    setState(fresh)
  }

  function loadReport(incoming: EntregaState) {
    lastSaved.current = serialize(incoming)
    setState(incoming)
  }

  function reset() {
    localStorage.removeItem(MIRROR_KEY)
    pristine.current = null
    hadMirrorOnBoot.current = false
    setState(null)
  }

  return { state, update, startReport, loadReport, reset, syncState, booting }
}
```

- [ ] **Step 6: `src/App.tsx` y stub del editor**

`src/App.tsx` (idéntico al de `informe_levantamiento`, cambia el componente final):
```tsx
import { useEffect, useState } from 'react'
import { getStoredAccessKey, setStoredAccessKey, clearStoredAccessKey, verifyAccessKey } from './lib/api'
import { AccessGate } from './components/AccessGate'
import EntregaEditor from './EntregaEditor'

export default function App() {
  const [authorized, setAuthorized] = useState(() => !!getStoredAccessKey())
  const [checking, setChecking] = useState(() => !!getStoredAccessKey())

  useEffect(() => {
    const key = getStoredAccessKey()
    if (!key) return
    verifyAccessKey(key).then((ok) => {
      if (!ok) {
        clearStoredAccessKey()
        setAuthorized(false)
      }
      setChecking(false)
    })
  }, [])

  function handleAuthExpired() {
    clearStoredAccessKey()
    setAuthorized(false)
  }

  async function handleAccessSubmit(key: string): Promise<boolean> {
    const ok = await verifyAccessKey(key)
    if (ok) {
      setStoredAccessKey(key)
      setAuthorized(true)
    }
    return ok
  }

  if (checking) return <div className="boot-screen">Cargando…</div>
  if (!authorized) return <AccessGate onSubmit={handleAccessSubmit} />
  return <EntregaEditor onAuthExpired={handleAuthExpired} />
}
```

`src/EntregaEditor.tsx` (**stub**: la Tarea 9 lo reemplaza completo):
```tsx
export default function EntregaEditor({ onAuthExpired }: { onAuthExpired: () => void }) {
  void onAuthExpired
  return <div className="boot-screen">Editor en construcción</div>
}
```

- [ ] **Step 7: Correr todo**

Run: `npx vitest run && npx tsc -b && npm run lint && npm run build`
Expected: PASS y `✓ built`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: cliente del Worker (kind entrega), almacén con autoguardado y portón de acceso" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Primitivas de edición, fotos y hallazgos

**Files:**
- Create: `src/components/EditableText.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/PhotoPicker.tsx`, `src/components/PhotoGrid.tsx`

**Interfaces:**
- Consumes: `compressImage`, `imageErrorMessage`, `newPhoto`, `PhotoItem`.
- Produces:
  - `EditableText({ value, onChange, placeholder?, className?, multiline?, readOnly?, as? })`: `onChange` solo se llama si el texto cambió.
  - `PhotoPicker({ label, disabled, onPhoto(dataUrl), maxDimension?, quality? })`: botón con `input[type=file]`, muestra el error de `imageErrorMessage`.
  - `PhotoGrid({ photos, onCaption(id, text), onRemove(id), readOnly })`: rejilla de figuras con descripción editable.
  - `ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel })`.

- [ ] **Step 1: `src/components/EditableText.tsx`**

```tsx
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
```

- [ ] **Step 2: `src/components/ConfirmDialog.tsx`**

```tsx
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
```

- [ ] **Step 3: `src/components/PhotoPicker.tsx`**

```tsx
import { useId, useState } from 'react'
import { compressImage, imageErrorMessage } from '../lib/image'

interface Props {
  label: string
  disabled?: boolean
  onPhoto: (dataUrl: string) => void
  maxDimension?: number
  quality?: number
  className?: string
}

// Botón de subir imagen. Si el archivo no se puede leer (HEIC, corrupto, vacío) muestra un mensaje
// y deja todo como estaba.
export function PhotoPicker({ label, disabled, onPhoto, maxDimension, quality, className }: Props) {
  const id = useId()
  const [error, setError] = useState('')

  async function onFile(file: File | undefined) {
    if (!file) return
    setError('')
    try {
      onPhoto(await compressImage(file, maxDimension, quality))
    } catch (e) {
      setError(imageErrorMessage(e))
    }
  }

  return (
    <span className={`photo-picker no-print ${className ?? ''}`}>
      <label htmlFor={id} className={`sbtn ${disabled ? 'is-disabled' : ''}`} aria-disabled={disabled}>
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        hidden
        disabled={disabled}
        onChange={(e) => {
          void onFile(e.target.files?.[0])
          e.target.value = '' // permite volver a elegir el mismo archivo
        }}
      />
      {error && <span className="photo-error" role="alert">{error}</span>}
    </span>
  )
}
```

- [ ] **Step 4: `src/components/PhotoGrid.tsx`**

```tsx
import type { PhotoItem } from '../types'
import { EditableText } from './EditableText'

interface Props {
  photos: PhotoItem[]
  onCaption: (id: string, caption: string) => void
  onRemove: (id: string) => void
  readOnly?: boolean
}

// Rejilla de fotos grandes (3 columnas, 4:3): la misma para el registro fotográfico y para los
// hallazgos, porque la foto es la evidencia y es lo que hace vendible el informe.
export function PhotoGrid({ photos, onCaption, onRemove, readOnly }: Props) {
  return (
    <div className="photos">
      {photos.map((p, i) => (
        <figure key={p.id} className="photo">
          <div className="photo-frame">
            <img src={p.dataUrl} alt={p.caption || `Foto ${i + 1}`} />
            {!readOnly && (
              <button type="button" className="photo-remove no-print" title="Quitar foto" onClick={() => onRemove(p.id)}>×</button>
            )}
          </div>
          <figcaption className="cap">
            <EditableText value={p.caption} onChange={(v) => onCaption(p.id, v)} placeholder="Descripción de la foto" readOnly={readOnly} />
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Verificar tipos y lint**

Run: `npx tsc -b && npm run lint`
Expected: sin errores. (Estos componentes se ejercitan en las tareas 8 y 10; su lógica pura ya está probada en la Tarea 2.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: primitivas de edición de texto plano, selector de fotos con error claro y rejilla de fotos" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Renderizadores de sección, portada, índice, documento e impresión

**Files:**
- Create: `src/lib/veil.ts`, `src/components/sections/ctx.ts`, `src/components/sections/IdentificationSection.tsx`, `NormativeSection.tsx`, `TableSection.tsx`, `FactsSection.tsx`, `LayoutSection.tsx`, `PhotosSection.tsx`, `AnnexesSection.tsx`, `FindingsSection.tsx`, `IssuanceSection.tsx`, `src/components/sections/index.tsx`, `src/components/Cover.tsx`, `TableOfContents.tsx`, `SectionSheet.tsx`, `PrintStyles.tsx`, `EntregaDocument.tsx`
- Modify: `src/index.css` (reemplaza el marcador de la Tarea 1)
- Test: `src/lib/veil.test.ts`

**Interfaces:**
- Consumes: Tareas 2–7.
- Produces:
  - `veil.ts`: `veilBackground(percent: number): string`.
  - `sections/ctx.ts`: `interface RenderCtx { state; def; vars; readOnly; update(fn) }`, `valueOf(ctx,key,fallback)`, `setValue(ctx,key,v)`.
  - `sections/index.tsx`: `renderSection(section: SectionDef, ctx: RenderCtx): ReactNode`.
  - `EntregaDocument({ state, def, readOnly?, update? })`: portada + índice + una hoja por sección visible, con `data-sheet`, `data-sheet-title` y `data-sheet-kind` para las compuertas de PDF.

- [ ] **Step 1: Test de `veil` (falla)**

`src/lib/veil.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { veilBackground } from './veil'

describe('veilBackground', () => {
  it('devuelve un degradado corto más una capa pareja', () => {
    const v = veilBackground(60)
    expect(v).toContain('linear-gradient(180deg')
    expect(v.trim().endsWith(')')).toBe(true)
  })
  it('acota el porcentaje entre 0 y 100', () => {
    expect(veilBackground(-20)).toBe(veilBackground(0))
    expect(veilBackground(900)).toBe(veilBackground(100))
  })
  it('0 % no oscurece nada', () => {
    expect(veilBackground(0)).toContain('rgba(16,21,30,0.000)')
  })
})
```
Run: `npx vitest run src/lib/veil.test.ts` → Expected: FAIL (módulo no existe).

- [ ] **Step 2: `src/lib/veil.ts`**

```ts
// Mismo reparto que veilBackground() de propuesta_tecnica_react: capa pareja + degradado de recorrido
// corto (un degradado largo se imprime en bandas visibles).
export function veilBackground(percent: number): string {
  const v = Math.max(0, Math.min(100, percent)) / 100
  const tone = (a: number) => `rgba(16,21,30,${Math.min(1, a).toFixed(3)})`
  return `linear-gradient(180deg,${tone(v * 0.05)} 0%,${tone(v * 0.16)} 34%,${tone(v * 0.3)} 68%,${tone(v * 0.42)} 100%), ${tone(v * 0.62)}`
}
```
Run: `npx vitest run src/lib/veil.test.ts` → Expected: PASS.

- [ ] **Step 3: `src/components/sections/ctx.ts`**

```ts
import type { EntregaState } from '../../types'
import type { ServiceDefinition } from '../../services/types'
import { effectiveValue } from '../../lib/fields'

export interface RenderCtx {
  state: EntregaState
  def: ServiceDefinition
  vars: Record<string, string> // contexto de interpolación (buildContext)
  readOnly: boolean
  update: (fn: (s: EntregaState) => EntregaState) => void
}

export const valueOf = (ctx: RenderCtx, key: string, fallback: string) => effectiveValue(ctx.state, key, fallback, ctx.vars)

export const setValue = (ctx: RenderCtx, key: string, value: string) =>
  ctx.update((s) => ({ ...s, values: { ...s.values, [key]: value } }))
```

- [ ] **Step 4: Secciones simples**

`src/components/sections/IdentificationSection.tsx`:
```tsx
import { interpolate } from '../../lib/interpolate'
import { ACCESS_MODE_LABEL } from '../../lib/access'
import type { RenderCtx } from './ctx'

// Los datos únicos se editan en el panel lateral; acá solo se muestran.
export function IdentificationSection({ ctx }: { ctx: RenderCtx }) {
  const { state, def, vars } = ctx
  const s = state.shared
  return (
    <>
      <p className="lead">{interpolate(def.intro, vars)}</p>
      <dl className="facts">
        <div><dt>Código del informe</dt><dd className="mono">{state.code}</dd></div>
        <div><dt>Revisión</dt><dd>Rev. 0</dd></div>
        <div><dt>Cliente</dt><dd>{s.client || '—'}</dd></div>
        <div><dt>Activo</dt><dd>{s.asset || '—'}</dd></div>
        <div><dt>Ubicación</dt><dd>{s.address || '—'}</dd></div>
        {s.contact && <div><dt>Contacto</dt><dd>{s.contact}</dd></div>}
        <div><dt>Fecha de ejecución</dt><dd>{s.executionDate || '—'}</dd></div>
        <div><dt>Modalidad de acceso</dt><dd>{ACCESS_MODE_LABEL[state.accessMode]}</dd></div>
      </dl>
      {(s.quoteCode || s.surveyCode) && (
        <>
          <h4>Trazabilidad del activo</h4>
          <div className="chips">
            {s.surveyCode && <span className="chip chip--signal">Levantamiento {s.surveyCode}</span>}
            {s.quoteCode && <span className="chip chip--signal">Cotización {s.quoteCode}</span>}
          </div>
        </>
      )}
    </>
  )
}
```

`src/components/sections/IssuanceSection.tsx`:
```tsx
import type { RenderCtx } from './ctx'

// Una sola persona, sin línea de firma y sin tabla de revisiones (decisión de Matías).
export function IssuanceSection({ ctx }: { ctx: RenderCtx }) {
  const { state } = ctx
  const s = state.shared
  return (
    <dl className="facts">
      <div><dt>Código del informe</dt><dd className="mono">{state.code}</dd></div>
      <div><dt>Revisión</dt><dd>Rev. 0 · Emisión inicial</dd></div>
      <div><dt>Fecha de ejecución</dt><dd>{s.executionDate || '—'}</dd></div>
      <div><dt>Emitido por</dt><dd><b>{s.issuerName || '—'}</b><br />{s.issuerRole || '—'}</dd></div>
    </dl>
  )
}
```

`src/components/sections/NormativeSection.tsx`:
```tsx
import { normativeItems } from '../../services/normative'
import { ACCESS_MODE_LABEL } from '../../lib/access'
import { keys } from '../../lib/keys'
import { EditableText } from '../EditableText'
import { setValue, valueOf, type RenderCtx } from './ctx'

export function NormativeSection({ ctx }: { ctx: RenderCtx }) {
  const { state, def, readOnly } = ctx
  const items = normativeItems(def, state.accessMode)
  return (
    <>
      <p>
        Normas de referencia aplicadas a este servicio y a la modalidad de acceso{' '}
        <b>{ACCESS_MODE_LABEL[state.accessMode].toLowerCase()}</b>.
      </p>
      <table className="t t--fixed">
        <thead><tr><th>Norma</th><th style={{ width: '18%' }}>Estado</th></tr></thead>
        <tbody>
          {items.map((n, i) => {
            const key = keys.norm(state.accessMode, i)
            return (
              <tr key={n.id}>
                <td><EditableText value={valueOf(ctx, key, n.text)} onChange={(v) => setValue(ctx, key, v)} readOnly={readOnly} /></td>
                <td><span className={`chip ${n.status === 'validated' ? '' : 'chip--signal'}`}>{n.status === 'validated' ? 'validada' : 'por validar'}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
```

`src/components/sections/TableSection.tsx`:
```tsx
import type { SectionDef } from '../../services/types'
import { interpolate } from '../../lib/interpolate'
import { EditableText } from '../EditableText'
import type { RenderCtx } from './ctx'

type TableDef = Extract<SectionDef, { kind: 'table' }>

export function TableSection({ section, ctx }: { section: TableDef; ctx: RenderCtx }) {
  const { state, vars, readOnly, update } = ctx
  const rows = state.tables[section.id] ?? section.rows

  const setRows = (next: string[][]) => update((s) => ({ ...s, tables: { ...s.tables, [section.id]: next } }))
  const setCell = (r: number, c: number, v: string) =>
    setRows(rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)))

  return (
    <>
      <table className="t t--fixed">
        <thead>
          <tr>
            {section.columns.map((c) => (<th key={c.label} style={c.width ? { width: c.width } : undefined}>{c.label}</th>))}
            {!readOnly && <th className="no-print" style={{ width: '28px' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} data-row>
              {row.map((cell, c) => (
                <td key={c}>
                  <EditableText value={interpolate(cell, vars)} onChange={(v) => setCell(r, c, v)} multiline placeholder="…" readOnly={readOnly} />
                </td>
              ))}
              {!readOnly && (
                <td className="no-print">
                  <button type="button" className="row-remove" title="Quitar fila" onClick={() => setRows(rows.filter((_, ri) => ri !== r))}>×</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <button type="button" className="sbtn no-print" onClick={() => setRows([...rows, section.columns.map(() => '')])}>
          + Agregar fila
        </button>
      )}
    </>
  )
}
```

`src/components/sections/FactsSection.tsx`:
```tsx
import type { SectionDef } from '../../services/types'
import { keys } from '../../lib/keys'
import { EditableText } from '../EditableText'
import { setValue, valueOf, type RenderCtx } from './ctx'

type FactsDef = Extract<SectionDef, { kind: 'facts' }>

export function FactsSection({ section, ctx }: { section: FactsDef; ctx: RenderCtx }) {
  const { readOnly } = ctx
  return (
    <>
      <dl className="facts">
        {section.facts.map((f, i) => {
          const key = keys.fact(section.id, i)
          return (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd><EditableText value={valueOf(ctx, key, f.value)} onChange={(v) => setValue(ctx, key, v)} placeholder={f.hint} multiline readOnly={readOnly} /></dd>
            </div>
          )
        })}
      </dl>
      <h4>Conclusión</h4>
      <p>
        <EditableText
          value={valueOf(ctx, keys.conclusion(section.id), '')}
          onChange={(v) => setValue(ctx, keys.conclusion(section.id), v)}
          placeholder={section.conclusionHint}
          multiline
          readOnly={readOnly}
        />
      </p>
    </>
  )
}
```

`src/components/sections/AnnexesSection.tsx`:
```tsx
import type { SectionDef } from '../../services/types'
import { keys } from '../../lib/keys'
import { EditableText } from '../EditableText'
import { setValue, valueOf, type RenderCtx } from './ctx'

type AnnexesDef = Extract<SectionDef, { kind: 'annexes' }>

export function AnnexesSection({ section, ctx }: { section: AnnexesDef; ctx: RenderCtx }) {
  return (
    <>
      <table className="t t--fixed">
        <thead><tr><th style={{ width: '10%' }}>Anexo</th><th>Documento</th><th style={{ width: '34%' }}>Vigencia</th></tr></thead>
        <tbody>
          {section.annexes.map((a, i) => {
            const key = keys.annexValidity(section.id, i)
            return (
              <tr key={a.letter} data-row>
                <td className="mono">{a.letter}</td>
                <td>{a.title}</td>
                <td>
                  {a.hasValidity ? (
                    <EditableText value={valueOf(ctx, key, '')} onChange={(v) => setValue(ctx, key, v)} placeholder="Ej. vigente hasta 12.03.2027" readOnly={ctx.readOnly} />
                  ) : (
                    <span className="chip">No aplica</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="hint no-print">La vigencia es texto libre. Una fecha vencida avisa antes de emitir, pero no bloquea.</p>
    </>
  )
}
```

- [ ] **Step 5: Plano, fotos y hallazgos**

`src/components/sections/LayoutSection.tsx`:
```tsx
import type { SectionDef } from '../../services/types'
import { keys } from '../../lib/keys'
import { EditableText } from '../EditableText'
import { PhotoPicker } from '../PhotoPicker'
import { setValue, valueOf, type RenderCtx } from './ctx'

type LayoutDef = Extract<SectionDef, { kind: 'layout' }>

export function LayoutSection({ section, ctx }: { section: LayoutDef; ctx: RenderCtx }) {
  const { state, readOnly, update } = ctx
  return (
    <>
      {state.layoutImage ? (
        <figure className="layout-figure">
          <img className="layout-img" src={state.layoutImage} alt="Plano de ubicación de los puntos" />
          {!readOnly && (
            <button type="button" className="sbtn no-print" onClick={() => update((s) => ({ ...s, layoutImage: undefined }))}>Quitar plano</button>
          )}
        </figure>
      ) : (
        <div className="dropzone">
          <span className="chip chip--signal">Falta el plano</span>
          <p className="no-print">{section.instruction}</p>
          {!readOnly && <PhotoPicker label="Cargar plano" onPhoto={(dataUrl) => update((s) => ({ ...s, layoutImage: dataUrl }))} />}
        </div>
      )}
      <p className="legend-text">
        <EditableText
          value={valueOf(ctx, keys.legend(section.id), section.legend)}
          onChange={(v) => setValue(ctx, keys.legend(section.id), v)}
          multiline
          readOnly={readOnly}
        />
      </p>
    </>
  )
}
```

`src/components/sections/PhotosSection.tsx`:
```tsx
import { MAX_PHOTOS, canAddServicePhoto, newPhoto } from '../../lib/photos'
import { PhotoGrid } from '../PhotoGrid'
import { PhotoPicker } from '../PhotoPicker'
import type { RenderCtx } from './ctx'

export function PhotosSection({ ctx }: { ctx: RenderCtx }) {
  const { state, readOnly, update } = ctx
  const full = !canAddServicePhoto(state.photos)
  return (
    <>
      <div className="cap-row no-print">
        <span className="cnt">{state.photos.length} / {MAX_PHOTOS} fotos · máximo</span>
        {!readOnly && <PhotoPicker label="+ Agregar foto" disabled={full} onPhoto={(d) => update((s) => (canAddServicePhoto(s.photos) ? { ...s, photos: [...s.photos, newPhoto(d)] } : s))} />}
      </div>
      <PhotoGrid
        photos={state.photos}
        readOnly={readOnly}
        onCaption={(id, caption) => update((s) => ({ ...s, photos: s.photos.map((p) => (p.id === id ? { ...p, caption } : p)) }))}
        onRemove={(id) => update((s) => ({ ...s, photos: s.photos.filter((p) => p.id !== id) }))}
      />
    </>
  )
}
```

`src/components/sections/FindingsSection.tsx`:
```tsx
import { generateId } from '../../lib/code'
import { MAX_PHOTOS, canAddFindingPhoto, countFindingPhotos, newPhoto } from '../../lib/photos'
import { SEVERITY_COLOR } from '../../lib/severity'
import { SEVERITY_LEVELS, type EntregaState, type Finding } from '../../types'
import { EditableText } from '../EditableText'
import { PhotoGrid } from '../PhotoGrid'
import { PhotoPicker } from '../PhotoPicker'
import type { RenderCtx } from './ctx'

const blankFinding = (): Finding => ({
  id: generateId(), location: '', description: '', photos: [], severity: 'observation',
  immediateRisk: false, recommendation: '', commercialOpportunity: false,
})

export function FindingsSection({ ctx }: { ctx: RenderCtx }) {
  const { state, readOnly, update } = ctx
  const F = state.findings
  const total = countFindingPhotos(F)
  const risk = F.filter((f) => f.immediateRisk).length
  const opp = F.filter((f) => f.commercialOpportunity).length

  const patch = (id: string, p: Partial<Finding>) =>
    update((s: EntregaState) => ({ ...s, findings: s.findings.map((f) => (f.id === id ? { ...f, ...p } : f)) }))

  return (
    <>
      <p>Condiciones detectadas en terreno que no formaban parte del trabajo contratado. Se informan para conocimiento del cliente.</p>
      <div className="sum">
        <span><b>{F.length}</b> hallazgo{F.length === 1 ? '' : 's'}</span>
        <span><b>{risk}</b> con riesgo inmediato</span>
        <span><b>{opp}</b> oportunidad{opp === 1 ? '' : 'es'} comercial{opp === 1 ? '' : 'es'}</span>
        <span className="no-print"><b>{total} / {MAX_PHOTOS}</b> fotos · máximo en esta sección</span>
      </div>

      {F.map((f, i) => (
        <article key={f.id} className="finding" style={{ borderLeftColor: SEVERITY_COLOR[f.severity] }}>
          <div className="finding-head">
            <div className="tags">
              <span className="sevb" style={{ background: SEVERITY_COLOR[f.severity] }}>{SEVERITY_LEVELS.find((l) => l.value === f.severity)?.label}</span>
              {f.immediateRisk && <span className="chip chip--signal">Riesgo inmediato</span>}
              {f.commercialOpportunity && <span className="chip chip--signal">Oportunidad comercial</span>}
            </div>
            {!readOnly && (
              <div className="finding-controls no-print">
                <select aria-label={`Severidad del hallazgo ${i + 1}`} value={f.severity} onChange={(e) => patch(f.id, { severity: e.target.value as Finding['severity'] })}>
                  {SEVERITY_LEVELS.map((l) => (<option key={l.value} value={l.value}>{l.label}</option>))}
                </select>
                <label><input type="checkbox" checked={f.immediateRisk} onChange={(e) => patch(f.id, { immediateRisk: e.target.checked })} /> Riesgo inmediato</label>
                <label><input type="checkbox" checked={f.commercialOpportunity} onChange={(e) => patch(f.id, { commercialOpportunity: e.target.checked })} /> Oportunidad comercial</label>
                <button type="button" className="sbtn" onClick={() => update((s) => ({ ...s, findings: s.findings.filter((x) => x.id !== f.id) }))}>Quitar hallazgo</button>
              </div>
            )}
            <dl className="finding-text">
              <div><dt>Ubicación</dt><dd><EditableText value={f.location} onChange={(v) => patch(f.id, { location: v })} placeholder="Dónde se detectó" readOnly={readOnly} /></dd></div>
              <div><dt>Descripción</dt><dd><EditableText value={f.description} onChange={(v) => patch(f.id, { description: v })} placeholder="Qué se vio" multiline readOnly={readOnly} /></dd></div>
              <div><dt>Recomendación</dt><dd><EditableText value={f.recommendation} onChange={(v) => patch(f.id, { recommendation: v })} placeholder="Qué se recomienda hacer" multiline readOnly={readOnly} /></dd></div>
            </dl>
          </div>
          {!readOnly && (
            <div className="cap-row no-print">
              <span className="cnt">{f.photos.length} foto{f.photos.length === 1 ? '' : 's'} de este hallazgo</span>
              <PhotoPicker label="+ Foto" disabled={!canAddFindingPhoto(F)} onPhoto={(d) => update((s) => (canAddFindingPhoto(s.findings) ? { ...s, findings: s.findings.map((x) => (x.id === f.id ? { ...x, photos: [...x.photos, newPhoto(d)] } : x)) } : s))} />
            </div>
          )}
          <PhotoGrid
            photos={f.photos}
            readOnly={readOnly}
            onCaption={(pid, caption) => patch(f.id, { photos: f.photos.map((p) => (p.id === pid ? { ...p, caption } : p)) })}
            onRemove={(pid) => patch(f.id, { photos: f.photos.filter((p) => p.id !== pid) })}
          />
        </article>
      ))}

      {!readOnly && (
        <button type="button" className="sbtn no-print" onClick={() => update((s) => ({ ...s, findings: [...s.findings, blankFinding()] }))}>
          + Agregar hallazgo
        </button>
      )}
      {F.length === 0 && <p className="hint">Sin hallazgos fuera de alcance. Si no se detectó nada, puedes ocultar esta sección.</p>}
    </>
  )
}
```

- [ ] **Step 6: Registro de renderizadores `src/components/sections/index.tsx`**

```tsx
import type { ReactNode } from 'react'
import type { SectionDef } from '../../services/types'
import type { RenderCtx } from './ctx'
import { AnnexesSection } from './AnnexesSection'
import { FactsSection } from './FactsSection'
import { FindingsSection } from './FindingsSection'
import { IdentificationSection } from './IdentificationSection'
import { IssuanceSection } from './IssuanceSection'
import { LayoutSection } from './LayoutSection'
import { NormativeSection } from './NormativeSection'
import { PhotosSection } from './PhotosSection'
import { TableSection } from './TableSection'

// Un renderizador genérico por tipo de sección. Un servicio nuevo NO agrega componentes: usa estos.
export function renderSection(section: SectionDef, ctx: RenderCtx): ReactNode {
  switch (section.kind) {
    case 'identification': return <IdentificationSection ctx={ctx} />
    case 'normative': return <NormativeSection ctx={ctx} />
    case 'table': return <TableSection section={section} ctx={ctx} />
    case 'facts': return <FactsSection section={section} ctx={ctx} />
    case 'layout': return <LayoutSection section={section} ctx={ctx} />
    case 'photos': return <PhotosSection ctx={ctx} />
    case 'annexes': return <AnnexesSection section={section} ctx={ctx} />
    case 'findings': return <FindingsSection ctx={ctx} />
    case 'issuance': return <IssuanceSection ctx={ctx} />
  }
}
```

- [ ] **Step 7: Portada, índice, hoja, estilos de impresión y documento**

`src/components/Cover.tsx`:
```tsx
import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { veilBackground } from '../lib/veil'
import { SEVERITY_COLOR } from '../lib/severity'
import { Wordmark } from './Wordmark'

const ORDER = ['critical', 'needs_action', 'observation', 'compliant'] as const

export function Cover({ state, def }: { state: EntregaState; def: ServiceDefinition }) {
  const s = state.shared
  const counts = ORDER.map((sev) => ({ sev, n: state.findings.filter((f) => f.severity === sev).length })).filter((c) => c.n > 0)
  const opp = state.findings.filter((f) => f.commercialOpportunity).length
  const hasPhoto = !!state.coverPhoto
  return (
    <section className="sheet cover" data-sheet="cover">
      <div className="sheet-body cover-body" style={hasPhoto ? { backgroundImage: `url("${state.coverPhoto}")` } : undefined}>
        <div className="cover-veil" style={{ background: hasPhoto ? veilBackground(state.coverVeil) : 'none' }} aria-hidden="true" />
        <div className="cover-fade" aria-hidden="true" />
        <div className="cover-content">
          <Wordmark tone="signal" textClassName="text-[16px] text-paper" />
          <div className="cover-spacer" />
          <p className="cover-eyebrow">Informe de Entrega de Servicio</p>
          <h2 className="cover-title">{def.title}</h2>
          <p className="cover-sub">{[s.asset, s.address].filter(Boolean).join(' · ') || '—'}</p>
          <p className={`stamp ${state.status === 'issued' ? 'stamp--issued' : ''}`}>{state.status === 'issued' ? 'EMITIDO · REV. 0' : 'BORRADOR'}</p>
          <dl className="facts facts--cover">
            <div><dt>Cliente</dt><dd>{s.client || '—'}</dd></div>
            <div><dt>Activo</dt><dd>{s.asset || '—'}</dd></div>
            <div><dt>Ejecución</dt><dd>{s.executionDate || '—'}</dd></div>
            <div><dt>Folio</dt><dd className="mono">{state.code}</dd></div>
          </dl>
          <div className="band">
            {counts.length ? counts.map((c) => <i key={c.sev} style={{ flex: c.n, background: SEVERITY_COLOR[c.sev] }} />) : <i style={{ flex: 1, background: SEVERITY_COLOR.compliant }} />}
          </div>
          <p className="legend">
            {state.findings.length} hallazgo{state.findings.length === 1 ? '' : 's'} fuera de alcance · {opp} oportunidad{opp === 1 ? '' : 'es'} comercial{opp === 1 ? '' : 'es'}
          </p>
        </div>
      </div>
    </section>
  )
}
```

`src/components/TableOfContents.tsx`:
```tsx
import type { NumberedSection } from '../lib/sections'

const GROUP_LABEL = { common: 'Común', service: 'Propia del servicio', closing: 'Cierre' } as const

export function TableOfContents({ sections }: { sections: NumberedSection[] }) {
  return (
    <section className="sheet" data-sheet="toc" data-sheet-title="Índice">
      <div className="sheet-body">
        <p className="sec-eyebrow">Contenido</p>
        <h3 className="sheet-title">Índice</h3>
        <ol className="toc">
          {sections.map(({ section, number }) => (
            <li key={section.id}>
              <span className="num">{String(number).padStart(2, '0')}</span>
              <span>{section.title}</span>
              <span className={`chip ${section.group === 'service' ? 'chip--signal' : ''}`}>{GROUP_LABEL[section.group]}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
```

`src/components/SectionSheet.tsx`:
```tsx
import type { ReactNode } from 'react'
import type { NumberedSection } from '../lib/sections'

const GROUP_LABEL = { common: 'Común', service: 'Propia del servicio', closing: 'Cierre' } as const

// En pantalla es una hoja Carta; al imprimir fluye: el navegador la reparte en las hojas que necesite.
export function SectionSheet({ numbered, children }: { numbered: NumberedSection; children: ReactNode }) {
  const { section, number } = numbered
  return (
    <section className="sheet" data-sheet={section.id} data-sheet-kind={section.kind} data-sheet-title={section.title}>
      <div className="sheet-body">
        <p className="sec-eyebrow">
          <span>Sección {String(number).padStart(2, '0')}</span>
          <span className={`chip ${section.group === 'service' ? 'chip--signal' : ''}`}>{GROUP_LABEL[section.group]}</span>
        </p>
        <h3 className="sheet-title">{section.title}</h3>
        {children}
      </div>
    </section>
  )
}
```

`src/components/PrintStyles.tsx`:
```tsx
// El pie va en las cajas de margen de @page (ver index.css). Acá solo se inyecta el folio, que
// cambia por documento. Se deja solo [A-Z0-9-] para que nada pueda cerrar la cadena CSS.
export function PrintStyles({ code }: { code: string }) {
  const safe = code.replace(/[^A-Za-z0-9-]/g, '')
  return <style>{`@page { @bottom-left { content: "ALTO TEST · ${safe}"; } }`}</style>
}
```

`src/components/EntregaDocument.tsx`:
```tsx
import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { buildContext } from '../lib/interpolate'
import { activeSections } from '../lib/sections'
import { Cover } from './Cover'
import { PrintStyles } from './PrintStyles'
import { SectionSheet } from './SectionSheet'
import { TableOfContents } from './TableOfContents'
import { renderSection } from './sections'
import type { RenderCtx } from './sections/ctx'

interface Props {
  state: EntregaState
  def: ServiceDefinition
  readOnly?: boolean
  update?: RenderCtx['update']
}

export function EntregaDocument({ state, def, readOnly = false, update }: Props) {
  const sections = activeSections(def, state.hiddenSections)
  const ctx: RenderCtx = { state, def, vars: buildContext(state), readOnly, update: update ?? (() => {}) }
  return (
    <div className="doc" data-folio={state.code}>
      <PrintStyles code={state.code} />
      <Cover state={state} def={def} />
      <TableOfContents sections={sections} />
      {sections.map((n) => (
        <SectionSheet key={n.section.id} numbered={n}>
          {renderSection(n.section, ctx)}
        </SectionSheet>
      ))}
    </div>
  )
}
```

- [ ] **Step 8: CSS — reemplazar el marcador de la Tarea 1**

En `src/index.css`, reemplazar las últimas líneas (`/* (se completa en la Tarea 8) */` y el `}` que cierra `@layer components`) por la parte A (dentro de la capa) más el cierre, y agregar la parte B (impresión) **fuera** de la capa:

```bash
python3 - <<'PY'
import re
p='src/index.css'; s=open(p,encoding='utf-8').read()
marker='\n  /* (se completa en la Tarea 8) */\n}\n'
assert s.endswith(marker)
s=s[:-len(marker)]
open(p,'w',encoding='utf-8').write(s)
PY
cat >> src/index.css <<'CSS'

  /* ═════════════════ Campos editables ═════════════════ */
  .editable {
    outline: none;
    border-radius: 1px;
    /* Un texto pegado sin espacios (una URL larga) no debe desbordar su celda ni ensanchar el
       documento: Chrome ENCOGE todo el PDF para que quepa. */
    overflow-wrap: anywhere;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .editable:hover { background: rgb(76 107 122 / 12%); }
  .editable:focus { background: rgb(194 73 31 / 10%); box-shadow: inset 2px 0 0 var(--color-signal); }
  .editable:empty::before { content: attr(data-ph); color: var(--color-signal); font-family: var(--font-mono); font-size: 10px; }
  .editable--block { display: block; }

  /* ═════════════════ Editor ═════════════════ */
  .editor-layout { display: grid; grid-template-columns: 310px minmax(0, 1fr); gap: 20px; align-items: start; padding: 16px; }
  @media (max-width: 960px) { .editor-layout { grid-template-columns: minmax(0, 1fr); } }
  .side-panel { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 64px; max-height: calc(100vh - 80px); overflow: auto; min-width: 0; }
  @media (max-width: 960px) { .side-panel { position: static; max-height: none; } }
  .box { background: var(--color-paper); border: 1px solid var(--color-steel-pale); padding: 12px 14px; }
  .box h2 { font: 500 10px var(--font-mono); letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-steel); margin: 0 0 10px; }
  .field { display: grid; gap: 3px; margin-bottom: 8px; }
  .field label { font: 400 11px var(--font-mono); color: var(--color-steel); }
  .field input, .field select { background: transparent; border: 1px solid var(--color-steel-pale); padding: 6px 8px; width: 100%; min-width: 0; font: inherit; }
  .field--error input { border-color: var(--color-signal); }
  .hint { font-size: 11.5px; color: var(--color-steel); margin: 6px 0 0; }
  .seg { display: grid; gap: 4px; }
  .seg button { text-align: left; border: 1px solid var(--color-steel-pale); background: transparent; padding: 6px 8px; cursor: pointer; font: inherit; }
  .seg button[aria-pressed='true'] { border-color: var(--color-signal); box-shadow: inset 3px 0 0 var(--color-signal); background: rgb(194 73 31 / 6%); }
  .toggles { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .toggles .grp { font: 500 9.5px var(--font-mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-steel); margin: 8px 0 2px; }
  .toggles label { display: flex; gap: 8px; align-items: baseline; padding: 3px 0; cursor: pointer; }
  .toggles .n { font: 400 11px var(--font-mono); color: var(--color-signal); min-width: 2ch; text-align: right; }
  .gate { position: sticky; top: 8px; z-index: 5; background: var(--color-paper); border: 1px solid var(--color-steel-pale); padding: 10px 14px; margin-bottom: 18px; }
  .gate-row { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; justify-content: space-between; }
  .pill { font: 500 11px var(--font-mono); padding: 3px 8px; background: #e8eae6; }
  .pill--bad { color: #a53a14; } .pill--warn { color: #9a6a00; } .pill--ok { color: #2f6f4f; }
  .issues { margin: 10px 0 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: 12.5px; max-height: 220px; overflow: auto; }
  .issues li { display: flex; gap: 8px; align-items: baseline; }
  .issues a { cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
  .tag { font: 500 9.5px var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; padding: 1px 5px; color: #fff; white-space: nowrap; }
  .tag--bad { background: #a53a14; } .tag--warn { background: #9a6a00; }
  .sbtn { border: 1px solid var(--color-ink); background: transparent; color: var(--color-ink); padding: 5px 10px; font: 500 11px var(--font-mono); cursor: pointer; display: inline-block; }
  .sbtn.is-disabled, .sbtn:disabled { opacity: 0.4; cursor: not-allowed; }
  .photo-error { display: block; color: var(--color-signal); font-size: 11.5px; margin-top: 4px; }
  .dialog-backdrop { position: fixed; inset: 0; background: rgb(16 21 30 / 55%); display: grid; place-items: center; z-index: 90; }
  .dialog { background: var(--color-paper); padding: 20px; width: min(420px, calc(100vw - 32px)); }
  .dialog-title { font-weight: 600; margin: 0 0 6px; } .dialog-message { margin: 0 0 16px; }
  .dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
  .picker { max-width: 640px; margin: 48px auto; padding: 0 16px; display: grid; gap: 14px; }
  .picker h1 { font: 600 24px var(--font-sans); margin: 0; }
  .picker .svc { text-align: left; border: 1px solid var(--color-steel-pale); background: var(--color-paper); padding: 12px 14px; cursor: pointer; font: inherit; }
  .picker .svc[aria-pressed='true'] { border-color: var(--color-signal); box-shadow: inset 4px 0 0 var(--color-signal); }

  /* ═════════════════ Documento: hojas ═════════════════ */
  .doc { display: flex; flex-direction: column; align-items: center; gap: 22px; }
  .sheet { position: relative; background: var(--color-paper); color: var(--color-ink); width: 8.5in; max-width: 100%; min-height: 11in; box-shadow: 0 12px 30px -16px rgb(0 0 0 / 35%); font-size: 12.5px; line-height: 1.45; display: flex; flex-direction: column; }
  .sheet-body { padding: 0.8in 0.75in; flex: 1; min-width: 0; }
  @media (max-width: 700px) { .sheet-body { padding: 28px 18px; } }
  .sec-eyebrow { font: 500 10px var(--font-mono); letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-steel); margin: 0 0 6px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .sheet-title { font: 600 clamp(19px, 3vw, 24px) / 1.2 var(--font-sans); margin: 0 0 14px; text-wrap: balance; }
  .sheet h4 { font: 500 10px var(--font-mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-steel); margin: 18px 0 6px; }
  .sheet p { margin: 0 0 8px; text-align: justify; }
  .lead { font-size: 13.5px; }
  .mono { font-family: var(--font-mono); }
  .chip { font: 500 9px var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid var(--color-steel-pale); padding: 1px 6px; color: var(--color-steel); }
  .chip--signal { border-color: var(--color-signal); color: var(--color-signal); }
  .chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px 22px; margin: 0; }
  .facts > div { border-top: 1px solid var(--color-ink); padding-top: 5px; min-width: 0; }
  .facts dt { font: 500 9.5px var(--font-mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-steel); margin: 0 0 2px; }
  .facts dd { margin: 0; }
  table.t { width: 100%; border-collapse: collapse; }
  table.t--fixed { table-layout: fixed; }
  table.t th { font: 500 9.5px var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-steel); text-align: left; border-bottom: 1.5px solid var(--color-ink); padding: 6px 8px 6px 0; }
  table.t td { border-bottom: 1px solid #c9cfcc; padding: 7px 8px 7px 0; vertical-align: top; overflow-wrap: anywhere; }
  .row-remove { border: 0; background: transparent; cursor: pointer; color: var(--color-steel); font-size: 16px; }
  .toc { list-style: none; margin: 0; padding: 0; }
  .toc li { display: grid; grid-template-columns: 3ch minmax(0, 1fr) auto; gap: 10px; padding: 8px 0; border-bottom: 1px dotted var(--color-steel-pale); align-items: baseline; }
  .toc .num { font: 500 12px var(--font-mono); color: var(--color-signal); }
  .photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; }
  .photo { margin: 0; }
  .photo-frame { position: relative; aspect-ratio: 4 / 3; background: repeating-linear-gradient(135deg, #dfe3e1 0 8px, #eaedeb 8px 16px); border: 1px solid #c9cfcc; }
  .photo-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .photo-remove { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border: 0; background: rgb(16 21 30 / 75%); color: #fff; cursor: pointer; }
  .cap { font-size: 11.5px; margin-top: 4px; }
  .cap-row { display: flex; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; }
  .cap-row .cnt { font: 500 11px var(--font-mono); color: var(--color-steel); }
  .dropzone { border: 1.5px dashed var(--color-signal); padding: 26px 18px; background: rgb(194 73 31 / 5%); display: grid; gap: 12px; justify-items: start; }
  .layout-figure { margin: 0 0 8px; text-align: center; }
  .layout-img { max-width: 100%; max-height: 7in; object-fit: contain; }
  .sum { display: flex; gap: 18px; flex-wrap: wrap; margin: 0 0 14px; font: 400 11px var(--font-mono); color: var(--color-steel); }
  .sum b { color: var(--color-signal); font-weight: 500; }
  .finding { border: 1px solid #c9cfcc; border-left: 4px solid var(--color-steel); padding: 14px 16px 16px; margin-bottom: 18px; }
  .finding .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
  .finding-controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; font-size: 12px; }
  .finding-text { margin: 6px 0 0; display: grid; gap: 4px; }
  .finding-text dt { font: 500 9.5px var(--font-mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-steel); }
  .finding-text dd { margin: 0; }
  .sevb { font: 500 9.5px var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; color: #fff; padding: 2px 7px; }
  .hint.no-print, .legend-text { font-size: 12px; }

  /* ═════════════════ Portada ═════════════════ */
  .sheet.cover { background: var(--color-ink); color: var(--color-paper); }
  .cover-body { position: relative; padding: 0; background: linear-gradient(160deg, var(--color-ink-soft), var(--color-ink)); background-size: cover; background-position: center; overflow: hidden; }
  .cover-veil, .cover-fade { position: absolute; inset: 0; }
  .cover-fade { background: linear-gradient(180deg, rgb(16 21 30 / 0%) 56%, rgb(16 21 30 / 92%) 80%); }
  .cover-content { position: relative; min-height: 11in; padding: 0.9in 0.9in 0.8in; display: flex; flex-direction: column; gap: 6px; }
  @media (max-width: 700px) { .cover-content { padding: 32px 22px; } }
  .cover-spacer { flex: 1; min-height: 60px; }
  .cover-eyebrow { font: 500 10px var(--font-mono); letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-signal-glow); margin: 0 0 12px; text-align: left; }
  .cover-title { font: 600 clamp(26px, 5vw, 38px) / 1.12 var(--font-sans); margin: 0; text-wrap: balance; }
  .cover-sub { font-size: 18px; color: var(--color-steel-pale); margin: 8px 0 0; text-align: left; }
  .stamp { font: 500 10px var(--font-mono); letter-spacing: 0.14em; border: 1px solid var(--color-signal); color: var(--color-signal-glow); padding: 2px 8px; align-self: flex-start; margin: 14px 0 !important; text-align: left; }
  .stamp--issued { border-color: #6fc08f; color: #6fc08f; }
  .facts--cover > div { border-color: rgb(244 245 242 / 35%); }
  .facts--cover dt { color: var(--color-steel-pale); }
  .band { display: flex; height: 8px; gap: 2px; margin-top: 18px; }
  .band i { display: block; height: 100%; }
  .legend { font: 400 11px var(--font-mono); color: var(--color-steel-pale); margin: 8px 0 0; text-align: left; }
}

/* ═════════════════ Impresión ═════════════════
   FUERA de @layer a propósito: las reglas sin capa ganan sobre @layer components. */

html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
/* Un texto sin espacios no puede ensanchar el documento (Chrome encogería todo el PDF). */
body { overflow-wrap: anywhere; }

@page {
  size: Letter;
  margin: 0.8in 0.75in 0.9in 0.75in;
  @bottom-left {
    font: 500 8.5px 'IBM Plex Mono', monospace;
    letter-spacing: 0.14em;
    color: #4c6b7a;
    border-top: 1.5px solid #4c6b7a;
    padding-top: 6px;
    vertical-align: top;
  }
  @bottom-right {
    content: 'Página ' counter(page) ' de ' counter(pages);
    font: 500 8.5px 'IBM Plex Mono', monospace;
    letter-spacing: 0.14em;
    color: #4c6b7a;
    border-top: 1.5px solid #4c6b7a;
    padding-top: 6px;
    vertical-align: top;
  }
}
/* Portada a sangre y sin pie. */
@page cover {
  margin: 0;
  @bottom-left { content: none; border: 0; }
  @bottom-right { content: none; border: 0; }
}

@media print {
  html, body { background: #fff; }
  .no-print, .toolbar, .side-panel, .gate { display: none !important; }
  .editor-layout { display: block; padding: 0; }
  .doc { display: block; }
  .sheet { display: block; width: auto; max-width: none; min-height: 0; box-shadow: none; background: #fff; font-size: 12px; break-before: page; }
  .sheet-body { padding: 0; }
  .editable:hover, .editable:focus { background: none; box-shadow: none; }
  .sheet-title { break-after: avoid; }
  .sec-eyebrow, .sheet h4 { break-after: avoid; }
  table.t thead { display: table-header-group; }
  table.t tr, .photo, .finding-head, .legend-text { break-inside: avoid; }
  .finding-head { break-after: avoid; }
  .layout-img { max-height: 7in; }
  .sheet.cover { page: cover; break-before: auto; break-after: page; height: 11in; overflow: hidden; background: var(--color-ink); }
  .cover-content { min-height: 0; height: 11in; box-sizing: border-box; padding: 0.9in 0.9in 0.8in; }
  .cover-body { height: 11in; }
}
CSS
npx tsc -b && npm run build
```
Expected: compila y `vite build` termina sin errores de CSS (el `@layer components` queda cerrado una sola vez).

- [ ] **Step 8b: Verificar que el CSS quedó bien formado**

Run: `grep -c "@layer components" src/index.css && npx vite build 2>&1 | tail -3`
Expected: `1` y `✓ built`. Si Tailwind se queja de una llave sin cerrar, contar `{` y `}` de `src/index.css` y corregir el cierre de `@layer components` antes de la sección "Impresión".

- [ ] **Step 9: Correr tests y lint**

Run: `npx vitest run && npm run lint`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: renderizadores genéricos de sección, portada con foto, índice, documento y paginación nativa" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Editor — servicio al inicio, paneles, validación en vivo y emisión

**Files:**
- Modify: `src/EntregaEditor.tsx` (reemplaza el stub)
- Create: `src/components/ServicePicker.tsx`, `Toolbar.tsx`, `HistoryMenu.tsx`, `SidePanel.tsx`, `DataPanel.tsx`, `SectionsPanel.tsx`, `CoverPanel.tsx`, `IssuesPanel.tsx`

**Interfaces:**
- Consumes: `useEntregaStore`, `EntregaDocument`, `validate`, `issueReport`, `SHARED_FIELDS`, `activeSections`, `toggleSection`, `ACCESS_MODE_LABEL`, `ACCESS_MODES`, `SERVICE_LIST`, `getService`.
- Produces: `EntregaEditor({ onAuthExpired })`.

- [ ] **Step 1: `src/components/ServicePicker.tsx`**

```tsx
import { useState } from 'react'
import { SERVICE_LIST } from '../services'
import { ACCESS_MODE_LABEL } from '../lib/access'
import { ACCESS_MODES, type AccessMode } from '../types'
import { Wordmark } from './Wordmark'

interface Props {
  onStart: (serviceId: string, accessMode: AccessMode) => void
  onCancel?: () => void
}

// El tipo de servicio y la modalidad de acceso se eligen al inicio y precargan secciones,
// normativa, textos base y campos propios.
export function ServicePicker({ onStart }: Props) {
  const [serviceId, setServiceId] = useState(SERVICE_LIST[0].id)
  const [mode, setMode] = useState<AccessMode>(SERVICE_LIST[0].defaultAccessMode)

  function pick(id: string) {
    setServiceId(id)
    const def = SERVICE_LIST.find((s) => s.id === id)
    if (def) setMode(def.defaultAccessMode)
  }

  return (
    <main className="picker">
      <Wordmark tone="signal" textClassName="text-[17px]" />
      <h1>Nuevo informe de entrega</h1>
      <p className="hint">Elige el servicio y cómo se accedió al trabajo. Esto precarga las secciones y la normativa.</p>
      <div className="seg" role="group" aria-label="Tipo de servicio">
        {SERVICE_LIST.map((s) => (
          <button key={s.id} type="button" className="svc" aria-pressed={s.id === serviceId} onClick={() => pick(s.id)}>
            <b>{s.label}</b>
            <br />
            <span className="mono">{s.codePrefix}</span>
          </button>
        ))}
      </div>
      <div className="seg" role="group" aria-label="Modalidad de acceso">
        {ACCESS_MODES.map((m) => (
          <button key={m} type="button" aria-pressed={m === mode} onClick={() => setMode(m)}>{ACCESS_MODE_LABEL[m]}</button>
        ))}
      </div>
      <button type="button" className="toolbar-btn" onClick={() => onStart(serviceId, mode)}>Crear informe</button>
    </main>
  )
}
```

- [ ] **Step 2: `src/components/HistoryMenu.tsx`** (copia de `informe_levantamiento` con tipos propios)

```bash
cp ../informe_levantamiento/src/components/HistoryMenu.tsx src/components/HistoryMenu.tsx
sed -i "s#import type { ReportState } from '../types'#import type { EntregaState } from '../types'#; s#report: ReportState#report: EntregaState#; s#(report: ReportState) => void#(report: EntregaState) => void#" src/components/HistoryMenu.tsx
grep -n "ReportState" src/components/HistoryMenu.tsx
```
Expected: el `grep` no imprime nada (no queda ninguna referencia a `ReportState`). Si queda alguna, reemplazarla a mano por `EntregaState`.

- [ ] **Step 3: `src/components/Toolbar.tsx`**

```tsx
import FilePlus from 'reicon-react/icons/FilePlus'
import Printer from 'reicon-react/icons/Printer'
import type { EntregaState } from '../types'
import type { SyncState } from '../lib/api'
import { Logomark } from './Logomark'
import { HistoryMenu } from './HistoryMenu'
import { SyncStatus } from './SyncStatus'

interface Props {
  state: EntregaState
  serviceLabel: string
  syncState: SyncState
  onNew: () => void
  onLoad: (state: EntregaState) => void
}

export function Toolbar({ state, serviceLabel, syncState, onNew, onLoad }: Props) {
  return (
    <div className="toolbar no-print">
      <span className="toolbar-brand">
        <Logomark tone="signal" width={26} height={11} />
        ALTO&nbsp;TEST
      </span>
      <div className="toolbar-group">
        <span className="eyebrow">{serviceLabel}</span>
        {/* El folio es de solo lectura: cambiarlo dejaría huérfano el documento ya guardado. */}
        <span className="mono">{state.code}</span>
        <span className={`pill ${state.status === 'issued' ? 'pill--ok' : 'pill--warn'}`}>{state.status === 'issued' ? 'Emitido · Rev. 0' : 'Borrador'}</span>
      </div>
      <SyncStatus state={syncState} />
      <div className="toolbar-spacer" />
      <HistoryMenu currentCode={state.code} onOpen={onLoad} />
      <button type="button" className="toolbar-btn toolbar-btn--ghost" onClick={onNew}>
        <FilePlus size={14} strokeWidth={2} className="icon" />
        Nuevo
      </button>
      <button type="button" className="toolbar-btn" onClick={() => window.print()} title="Para el PDF con pie de página usa Chrome o Edge">
        <Printer size={14} strokeWidth={2} className="icon" />
        Imprimir / PDF
      </button>
    </div>
  )
}
```

- [ ] **Step 4: `src/components/DataPanel.tsx`** (datos únicos; la carga desde enlaces se agrega en la Tarea 12)

```tsx
import type { EntregaState, SharedData } from '../types'
import { SHARED_FIELDS } from '../lib/fields'
import { formatDateInput, isValidDate } from '../lib/date'

interface Props {
  state: EntregaState
  onChange: (patch: Partial<SharedData>) => void
}

export function DataPanel({ state, onChange }: Props) {
  return (
    <section className="box" aria-labelledby="h-datos">
      <h2 id="h-datos">Datos únicos · se ingresan una vez</h2>
      {SHARED_FIELDS.map(({ key, label }) => {
        const value = state.shared[key]
        const invalid = key === 'executionDate' && value !== '' && !isValidDate(value)
        return (
          <div key={key} className={`field ${invalid ? 'field--error' : ''}`}>
            <label htmlFor={`d-${key}`}>{label}</label>
            <input
              id={`d-${key}`}
              value={value}
              autoComplete="off"
              placeholder={key === 'executionDate' ? 'dd/mm/aaaa' : undefined}
              onChange={(e) => onChange({ [key]: key === 'executionDate' ? formatDateInput(e.target.value) : e.target.value })}
            />
          </div>
        )
      })}
      <p className="hint">Cada dato se propaga a la portada, la identificación, los textos y la emisión.</p>
    </section>
  )
}
```

- [ ] **Step 5: `src/components/SectionsPanel.tsx`**

```tsx
import type { NumberedSection } from '../lib/sections'
import type { SectionDef, ServiceDefinition } from '../services/types'
import { activeSections } from '../lib/sections'

interface Props {
  def: ServiceDefinition
  hidden: string[]
  onToggle: (id: string) => void
}

const GROUP_LABEL = { common: 'Secciones comunes', service: 'Propias de este servicio', closing: 'Cierre' } as const

export function SectionsPanel({ def, hidden, onToggle }: Props) {
  const numbered = new Map<string, NumberedSection>(activeSections(def, hidden).map((n) => [n.section.id, n]))
  let last = ''
  return (
    <section className="box" aria-labelledby="h-sec">
      <h2 id="h-sec">Secciones · ocultables</h2>
      <ul className="toggles">
        {def.sections.map((s: SectionDef) => {
          const n = numbered.get(s.id)
          const heading = s.group !== last ? ((last = s.group), <li className="grp">{GROUP_LABEL[s.group]}</li>) : null
          return (
            <li key={s.id} style={{ display: 'contents' }}>
              {heading}
              <label>
                <span className="n">{n ? String(n.number).padStart(2, '0') : '–'}</span>
                <input type="checkbox" checked={!!n} disabled={s.fixed} onChange={() => onToggle(s.id)} />
                <span>{s.title}{s.fixed ? ' (fija)' : ''}</span>
              </label>
            </li>
          )
        })}
      </ul>
      <p className="hint">Al ocultar una sección, el índice y la numeración se ajustan solos.</p>
    </section>
  )
}
```

- [ ] **Step 6: `src/components/CoverPanel.tsx`**

```tsx
import type { EntregaState } from '../types'
import { PhotoPicker } from './PhotoPicker'

interface Props {
  state: EntregaState
  onChange: (patch: Partial<EntregaState>) => void
}

export function CoverPanel({ state, onChange }: Props) {
  return (
    <section className="box" aria-labelledby="h-cov">
      <h2 id="h-cov">Foto de portada</h2>
      <PhotoPicker label={state.coverPhoto ? 'Cambiar foto del edificio' : 'Subir foto del edificio'} maxDimension={1800} quality={0.82} onPhoto={(coverPhoto) => onChange({ coverPhoto })} />
      <div className="field" style={{ marginTop: 10 }}>
        <label htmlFor="cover-veil">Velo oscuro · {state.coverVeil} %</label>
        <input id="cover-veil" type="range" min={0} max={100} value={state.coverVeil} onChange={(e) => onChange({ coverVeil: Number(e.target.value) })} />
      </div>
      {state.coverPhoto && (
        <button type="button" className="sbtn" onClick={() => onChange({ coverPhoto: undefined })}>Quitar foto</button>
      )}
      <p className="hint">Opcional. Se comprime a 1800 px. Sin foto, la portada usa un fondo de marca.</p>
    </section>
  )
}
```

- [ ] **Step 7: `src/components/IssuesPanel.tsx`**

```tsx
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
          <button type="button" className="toolbar-btn" disabled={blocked || issued} onClick={onIssue}>{issued ? 'Emitido' : 'Emitir informe'}</button>
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
        {blocked ? 'Es un borrador: se puede seguir redactando e imprimir, pero no emitir.' : issued ? 'Si editas algo, el informe vuelve a borrador.' : 'Sin bloqueos: el informe se puede emitir.'}
      </p>
    </div>
  )
}
```

- [ ] **Step 8: `src/components/SidePanel.tsx` y `src/EntregaEditor.tsx`**

`src/components/SidePanel.tsx`:
```tsx
import type { ReactNode } from 'react'

export function SidePanel({ children }: { children: ReactNode }) {
  return <aside className="side-panel no-print">{children}</aside>
}
```

`src/EntregaEditor.tsx`:
```tsx
import { useEffect, useMemo, useState } from 'react'
import { useEntregaStore } from './lib/store'
import { getService } from './services'
import { validate } from './lib/validate'
import { issueReport } from './lib/issuance'
import { toggleSection } from './lib/sections'
import { ACCESS_MODE_LABEL } from './lib/access'
import { ACCESS_MODES, type AccessMode } from './types'
import { ServicePicker } from './components/ServicePicker'
import { Toolbar } from './components/Toolbar'
import { SidePanel } from './components/SidePanel'
import { DataPanel } from './components/DataPanel'
import { SectionsPanel } from './components/SectionsPanel'
import { CoverPanel } from './components/CoverPanel'
import { IssuesPanel } from './components/IssuesPanel'
import { ConfirmDialog } from './components/ConfirmDialog'
import { EntregaDocument } from './components/EntregaDocument'

export default function EntregaEditor({ onAuthExpired }: { onAuthExpired: () => void }) {
  const { state, update, startReport, loadReport, reset, syncState, booting } = useEntregaStore(onAuthExpired)
  const [confirmNew, setConfirmNew] = useState(false)
  const def = useMemo(() => (state ? getService(state.serviceId) : null), [state?.serviceId])
  const issues = useMemo(() => (state && def ? validate(state, def) : []), [state, def])

  // Durante la impresión el título pasa a ser el folio: Chrome lo usa como nombre del PDF.
  useEffect(() => {
    if (!state) return
    const base = document.title
    const before = () => { document.title = state.code }
    const after = () => { document.title = base }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [state?.code])

  if (booting) return <div className="boot-screen">Cargando…</div>
  if (!state || !def) return <ServicePicker onStart={(id, mode) => startReport(id, mode)} />

  return (
    <>
      <Toolbar state={state} serviceLabel={def.label} syncState={syncState} onNew={() => setConfirmNew(true)} onLoad={loadReport} />
      <div className="editor-layout">
        <SidePanel>
          <DataPanel state={state} onChange={(patch) => update((s) => ({ ...s, shared: { ...s.shared, ...patch } }))} />
          <section className="box" aria-labelledby="h-mod">
            <h2 id="h-mod">Modalidad de acceso</h2>
            <div className="seg">
              {ACCESS_MODES.map((m: AccessMode) => (
                <button key={m} type="button" aria-pressed={state.accessMode === m} onClick={() => update((s) => ({ ...s, accessMode: m }))}>{ACCESS_MODE_LABEL[m]}</button>
              ))}
            </div>
            <p className="hint">Cambia el bloque de normativa y el equipo de acceso.</p>
          </section>
          <CoverPanel state={state} onChange={(patch) => update((s) => ({ ...s, ...patch }))} />
          <SectionsPanel def={def} hidden={state.hiddenSections} onToggle={(id) => update((s) => ({ ...s, hiddenSections: toggleSection(s.hiddenSections, def, id) }))} />
        </SidePanel>
        <main>
          <IssuesPanel issues={issues} issued={state.status === 'issued'} onIssue={() => update((s) => issueReport(s, validate(s, def)))} />
          <EntregaDocument state={state} def={def} update={update} />
        </main>
      </div>
      <ConfirmDialog
        open={confirmNew}
        title="Crear un informe nuevo"
        message="El informe actual queda guardado en el Historial. ¿Empezar uno nuevo?"
        confirmLabel="Crear nuevo"
        onConfirm={() => { setConfirmNew(false); reset() }}
        onCancel={() => setConfirmNew(false)}
      />
    </>
  )
}
```

- [ ] **Step 9: Verificar**

Run: `npx tsc -b && npm run lint && npx vitest run && npm run build`
Expected: todo en verde.

- [ ] **Step 10: Verificación manual con el Worker local**

```bash
# terminal 1 (proyecto del Worker, requiere .dev.vars con ACCESS_KEY)
cd ../../altotest-documentos && npm run dev        # http://localhost:8787
# terminal 2
cd ../informes/entrega_servicio_react && sed -i 's#^VITE_REPORTS_ENDPOINT=.*#VITE_REPORTS_ENDPOINT=http://localhost:8787#' .env && npm run dev   # http://localhost:5213
```
Abrir `http://localhost:5213`, entrar con la clave del `.dev.vars` y comprobar a mano: (1) aparece el selector de servicio; (2) crear informe muestra portada, índice y secciones; (3) ocultar una sección renumera el índice; (4) editar cliente actualiza portada e identificación; (5) el panel "Antes de emitir" muestra bloqueos; (6) abrir y cerrar la app sin editar no crea un documento en `GET /reports/entrega`. Anotar cualquier diferencia antes de seguir.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: editor con servicio al inicio, datos únicos, secciones ocultables, validación en vivo y emisión" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Compuertas automáticas de PDF

**Files:**
- Create: `src/fixtures/index.ts`, `src/FixtureApp.tsx`, `scripts/print-gates.mjs`, `scripts/pdf_gates.py`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `EntregaDocument`, `initialState`, `fillTemplate`-equivalente (se reimplementa para fixtures sin importar `test/`), `getService`.
- Produces:
  - `fixtures/index.ts`: `FIXTURE_NAMES`, `getFixture(name): { state: EntregaState; def: ServiceDefinition }`.
  - `npm run test:pdf`: genera un PDF por fixture y falla si alguna compuerta no pasa.

- [ ] **Step 1: `src/fixtures/index.ts`**

```ts
import type { EntregaState, Finding } from '../types'
import type { ServiceDefinition } from '../services/types'
import { getService } from '../services'
import { initialState } from '../lib/template'
import { generateId } from '../lib/code'

// Imagen de relleno en SVG (se imprime como cualquier <img>): evita depender de archivos.
const svg = (label: string, w = 1200, h = 900) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#6c8794"/><rect x="40" y="40" width="${w - 80}" height="${h - 80}" fill="none" stroke="#f4f5f2" stroke-width="6"/><text x="${w / 2}" y="${h / 2}" font-size="64" text-anchor="middle" fill="#f4f5f2" font-family="monospace">${label}</text></svg>`)}`

const photo = (n: number, caption: string) => ({ id: generateId(), dataUrl: svg(`Foto ${n}`), caption })

const finding = (n: number, photos: number, severity: Finding['severity']): Finding => ({
  id: generateId(), location: `Fachada poniente · piso ${10 + n}`, severity,
  description: `Hallazgo ${n}: condición detectada en terreno que no formaba parte del trabajo contratado. Texto largo para que ocupe varias líneas dentro de la tarjeta.`,
  recommendation: 'Reemplazar el elemento afectado y balizar la zona inferior hasta su cambio.',
  immediateRisk: n % 2 === 1, commercialOpportunity: true,
  photos: Array.from({ length: photos }, (_, i) => photo(n * 10 + i, `Hallazgo ${n} · vista ${i + 1}`)),
})

// Rellena todo lo obligatorio de una definición con datos de prueba (los textos con vigencia llevan una futura).
function complete(state: EntregaState, def: ServiceDefinition): EntregaState {
  const values: Record<string, string> = {}
  for (const s of def.sections) {
    if (s.kind === 'facts') {
      s.facts.forEach((f, i) => { if (f.value === '') values[`${s.id}.fact${i}`] = f.validity ? 'N.º 4521 · vigente hasta 12.03.2027' : `Dato de ${f.label}` })
      values[`${s.id}.conclusion`] = 'Resultado conforme respecto del criterio de aceptación definido para el proyecto.'
    }
    if (s.kind === 'annexes') s.annexes.forEach((a, i) => { if (a.hasValidity) values[`${s.id}.annex${i}.validity`] = 'vigente hasta 15.01.2027' })
  }
  const tables = Object.fromEntries(
    Object.entries(state.tables).map(([id, rows]) => [id, rows.map((r, ri) => r.map((c, ci) => (c === '' ? `Fila ${ri + 1} dato ${ci + 1}` : c)))]),
  )
  return {
    ...state, values, tables,
    shared: { ...state.shared, client: 'DAG MS', asset: 'Comunidad Ranco', address: 'Luis Carrera #1289, Vitacura', contact: 'Administración · contacto@ranco.cl', executionDate: '17/09/2026' },
    layoutImage: svg('Layout de puntos', 1600, 900),
  }
}

const base = (id: string) => ({ def: getService(id), state: initialState(id, new Date(2026, 8, 17, 10, 15, 0)) })

export const FIXTURE_NAMES = ['ranco', 'minimal', 'stress'] as const
export type FixtureName = (typeof FIXTURE_NAMES)[number]

export function getFixture(name: string): { state: EntregaState; def: ServiceDefinition } {
  switch (name) {
    case 'ranco': {
      const { def, state } = base('anchors')
      return {
        def,
        state: {
          ...complete(state, def),
          coverPhoto: svg('Foto de portada', 1800, 2400),
          photos: Array.from({ length: 6 }, (_, i) => photo(i + 1, `Registro ${i + 1}`)),
          findings: [finding(1, 2, 'needs_action'), finding(2, 1, 'critical'), finding(3, 3, 'observation')],
        },
      }
    }
    case 'minimal': {
      // Todo lo ocultable oculto: queda portada, índice, identificación y emisión.
      const { def, state } = base('anchors')
      const hidden = def.sections.filter((s) => !s.fixed).map((s) => s.id)
      return { def, state: { ...complete(state, def), hiddenSections: hidden } }
    }
    case 'stress': {
      // Tabla de 70 filas, cadena de 300 caracteres sin espacios en un campo, 6 fotos y hallazgos con fotos grandes.
      const { def: anchors, state } = base('anchors')
      const longRows = Array.from({ length: 70 }, (_, i) => [String(i + 1).padStart(2, '0'), `Actividad ${i + 1} con un texto algo más largo para envolver${i % 9 === 0 ? ' y mucho más texto de relleno para forzar dos líneas en esta fila puntual del cuadro' : ''}`, String(i + 3), 'Conforme'])
      const def: ServiceDefinition = { ...anchors, sections: anchors.sections.map((s) => (s.id === 'scope' && s.kind === 'table' ? { ...s, rows: longRows } : s)) }
      const completed = complete({ ...state, tables: { ...state.tables, scope: longRows } }, def)
      return {
        def,
        state: {
          ...completed,
          values: { ...completed.values, 'tests.conclusion': 'U'.repeat(300) },
          photos: Array.from({ length: 6 }, (_, i) => photo(i + 1, `Registro ${i + 1}`)),
          findings: [finding(1, 6, 'critical')],
        },
      }
    }
    default:
      throw new Error(`Fixture desconocido: ${name}`)
  }
}
```

- [ ] **Step 2: `src/FixtureApp.tsx` y `main.tsx`**

`src/FixtureApp.tsx`:
```tsx
import { EntregaDocument } from './components/EntregaDocument'
import { getFixture } from './fixtures'

// Solo se carga en el build de pruebas (VITE_FIXTURES=1): renderiza el documento solo-lectura,
// sin barra, sin paneles y sin hablar con el Worker.
export default function FixtureApp({ name }: { name: string }) {
  const { state, def } = getFixture(name)
  return <EntregaDocument state={state} def={def} readOnly />
}
```

`src/main.tsx` (reemplaza el contenido):
```tsx
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
```

- [ ] **Step 3: `scripts/print-gates.mjs`**

```js
// Genera el PDF real de cada fixture con Chromium y corre las compuertas de scripts/pdf_gates.py.
import { chromium } from 'playwright'
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const PORT = 4173
const FIXTURES = ['ranco', 'minimal', 'stress']
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
  const browser = await chromium.launch()
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
        chunks: [...document.querySelectorAll('.sheet .editable, .sheet-title, .sheet td, .sheet dd, .sheet p')].map(text).filter((t) => t.length > 3),
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
```

- [ ] **Step 4: `scripts/pdf_gates.py`**

```python
"""Compuertas sobre el PDF real. Uso: pdf_gates.py <pdf> <manifest.json> <nombre>."""
import json, re, sys, unicodedata
import pypdfium2 as pdfium
from pypdf import PdfReader

pdf_path, manifest_path, name = sys.argv[1:4]
manifest = json.load(open(manifest_path, encoding="utf-8"))
reader = PdfReader(pdf_path)
doc = pdfium.PdfDocument(pdf_path)
errors = []

def squash(s):
    # NFKC deshace ligaduras (ﬁ → fi); sin espacios para tolerar cortes de línea dentro de una palabra.
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", s))

FOOTER = re.compile(r"ALTO\s*TEST\s*·\s*EN-\d{8}-\d{6}|Página\s*\d+\s*de\s*\d+")
pages = [(p.extract_text() or "") for p in reader.pages]
n = len(pages)

# 1. Todas las hojas son Carta vertical.
for i, p in enumerate(reader.pages, 1):
    w, h = float(p.mediabox.width) / 72, float(p.mediabox.height) / 72
    if abs(w - 8.5) > 0.02 or abs(h - 11) > 0.02:
        errors.append(f"hoja {i}: {w:.2f}x{h:.2f} in (se esperaba 8.50x11.00)")

# 2. Ninguna hoja en blanco, y la portada sale a sangre (esquinas oscuras).
for i in range(n):
    img = doc[i].render(scale=0.5).to_pil().convert("L")
    w, h = img.size
    px = img.load()
    body = int(h * 0.88)  # sin la zona del pie
    rows = sum(1 for y in range(body) if any(px[x, y] < 200 for x in range(0, w, 3)))
    if rows < 5:
        errors.append(f"hoja {i + 1}: en blanco ({rows} filas con tinta)")
    if i == 0:
        corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
        if any(c > 110 for c in corners):
            errors.append(f"portada: no sale a sangre (esquinas {corners})")

# 3. Pie "Página n de N" correcto en todas las hojas menos la portada; la portada no lleva pie.
for i, text in enumerate(pages, 1):
    squashed = squash(text)
    expected = squash(f"Página {i} de {n}")
    if i == 1 and "Página" in text:
        errors.append("portada: lleva pie y no debería")
    if i > 1 and expected not in squashed:
        errors.append(f"hoja {i}: falta el pie 'Página {i} de {n}'")
    if i > 1 and squash("ALTO TEST · EN-") not in squashed:
        errors.append(f"hoja {i}: falta 'ALTO TEST · folio' en el pie")

body_pages = [squash(FOOTER.sub("", t)) for t in pages]
full = "".join(body_pages)

# 4. Todo el texto del documento aparece en el PDF (nada recortado).
missing = [c for c in manifest["chunks"] if squash(c) not in full]
if missing:
    errors.append(f"{len(missing)} fragmento(s) de texto no aparecen en el PDF, p. ej. {missing[0][:60]!r}")

# 5. Cada sección visible empieza en una hoja propia y en orden.
last = 0
for title in manifest["titles"]:
    idx = next((k for k, t in enumerate(body_pages, 1) if squash(title) in t and k > last), None)
    if idx is None:
        errors.append(f"la sección «{title}» no empieza en una hoja nueva posterior a la anterior")
        break
    last = idx

# 6. Ninguna fila de tabla ni cabecera de hallazgo (con su primera foto) queda partida entre hojas.
for group in manifest["groups"]:
    if not any(all(squash(part) in page for part in group) for page in body_pages):
        errors.append(f"queda partido entre hojas: {group[0][:50]!r}")

if errors:
    print(f"✗ {name}: {len(errors)} problema(s)")
    for e in errors:
        print("   -", e)
    sys.exit(1)
print(f"✓ {name}: {n} hojas · Carta vertical · sin hojas en blanco · pie correcto · texto completo · sin filas partidas")
```

- [ ] **Step 5: Preparar el entorno de las compuertas**

```bash
python3 -m venv .venv-gates
.venv-gates/bin/pip install pypdf pypdfium2 pillow
```

- [ ] **Step 6: Correr las compuertas**

Run: `npm run test:pdf`
Expected: tres líneas `✓ ranco …`, `✓ minimal …`, `✓ stress …` y código de salida 0. `minimal` debe tener 4 hojas (portada, índice, identificación, emisión).

Si una compuerta falla, **arreglar la causa, no la compuerta**. Fallas esperables y su causa:
- `scrollWidth > 816`: algún elemento sin `overflow-wrap`; revisar que `.editable`, `td` y `body` lo lleven.
- `portada: no sale a sangre`: falta `print-color-adjust: exact`, o `@page cover` no se aplica (revisar que el `<section class="sheet cover">` tenga `page: cover` dentro de `@media print`).
- `queda partido entre hojas`: falta `break-inside: avoid` en `tr` o `.finding-head`.
- `falta el pie`: el navegador no es Chromium reciente, o `PrintStyles` no se renderizó.

- [ ] **Step 7: Revisión visual de una hoja**

```bash
.venv-gates/bin/python -I -c "
import pypdfium2 as pdfium
d = pdfium.PdfDocument('out/ranco.pdf')
for i in (0, 4, len(d) - 3):
    d[i].render(scale=0.7).to_pil().save(f'out/ranco_p{i+1}.png')
"
```
Abrir `out/ranco_p1.png` (portada), una hoja de hallazgos y el plano, y confirmar a ojo que se ven como la maqueta aprobada.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: compuertas automáticas de PDF (tamaño, hojas en blanco, pie, texto completo, filas partidas)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Servicios de limpieza de vidrios y reposición de sellos

**Files:**
- Create: `src/services/glass.ts`, `src/services/seals.ts`
- Modify: `src/services/index.ts`, `src/fixtures/index.ts`, `scripts/print-gates.mjs`
- Test: `src/services/services.test.ts` (el test genérico ya los cubre en cuanto se registran)

**Interfaces:**
- Consumes: fábricas de `common.ts`, `GENERAL_NORMATIVE` de `normative.ts`.
- Produces: `glass`, `seals` (`ServiceDefinition`), registrados en `SERVICES`.

- [ ] **Step 1: Registrar y ver que el test genérico los exige**

Editar `src/services/index.ts`:
```ts
import { anchors } from './anchors'
import { glass } from './glass'
import { seals } from './seals'
import type { ServiceDefinition } from './types'

// Agregar un servicio = escribir su archivo de definición y sumarlo acá.
export const SERVICES: Record<string, ServiceDefinition> = { anchors, glass, seals }
export const SERVICE_LIST: ServiceDefinition[] = Object.values(SERVICES)

export function getService(id: string): ServiceDefinition {
  const def = SERVICES[id]
  if (!def) throw new Error(`Servicio desconocido: ${id}`)
  return def
}
```
Run: `npx vitest run src/services`
Expected: FAIL — `Failed to resolve import "./glass"`.

- [ ] **Step 2: `src/services/glass.ts`**

```ts
import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection, issuanceSection,
  maintenanceSection, normativeSection, photosSection, scopeSection,
} from './common'
import { GENERAL_NORMATIVE } from './normative'
import type { ServiceDefinition } from './types'

// Borrador a validar por Alto Test (secciones, textos base y plan de mantención). Los textos no
// afirman resultados; los datos del trabajo quedan vacíos para que los llene quien ejecutó.
export const glass: ServiceDefinition = {
  id: 'glass',
  label: 'Limpieza de vidrios',
  codePrefix: 'AT-R-VID',
  defaultAccessMode: 'suspended_platform',
  title: 'Limpieza de fachadas vidriadas',
  intro:
    'Dejar constancia de la limpieza de fachadas vidriadas ejecutada en {{asset}}, con detalle de los sectores intervenidos, el método de acceso y la condición final de los paños.',
  normative: [
    ...GENERAL_NORMATIVE,
    { id: 'ansi-iwca', text: 'ANSI/IWCA I-14.1 · Seguridad en la limpieza de ventanas (referencia internacional)', status: 'to_validate' },
  ],
  sections: [
    identificationSection(),
    normativeSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Limpieza de vidrios de fachada', '', ''],
      ['02', 'Limpieza de marcos y perfiles de aluminio', '', ''],
      ['03', 'Retiro de residuos en antepechos', '', ''],
    ]),
    {
      id: 'sectors', title: 'Sectores intervenidos', group: 'service', kind: 'table',
      columns: [{ label: 'Sector' }, { label: 'Paños', width: '14%' }, { label: 'Superficie', width: '18%' }, { label: 'Estado final', width: '22%' }],
      rows: [['', '', '', '']],
    },
    {
      id: 'equipment', title: 'Equipos y productos', group: 'service', kind: 'facts',
      facts: [
        { label: 'Producto limpiador', value: '', hint: 'Producto y dilución utilizados' },
        { label: 'Herramientas', value: '', hint: 'Rasquetas, mopas, lavavidrios…' },
        { label: 'Personal en terreno', value: '', hint: 'Cantidad de operadores y supervisor' },
        { label: 'Equipo de acceso', value: '{{accessEquipment}}' },
      ],
      conclusionHint: 'Condición final de los paños y observaciones del trabajo',
    },
    photosSection(),
    maintenanceSection([
      ['3 meses', 'Limpieza de fachadas expuestas', 'Sectores con mayor exposición a polvo y tráfico.'],
      ['6 meses', 'Limpieza integral', 'Todos los sectores, marcos y antepechos.'],
      ['12 meses', 'Inspección de sellos y marcos', 'Revisión visual de sellos y fijaciones.'],
    ]),
    annexesSection([
      { letter: 'A', title: 'Fichas técnicas de los productos utilizados', hasValidity: false },
      { letter: 'B', title: 'Credenciales del personal de altura', hasValidity: true },
    ]),
    findingsSection(),
    issuanceSection(),
  ],
}
```

- [ ] **Step 3: `src/services/seals.ts`**

```ts
import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection, issuanceSection,
  maintenanceSection, normativeSection, photosSection, scopeSection,
} from './common'
import { GENERAL_NORMATIVE } from './normative'
import type { ServiceDefinition } from './types'

// Borrador a validar por Alto Test. La duración de la prueba de riego NO se inventa: queda vacía
// hasta que se fije con AAMA 501.2 u otro procedimiento propio.
export const seals: ServiceDefinition = {
  id: 'seals',
  label: 'Reposición de sellos',
  codePrefix: 'AT-R-SEL',
  defaultAccessMode: 'rope',
  title: 'Reposición de sellos de fachada',
  intro:
    'Registrar la reposición de sellos ejecutada en {{asset}}: ubicación, tipo de sellante, longitudes intervenidas y pruebas de estanqueidad posteriores.',
  normative: [
    ...GENERAL_NORMATIVE,
    { id: 'astm-c920', text: 'ASTM C920 / ISO 11600 · Selladores elastoméricos para juntas de construcción', status: 'to_validate' },
    { id: 'en-15651-2', text: 'EN 15651-2:2017 · Selladores de acristalamiento de uso no estructural', status: 'to_validate' },
    { id: 'astm-c1193', text: 'ASTM C1193 · Guía para el uso de selladores de juntas', status: 'to_validate' },
    { id: 'aama-501-2', text: 'AAMA 501.2 · Prueba de riego en terreno para muros cortina y fachadas', status: 'to_validate' },
    { id: 'astm-c1521', text: 'ASTM C1521 · Evaluación de adherencia de selladores instalados', status: 'to_validate' },
  ],
  sections: [
    identificationSection(),
    normativeSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Retiro de sellos degradados en fachada', '', ''],
      ['02', 'Limpieza y preparación de juntas', '', ''],
      ['03', 'Aplicación de sellante', '', ''],
    ]),
    {
      id: 'replaced', title: 'Sellos repuestos', group: 'service', kind: 'table',
      columns: [{ label: 'Ubicación' }, { label: 'Tipo de sello', width: '26%' }, { label: 'Longitud', width: '14%' }, { label: 'Curado / control', width: '24%' }],
      rows: [['', '', '', '']],
    },
    {
      id: 'watertightness', title: 'Pruebas de estanqueidad', group: 'service', kind: 'facts',
      facts: [
        { label: 'Método', value: '', hint: 'Por ejemplo riego controlado sobre la junta' },
        { label: 'Duración por tramo', value: '', hint: 'Según el protocolo definido (AAMA 501.2 u otro)' },
        { label: 'Tramos evaluados', value: '', hint: 'Cantidad de tramos probados' },
        { label: 'Resultado', value: '', hint: 'Resultado observado en cada tramo' },
      ],
      conclusionHint: 'Resultado de las pruebas una vez cumplido el tiempo de curado',
    },
    photosSection(),
    maintenanceSection([
      ['6 meses', 'Inspección visual de sellos', 'Revisión de adherencia y grietas.'],
      ['12 meses', 'Prueba de estanqueidad', 'Muestreo de juntas críticas.'],
    ]),
    annexesSection([
      { letter: 'A', title: 'Ficha técnica y lote del sellante', hasValidity: true },
      { letter: 'B', title: 'Garantía de aplicación', hasValidity: false },
    ]),
    findingsSection(),
    issuanceSection(),
  ],
}
```

- [ ] **Step 4: Correr tests (el genérico ahora cubre los 3 servicios)**

Run: `npx vitest run && npx tsc -b`
Expected: PASS. Los tests `describe.each` corren una vez por servicio.

- [ ] **Step 5: Agregar fixtures y compuertas para los dos servicios**

En `src/fixtures/index.ts`: cambiar `FIXTURE_NAMES` a `['ranco', 'minimal', 'stress', 'glass', 'seals'] as const` y agregar antes del `default:` del `switch`:

```ts
    case 'glass':
    case 'seals': {
      const id = name === 'glass' ? 'glass' : 'seals'
      const { def, state } = base(id)
      return {
        def,
        state: {
          ...complete(state, def),
          accessMode: id === 'glass' ? 'suspended_platform' : 'rope',
          values: { ...complete(state, def).values, 'equipment.fact3': 'Carro colgante · N.º de serie CC-204' },
          photos: Array.from({ length: 4 }, (_, i) => photo(i + 1, `Registro ${i + 1}`)),
          findings: [finding(1, 2, 'critical'), finding(2, 1, 'observation')],
        },
      }
    }
```
En `scripts/print-gates.mjs`: `const FIXTURES = ['ranco', 'minimal', 'stress', 'glass', 'seals']`.

- [ ] **Step 6: Correr las compuertas de PDF de los 5 fixtures**

Run: `npm run test:pdf`
Expected: cinco líneas `✓`. Si `seals` o `glass` fallan por texto de plantilla, no es de las compuertas de PDF (no validan eso): revisar `src/lib/validate.test.ts` y agregar un test que cargue cada servicio con `fillTemplate` y confirme `hasBlocks === false`:

```ts
// agregar a src/lib/validate.test.ts
import { SERVICE_LIST } from '../services'

describe.each(SERVICE_LIST.map((d) => [d.id, d] as const))('servicio %s completo', (id, d) => {
  it('un documento completo no tiene bloqueos', () => {
    const s = fillTemplate(initialState(id, new Date(2026, 8, 17)), d)
    // Los marcadores del carro colgante son intencionales: se prueban en su propio test.
    const blocks = validate({ ...s, accessMode: 'ground' }, d).filter((i) => i.level === 'block')
    expect(blocks).toEqual([])
  })
})
```
Run: `npx vitest run` → Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: servicios de limpieza de vidrios y reposición de sellos como definiciones" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Trazabilidad — precarga desde levantamiento y cotización

**Files:**
- Create: `src/lib/links.ts`
- Modify: `src/components/DataPanel.tsx`
- Test: `src/lib/links.test.ts`

**Interfaces:**
- Consumes: `SharedData`, `fetchLinked(kind, code)`.
- Produces:
  - `links.ts`: `fromQuote(doc: unknown): Partial<SharedData>`, `fromSurvey(doc: unknown): Partial<SharedData>`, `mergeLinked(shared: SharedData, ...sources: Partial<SharedData>[]): SharedData`.

Los modelos reales leídos del código de las otras apps el 2026-10-13:
- Cotización (`propuesta_economica_react/src/types.ts`, `QuoteState`): `clientName`, `assetName`, `address`, `email`, `phone`.
- Levantamiento (`informe_levantamiento/src/types.ts`, `ReportState`): `clientName`, `clientAsset`, `clientContact`.

- [ ] **Step 1: Tests (fallan)**

`src/lib/links.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { emptyShared } from './template'
import { fromQuote, fromSurvey, mergeLinked } from './links'

describe('adaptadores', () => {
  it('fromQuote toma cliente, activo, dirección y contacto de la cotización', () => {
    expect(fromQuote({ clientName: 'DAG MS', assetName: 'Comunidad Ranco', address: 'Luis Carrera #1289', email: 'a@b.cl', phone: '+56 9 1234 5678' })).toEqual({
      client: 'DAG MS', asset: 'Comunidad Ranco', address: 'Luis Carrera #1289', contact: 'a@b.cl · +56 9 1234 5678',
    })
  })
  it('fromQuote omite lo que falta y tolera un documento raro', () => {
    expect(fromQuote({ clientName: 'X' })).toEqual({ client: 'X' })
    expect(fromQuote(null)).toEqual({})
    expect(fromQuote('basura')).toEqual({})
    expect(fromQuote({ clientName: 42 })).toEqual({})
  })
  it('fromSurvey toma cliente, activo y contacto del levantamiento', () => {
    expect(fromSurvey({ clientName: 'DAG MS', clientAsset: 'Comunidad Ranco', clientContact: 'Admin' })).toEqual({
      client: 'DAG MS', asset: 'Comunidad Ranco', contact: 'Admin',
    })
  })
})

describe('mergeLinked', () => {
  it('rellena solo lo que está vacío y nunca pisa lo que la persona escribió', () => {
    const shared = { ...emptyShared(), client: 'Escrito a mano' }
    const merged = mergeLinked(shared, { client: 'De la cotización', asset: 'Torre A' })
    expect(merged.client).toBe('Escrito a mano')
    expect(merged.asset).toBe('Torre A')
  })
  it('la primera fuente tiene prioridad sobre la segunda (cotización antes que levantamiento)', () => {
    const merged = mergeLinked(emptyShared(), { asset: 'Cotización' }, { asset: 'Levantamiento', contact: 'Admin' })
    expect(merged.asset).toBe('Cotización')
    expect(merged.contact).toBe('Admin')
  })
  it('no toca los datos del emisor ni los códigos', () => {
    const shared = { ...emptyShared(), issuerName: 'Camilo Jara', quoteCode: 'COT-1' }
    const merged = mergeLinked(shared, { client: 'X' })
    expect(merged.issuerName).toBe('Camilo Jara')
    expect(merged.quoteCode).toBe('COT-1')
  })
})
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run src/lib/links.test.ts`
Expected: FAIL — `Failed to resolve import "./links"`.

- [ ] **Step 3: `src/lib/links.ts`**

```ts
import type { SharedData } from '../types'

type Linked = Partial<Pick<SharedData, 'client' | 'asset' | 'address' | 'contact'>>

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)

function pick(entries: [keyof Linked, string | undefined][]): Linked {
  const out: Linked = {}
  for (const [key, value] of entries) if (value !== undefined) out[key] = value
  return out
}

// Adaptadores tolerantes: un campo que no exista o no sea texto se omite, nunca lanza.
export function fromQuote(doc: unknown): Linked {
  if (!doc || typeof doc !== 'object') return {}
  const d = doc as Record<string, unknown>
  const contact = [str(d.email), str(d.phone)].filter(Boolean).join(' · ') || undefined
  return pick([['client', str(d.clientName)], ['asset', str(d.assetName)], ['address', str(d.address)], ['contact', contact]])
}

export function fromSurvey(doc: unknown): Linked {
  if (!doc || typeof doc !== 'object') return {}
  const d = doc as Record<string, unknown>
  return pick([['client', str(d.clientName)], ['asset', str(d.clientAsset)], ['contact', str(d.clientContact)]])
}

// Rellena solo lo que está vacío (lo escrito a mano manda). La primera fuente tiene prioridad.
export function mergeLinked(shared: SharedData, ...sources: Linked[]): SharedData {
  const merged = { ...shared }
  for (const source of sources) {
    for (const key of ['client', 'asset', 'address', 'contact'] as const) {
      if (merged[key].trim() === '' && source[key]) merged[key] = source[key]!
    }
  }
  return merged
}
```
Run: `npx vitest run src/lib/links.test.ts` → Expected: PASS.

- [ ] **Step 4: Botón "Cargar datos" en `DataPanel`**

Reemplazar `src/components/DataPanel.tsx` por:
```tsx
import { useState } from 'react'
import type { EntregaState, SharedData } from '../types'
import { SHARED_FIELDS } from '../lib/fields'
import { formatDateInput, isValidDate } from '../lib/date'
import { ApiError, fetchLinked } from '../lib/api'
import { fromQuote, fromSurvey, mergeLinked } from '../lib/links'

interface Props {
  state: EntregaState
  onChange: (patch: Partial<SharedData>) => void
  onMerge: (merge: (shared: SharedData) => SharedData) => void
}

export function DataPanel({ state, onChange, onMerge }: Props) {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  // Lee la cotización y/o el levantamiento enlazados y precarga cliente, activo, dirección y contacto.
  async function loadLinked() {
    const { quoteCode, surveyCode } = state.shared
    if (!quoteCode.trim() && !surveyCode.trim()) return void setStatus('Escribe el código de la cotización o del levantamiento.')
    setLoading(true)
    setStatus('')
    const messages: string[] = []
    const sources: Partial<SharedData>[] = []
    for (const [kind, code, adapt, label] of [
      ['economica', quoteCode.trim(), fromQuote, 'la cotización'],
      ['informe', surveyCode.trim(), fromSurvey, 'el levantamiento'],
    ] as const) {
      if (!code) continue
      try {
        sources.push(adapt(await fetchLinked(kind, code)))
        messages.push(`Datos de ${label} cargados.`)
      } catch (e) {
        messages.push(e instanceof ApiError && e.status === 404 ? `No existe ${label} ${code}.` : `No se pudo leer ${label}. Completa a mano.`)
      }
    }
    if (sources.length) onMerge((shared) => mergeLinked(shared, ...sources))
    setStatus(messages.join(' '))
    setLoading(false)
  }

  return (
    <section className="box" aria-labelledby="h-datos">
      <h2 id="h-datos">Datos únicos · se ingresan una vez</h2>
      {SHARED_FIELDS.map(({ key, label }) => {
        const value = state.shared[key]
        const invalid = key === 'executionDate' && value !== '' && !isValidDate(value)
        return (
          <div key={key} className={`field ${invalid ? 'field--error' : ''}`}>
            <label htmlFor={`d-${key}`}>{label}</label>
            <input
              id={`d-${key}`}
              value={value}
              autoComplete="off"
              placeholder={key === 'executionDate' ? 'dd/mm/aaaa' : undefined}
              onChange={(e) => onChange({ [key]: key === 'executionDate' ? formatDateInput(e.target.value) : e.target.value })}
            />
          </div>
        )
      })}
      <button type="button" className="sbtn" disabled={loading} onClick={() => void loadLinked()}>
        {loading ? 'Cargando…' : 'Cargar datos de los códigos enlazados'}
      </button>
      {status && <p className="hint" role="status">{status}</p>}
      <p className="hint">Cada dato se propaga a la portada, la identificación, los textos y la emisión. Lo que ya escribiste no se pisa.</p>
    </section>
  )
}
```

En `src/EntregaEditor.tsx` pasar el nuevo prop:
```tsx
<DataPanel
  state={state}
  onChange={(patch) => update((s) => ({ ...s, shared: { ...s.shared, ...patch } }))}
  onMerge={(merge) => update((s) => ({ ...s, shared: merge(s.shared) }))}
/>
```

- [ ] **Step 5: Verificar**

Run: `npx tsc -b && npm run lint && npx vitest run && npm run build`
Expected: todo en verde.

- [ ] **Step 6: Verificación manual con el Worker local**

Con los dos Workers/apps de las Tareas 9 y con un documento de cotización guardado en `kind=economica` (puedes crearlo con `curl -X PUT http://localhost:8787/reports/economica/COT-TEST -H "Authorization: Bearer <clave>" -H "Content-Type: application/json" -d '{"code":"COT-TEST","client":"X","date":"01/01/2026","doc":{"clientName":"DAG MS","assetName":"Comunidad Ranco","address":"Luis Carrera #1289","email":"a@b.cl","phone":"+56 9 1234 5678"}}'`), escribir `COT-TEST` en "Cotización enlazada", pulsar el botón y comprobar que se precargan cliente, activo, ubicación y contacto, y que un código inexistente muestra "No existe la cotización …".

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: trazabilidad con levantamiento y cotización: precarga de cliente, activo y contacto" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Documentación del proyecto y verificación final

**Files:**
- Create: `CLAUDE.md`
- Modify: `/home/meraki/altotest/CONTEXTO.md`, `docs/superpowers/specs/2026-10-13-entrega-servicio-design.md`

- [ ] **Step 1: `CLAUDE.md` del proyecto**

Crear `CLAUDE.md` con estas secciones (contenido real, mismo formato que los `CLAUDE.md` hermanos: qué es, stack, decisiones, invariantes, cómo verificar):

```markdown
# CLAUDE.md — Informe de Entrega de Servicio (Alto Test)

## Qué es
Plantilla única de informe de entrega de servicio. El tipo de servicio (anclajes, limpieza de vidrios, reposición de sellos) es una **definición de datos** (`src/services/`), no código nuevo. Spec: `docs/superpowers/specs/2026-10-13-entrega-servicio-design.md`. Plan: `docs/superpowers/plans/2026-10-13-entrega-servicio.md`.

## Stack y comandos
Vite 8 + React 19 + TS + Tailwind v4, `reicon-react`, Worker compartido `altotest-documentos` (`kind=entrega`). Puerto de dev **5213**.
npm run dev | build | lint | test (Vitest, lógica pura) | test:pdf (compuertas de PDF reales con Chromium)

## Cómo agregar un servicio
1. Crear `src/services/<id>.ts` con una `ServiceDefinition` usando las fábricas de `common.ts`.
2. Sumarlo a `src/services/index.ts`.
3. Agregar un fixture en `src/fixtures/index.ts` y su nombre en `scripts/print-gates.mjs`.
4. `npm test` (el test genérico exige ids únicos, variables conocidas y cero marcadores `[…]`) y `npm run test:pdf`.
Si un servicio necesita un tipo de sección nuevo, se agrega el tipo en `services/types.ts` + un renderizador en `components/sections/` (una vez para todos).

## Decisiones de Matías (no revertir sin pedirlo)
- Oportunidades comerciales solo informadas en el documento, sin automatización. El campo `commercialOpportunity` queda estructurado para exportar después.
- Vigencias = texto; vencida avisa, nunca bloquea.
- Máximo 6 fotos en total en el registro del servicio y 6 en total en hallazgos. La foto de portada no cuenta.
- Sin registro de firmas ni tabla de revisiones: sección final «Emisión» con una sola persona, siempre Rev. 0.
- Editar un informe emitido lo devuelve a borrador.
- Documento Carta vertical. Pie distinto al del informe de levantamiento (línea fina + «Página n de N»).

## Invariantes
1. `lib/sections.ts` es el único lugar que numera secciones.
2. Todo texto editable usa `EditableText` (`.editable`, `overflow-wrap: anywhere`). **Una sola cadena larga sin espacios puede encoger todo el PDF** si el documento se ensancha (probado: ~50 %).
3. **Paginación nativa**: no se mide nada en JS. `@page` + cajas de margen para el pie; cada sección con `break-before: page`. Las reglas de impresión van fuera de `@layer`.
4. Un texto base nunca afirma un resultado; los datos propios del trabajo quedan vacíos y el validador bloquea si faltan. Sin marcadores `[…]` en las definiciones.
5. `lib/api.ts` es el único lugar que le habla al Worker. La clave de acceso nunca va en una `VITE_*`.
6. Un valor de KV admite 25 MB: `assertWithinSizeLimit` corta antes de enviar.
7. `EditableText` solo llama `onChange` si el texto cambió (si no, pasar el cursor por un informe emitido lo devolvería a borrador).
8. El folio es de solo lectura.

## Requisito de navegador
El pie «Página n de N» usa cajas de margen de `@page` (Chrome/Edge recientes; probado con Chromium 153). En Firefox o Safari el documento sale correcto pero sin pie.

## Pendientes conocidos
- Normativa de vidrios y sellos: propuesta del Anexo A del spec, todo «por validar» hasta que Alto Test la confirme.
- Contenido de vidrios y sellos (secciones, textos, plan de mantención): borrador.
- Cargo de quien emite (`DEFAULT_ISSUER` en `services/common.ts`): el Dossier de Ranco traía dos cargos distintos.
- Despliegue: repo en GitHub y proyecto en Vercel con `VITE_REPORTS_ENDPOINT` (pendiente de confirmación de Matías).
```

- [ ] **Step 2: Actualizar el mapa `CONTEXTO.md`**

En `/home/meraki/altotest/CONTEXTO.md`, en la sección 2 (`informes/`) agregar la línea `│   └── entrega_servicio_react/` (y ajustar el conector `├──` de `informe_levantamiento`), y en la sección 3 agregar:

```markdown
### informes/entrega_servicio_react
Plantilla única de **informe de entrega de servicio** (anclajes, limpieza de vidrios, reposición de sellos). Cada servicio es una definición de datos; secciones ocultables con numeración automática, datos únicos, hallazgos fuera de alcance, validación antes de emitir y PDF Carta vertical con paginación nativa. Worker compartido con `kind=entrega`. Ver su `CLAUDE.md`.
```
También en la sección 4 sumar `entrega` a la lista de `kind` del Worker compartido (`informe`, `economica`, `tecnica`, `entrega`) y anotar que comparte la cuota de 1000 escrituras `put`/día.

- [ ] **Step 3: Marcar el spec como implementado**

En el encabezado del spec cambiar `**Estado:** borrador para revisión` por `**Estado:** aprobado el 2026-10-13 · implementado según el plan 2026-10-13-entrega-servicio.md`.

- [ ] **Step 4: Verificación completa antes de dar por terminado**

Run: `npx tsc -b && npm run lint && npx vitest run && npm run build && npm run test:pdf`
Expected: todo pasa. Pegar la salida real de `test:pdf` (las 5 líneas `✓`) en la respuesta final; no afirmar éxito sin ella.

Revisión visual final: abrir `out/ranco.pdf` y los PDF de `glass` y `seals` y comparar contra la maqueta aprobada (portada con foto y velo, índice, hallazgos con fotos grandes, Emisión con una persona).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: CLAUDE.md del proyecto, mapa de CONTEXTO y estado del spec" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Detenerse antes de publicar**

**No** crear el repositorio en GitHub, **no** hacer `git push` y **no** tocar Vercel. Informar a Matías que el trabajo local está terminado y verificado, y preguntar: (a) el nombre del repo en la organización `Alto-Test-Spa`, (b) si el proyecto de Vercel va en su cuenta personal como los hermanos, (c) la variable `VITE_REPORTS_ENDPOINT=https://altotest-documentos.altotest.workers.dev`, y (d) confirmar con qué navegador imprime Camilo, porque el pie necesita Chrome o Edge reciente.

---

## Auto-revisión del plan contra el spec

**Cobertura del spec:**
- §1 Objetivo / servicio como configuración → Tareas 3, 4, 11.
- §2 D1–D10 → D1 (T4, T11), D2 (campo estructurado, T5/T8), D3 (T8, T10), D4 (T3 `access.ts`, T4 `normative.ts`, T9 selector), D5 (T5 `Finding`, T8 `FindingsSection`), D6 (T5 `validate`), D7 (T2 `photos.ts`, T7, T8), D8 (T8 `IssuanceSection`), D9 (T4 test «hallazgos justo antes de la emisión»), D10 (T1, T6).
- §4 arquitectura/stack/Worker/folio/acceso → T1, T6.
- §5 modelo de datos → T2 (con deltas registrados en el spec).
- §6 definiciones y tipos de sección → T3, T4, T8 (nueve tipos con un renderizador cada uno).
- §7 numeración → T3 (`sections.ts`).
- §8 datos únicos → T3 (`interpolate.ts`), T9 `DataPanel`.
- §9 trazabilidad → T12.
- §10 hallazgos con fotos grandes y tope → T8.
- §11 fotos y compresión → T2, T7.
- §12 validación y borrador/emitido → T5, T9.
- §13 impresión nativa, portada y compuertas de PDF → T8, T10.
- §14 contenido por servicio / Anexo A normativa → T4, T11.
- §15 pruebas → todas las tareas (Vitest) y T10 (PDF).
- §16 riesgos → T6 (KV), T10 (paginación), T12 (forma real de documentos enlazados, leída del código).
- §17 hitos → Tareas 1–10 (ronda 1), 11 (ronda 2), 12–13 (ronda 3).

**Escaneo de marcadores:** el único texto entre corchetes en el plan es `[por completar]` dentro de `ACCESS_EQUIPMENT` (intencional y probado) y las rutas de ejemplo. No hay «TBD», «TODO» ni «implementar después». El stub de `EntregaEditor.tsx` de la Tarea 6 se reemplaza completo en la Tarea 9 y está declarado como tal.

**Consistencia de tipos:** `NormativeItem` lleva `id` desde la Tarea 3 y se usa en `normative.ts`, `anchors.ts`, `glass.ts`, `seals.ts`. `Field.write` (Tarea 5) lo usa `helpers.ts`. `RenderCtx` (Tarea 8) lo consumen todas las secciones. `useEntregaStore().startReport(serviceId, accessMode?)` (Tarea 6) coincide con `ServicePicker.onStart` (Tarea 9). Las claves de `values` (`tests.fact2`, `tests.conclusion`) coinciden con `keys.ts` y con el id de sección `tests` y el índice de la ficha de calibración (tercer elemento, índice 2).
