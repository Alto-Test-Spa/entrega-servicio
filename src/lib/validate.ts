import type { EntregaState } from '../types'
import type { ServiceDefinition } from '../services/types'
import { isValidDate, parseLooseDate } from './date'
import { collectFields } from './fields'
import { countFindingPhotos, MAX_PHOTOS } from './photos'
import { plainText } from './richtext'
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
  const emptyBySection = new Map<string, string[]>()
  for (const f of fields) {
    if (!f.required || plainText(f.value).trim() !== '') continue
    if (f.sectionId === 'identification') issues.push({ level: 'block', message: `Falta ${f.label}`, sectionId: 'identification' })
    else emptyBySection.set(f.sectionId, [...(emptyBySection.get(f.sectionId) ?? []), f.label])
  }
  for (const [id, labels] of emptyBySection) {
    // Se nombran los primeros campos para que se encuentre cuál falta sin recorrer todo el documento.
    const shown = labels.slice(0, 3).join(', ') + (labels.length > 3 ? ` y ${labels.length - 3} más` : '')
    issues.push({ level: 'block', message: `${labels.length} campo(s) vacío(s) en «${titleOf(id)}»: ${shown}`, sectionId: id })
  }

  // 2. Texto de plantilla sin reemplazar: el primero de cada sección.
  const seen = new Set<string>()
  for (const f of fields) {
    const m = PLACEHOLDER_RE.exec(plainText(f.value))
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

  // 6. Avisos que NO bloquean: vigencias vencidas.
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
  return issues
}
