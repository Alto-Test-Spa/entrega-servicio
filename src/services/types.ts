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
