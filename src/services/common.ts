import type { AnnexDef, SectionDef, TableColumn } from './types'

// El Dossier de Ranco traía dos cargos distintos para la misma persona. Este es el único lugar
// donde se define; Alto Test debe confirmarlo.
export const DEFAULT_ISSUER = { issuerName: 'Camilo Jara', issuerRole: 'Gerente Comercial y Operaciones' }

export const identificationSection = (): SectionDef => ({
  id: 'identification', title: 'Identificación', group: 'common', fixed: true, kind: 'identification',
})
// La normativa vive en la propuesta técnica enviada antes del servicio: el alcance solo remite a ella,
// en una nota bajo el cuadro (editable, por si un trabajo necesita otra redacción).
const SCOPE_NOTE = 'Este trabajo se ejecutó conforme a las normas y requisitos indicados en la propuesta técnica de servicio enviada previamente.'
export const scopeSection = (columns: TableColumn[], rows: string[][]): SectionDef => ({
  id: 'scope', title: 'Alcance ejecutado', group: 'common', kind: 'table', columns, rows, note: SCOPE_NOTE,
})
export const photosSection = (): SectionDef => ({
  id: 'photos', title: 'Registro fotográfico', group: 'common', kind: 'photos',
})
// El plan se escribe en meses desde la instalación; la columna «Fecha estimada» la calcula el sistema a
// partir de la fecha de ejecución (así nadie tipea «marzo 2027» a mano).
export const maintenanceSection = (rows: string[][], note?: string): SectionDef => ({
  id: 'maintenance', title: 'Plan de mantención', group: 'common', kind: 'table',
  columns: [
    { label: 'Hito', width: '11%' },
    { label: 'Actividad recomendada', width: '33%' },
    { label: 'Alcance general' },
    { label: 'Fecha estimada', width: '15%', derive: 'dueDate' },
  ],
  rows: rows.map(([milestone, activity, scope]) => [milestone, activity, scope, '']),
  ...(note === undefined ? {} : { note, noteLabel: 'Inspección extraordinaria y ciclo posterior', notePlain: true }),
})
export const annexesSection = (annexes: AnnexDef[]): SectionDef => ({
  id: 'annexes', title: 'Documentos de respaldo', group: 'common', kind: 'annexes', annexes,
})
export const findingsSection = (): SectionDef => ({
  id: 'findings', title: 'Hallazgos fuera de alcance', group: 'closing', kind: 'findings',
})

export const SCOPE_COLUMNS: TableColumn[] = [
  { label: 'Ítem', width: '9%' }, { label: 'Actividad ejecutada' }, { label: 'Cantidad', width: '16%', align: 'center' }, { label: 'Observación', width: '22%' },
]
