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

export const FIXTURE_NAMES = ['ranco', 'minimal', 'stress', 'glass', 'seals'] as const
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
    case 'glass':
    case 'seals': {
      const { def, state } = base(name)
      const done = complete(state, def)
      return {
        def,
        state: {
          ...done,
          values: name === 'glass' ? { ...done.values, 'equipment.fact3': 'Carro colgante · N.º de serie CC-204' } : done.values,
          photos: Array.from({ length: 4 }, (_, i) => photo(i + 1, `Registro ${i + 1}`)),
          findings: [finding(1, 2, 'critical'), finding(2, 1, 'observation')],
        },
      }
    }
    default:
      throw new Error(`Fixture desconocido: ${name}`)
  }
}
