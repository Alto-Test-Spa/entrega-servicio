import { describe, expect, it } from 'vitest'
import { KNOWN_VARS } from '../lib/interpolate'
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
  it('empieza con la identificación fija y termina con los hallazgos', () => {
    expect(def.sections[0]).toMatchObject({ kind: 'identification', fixed: true })
    expect(def.sections.at(-1)?.kind).toBe('findings')
  })
  it('no tiene hoja de emisión: quien emite va en la portada', () => {
    expect(def.sections.some((s) => (s.kind as string) === 'issuance')).toBe(false)
  })
  it('incluye las secciones comunes', () => {
    const kinds = def.sections.map((s) => s.kind)
    for (const k of ['table', 'photos', 'annexes', 'findings'] as const) expect(kinds).toContain(k)
  })
  it('cada fila de tabla tiene tantas celdas como columnas', () => {
    for (const s of def.sections) if (s.kind === 'table') for (const r of s.rows) expect(r.length).toBe(s.columns.length)
  })
  it('solo usa variables conocidas en sus textos', () => {
    const all = [def.title, def.intro, ...def.sections.flatMap(texts)]
    for (const t of all) for (const m of t.matchAll(VAR_RE)) expect(KNOWN_VARS).toContain(m[1])
  })
  it('ningún texto base trae marcadores entre corchetes', () => {
    const all = [def.title, def.intro, ...def.sections.flatMap(texts)]
    for (const t of all) expect(t).not.toMatch(/\[[^\]]{2,}\]/)
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
      'identification', 'scope', 'components', 'tests', 'execution', 'layout', 'photos', 'maintenance', 'annexes', 'findings',
    ])
  })
  it('el alcance remite a la propuesta técnica en una nota, no como ítem', () => {
    const scope = def.sections.find((s) => s.id === 'scope')
    expect(scope?.kind === 'table' && scope.note).toMatch(/propuesta técnica/)
    expect(scope?.kind === 'table' && scope.rows).toHaveLength(4)
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
