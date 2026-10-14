import type { AnnexRow, EntregaState } from '../types'
import type { SectionDef } from '../services/types'
import { keys } from './keys'

type AnnexesDef = Extract<SectionDef, { kind: 'annexes' }>

export const MAX_ANNEXES = 26 // A–Z

export const annexLetter = (index: number) => String.fromCharCode(65 + index)

// Anexos de la sección: la lista editada si existe; si no, la de la definición con las vigencias que
// ya se hubieran escrito (informes guardados antes de poder agregar y quitar anexos).
export function effectiveAnnexes(state: EntregaState, section: AnnexesDef): AnnexRow[] {
  const edited = state.annexes?.[section.id]
  if (edited) return edited.map((r) => ({ ...r, delivery: r.delivery ?? 'included' }))
  return section.annexes.map((a, i) => ({
    title: a.title, hasValidity: a.hasValidity, delivery: a.delivery,
    validity: state.values[keys.annexValidity(section.id, i)] ?? a.defaultValidity ?? '',
  }))
}

export function setAnnexes(s: EntregaState, sectionId: string, rows: AnnexRow[]): EntregaState {
  return { ...s, annexes: { ...s.annexes, [sectionId]: rows.slice(0, MAX_ANNEXES) } }
}
