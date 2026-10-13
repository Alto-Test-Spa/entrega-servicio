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
