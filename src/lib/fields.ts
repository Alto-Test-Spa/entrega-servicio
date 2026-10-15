import type { AnnexRow, EntregaState, Finding, SharedData } from '../types'
import type { SectionDef, ServiceDefinition } from '../services/types'
import { padRow } from './tables'
import { annexLetter, effectiveAnnexes, setAnnexes } from './annexes'
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

function sectionFields(section: SectionDef, state: EntregaState, ctx: Record<string, string>, intro: string): Field[] {
  const base = { sectionId: section.id }
  const val = (key: string, fallback: string) => effectiveValue(state, key, fallback, ctx)
  switch (section.kind) {
    case 'identification':
      return [
        ...SHARED_FIELDS.map(({ key, label, required }): Field => ({
          ...base, label, value: state.shared[key], required, validity: false,
          write: (s, v) => ({ ...s, shared: { ...s.shared, [key]: v } }),
        })),
        { ...base, label: 'Objetivo', value: val(keys.objective, intro), required: true, validity: false, write: writeValue(keys.objective) },
        { ...base, label: 'Resumen del resultado', value: val(keys.summary, ''), required: true, validity: false, write: writeValue(keys.summary) },
      ]
    case 'table': {
      const rows = state.tables[section.id] ?? section.rows
      const noteField: Field[] = section.note === undefined ? [] : [
        { ...base, label: `${section.title} · nota`, value: val(keys.note(section.id), section.note), required: !section.noteOptional, validity: false, write: writeValue(keys.note(section.id)) },
      ]
      return [...noteField, ...rows.flatMap((row, r) =>
        padRow(row, section.columns.length).flatMap((cell, c) => section.columns[c].derive ? [] : [{
          ...base, label: `${section.title} · fila ${r + 1}`, value: interpolate(cell, ctx), required: !section.columns[c].optional, validity: false,
          write: (s: EntregaState, v: string): EntregaState => ({
            ...s,
            tables: { ...s.tables, [section.id]: (s.tables[section.id] ?? section.rows).map((rr, ri) => (ri === r ? padRow(rr, section.columns.length).map((cc, ci) => (ci === c ? v : cc)) : rr)) },
          }),
        }]),
      )]
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
        ...base, label: `Foto ${i + 1}`, value: p.caption, required: false, validity: false,
        write: (s, v) => ({ ...s, photos: s.photos.map((pp, pi) => (pi === i ? { ...pp, caption: v } : pp)) }),
      }))
    case 'annexes':
      return effectiveAnnexes(state, section).flatMap((a, i): Field[] => {
        const patch = (p: Partial<AnnexRow>) => (s: EntregaState): EntregaState =>
          setAnnexes(s, section.id, effectiveAnnexes(s, section).map((x, xi) => (xi === i ? { ...x, ...p } : x)))
        const title: Field = { ...base, label: `Anexo ${annexLetter(i)} · documento`, value: a.title, required: true, validity: false, write: (s, v) => patch({ title: v })(s) }
        return a.hasValidity
          ? [title, { ...base, label: `Anexo ${annexLetter(i)} · vigencia`, value: a.validity, required: true, validity: true, write: (s, v) => patch({ validity: v })(s) }]
          : [title]
      })
    case 'findings':
      return state.findings.flatMap((f, i) => {
        const patch = (p: Partial<Finding>) => (s: EntregaState): EntregaState => ({ ...s, findings: s.findings.map((ff, fi) => (fi === i ? { ...ff, ...p } : ff)) })
        const text = (label: string, value: string, prop: 'location' | 'description' | 'recommendation'): Field => ({
          ...base, label: `Hallazgo ${i + 1} · ${label}`, value, required: true, validity: false, write: (s, v) => patch({ [prop]: v })(s),
        })
        const caps = f.photos.map((p, j): Field => ({
          ...base, label: `Hallazgo ${i + 1} · foto ${j + 1}`, value: p.caption, required: true, validity: false,
          write: (s, v) => patch({ photos: f.photos.map((pp, pj) => (pj === j ? { ...pp, caption: v } : pp)) })(s),
        }))
        return [text('ubicación', f.location, 'location'), text('descripción', f.description, 'description'), text('recomendación', f.recommendation, 'recommendation'), ...caps]
      })
  }
}

// Todo lo editable de las secciones VISIBLES. Lo oculto no se valida ni cuenta.
export function collectFields(state: EntregaState, def: ServiceDefinition): Field[] {
  const ctx = buildContext(state)
  return activeSections(def, state.hiddenSections).flatMap(({ section }) => sectionFields(section, state, ctx, def.intro))
}
