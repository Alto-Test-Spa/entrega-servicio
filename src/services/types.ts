export interface TableColumn {
  label: string
  width?: string // p. ej. '12%'
  derive?: 'dueDate' // columna calculada (no editable): mes y año del hito de la primera columna, desde la fecha de ejecución
  example?: string // ayuda de pantalla en la celda vacía («Ej. …»); no es contenido del documento
}

export interface FactItem {
  label: string
  value: string // admite {{variables}}; vacío si depende del trabajo
  hint?: string // ayuda de pantalla, no es contenido del documento
  validity?: boolean // texto con una fecha de vigencia que se compara con la fecha de ejecución
}

export type AnnexDelivery = 'included' | 'separate' // en este informe / documento aparte

export interface AnnexDef {
  letter: string
  title: string
  hasValidity: boolean
  delivery: AnnexDelivery
  defaultValidity?: string // p. ej. una referencia fija del documento; admite quedar vacío
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
    | { kind: 'table'; columns: TableColumn[]; rows: string[][]; note?: string; noteLabel?: string; notePlain?: boolean }
    | { kind: 'facts'; facts: FactItem[]; conclusionHint: string }
    | { kind: 'layout'; instruction: string; legend: string }
    | { kind: 'photos' }
    | { kind: 'annexes'; annexes: AnnexDef[] }
    | { kind: 'findings' }
  )

export type SectionKind = SectionDef['kind']

export interface ServiceDefinition {
  id: string
  label: string
  codePrefix: string // p. ej. 'AT-R-ANC'
  title: string
  intro: string // admite {{variables}}
  sections: SectionDef[] // en orden de documento
}
