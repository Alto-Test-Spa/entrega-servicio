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
