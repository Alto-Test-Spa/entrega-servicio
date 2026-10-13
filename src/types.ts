export type AccessMode = 'ground' | 'suspended_platform' | 'rope'
export const ACCESS_MODES: AccessMode[] = ['ground', 'suspended_platform', 'rope']

export type Severity = 'critical' | 'needs_action' | 'observation' | 'compliant'
export const SEVERITY_LEVELS: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Crítico' },
  { value: 'needs_action', label: 'Requiere intervención' },
  { value: 'observation', label: 'Observación' },
  { value: 'compliant', label: 'Conforme' },
]

export interface PhotoItem {
  id: string
  dataUrl: string
  caption: string
}

export interface Finding {
  id: string
  location: string
  description: string
  photos: PhotoItem[]
  severity: Severity
  immediateRisk: boolean
  recommendation: string
  commercialOpportunity: boolean
}

// Datos únicos: se ingresan una vez y se propagan a todo el informe.
export interface SharedData {
  client: string
  asset: string
  address: string
  contact: string
  executionDate: string // dd/mm/aaaa
  quoteCode: string // COT-… (opcional)
  surveyCode: string // IL-… (opcional)
  issuerName: string
  issuerRole: string
}

export type DocStatus = 'draft' | 'issued'

export interface EntregaState {
  code: string
  serviceId: string
  accessMode: AccessMode
  shared: SharedData
  hiddenSections: string[]
  // Texto editado de hechos, conclusión, leyenda, normativa y vigencias de anexos, por clave (lib/keys.ts)
  values: Record<string, string>
  // Filas de cada sección de tipo tabla, por id de sección (se copian de la definición al crear)
  tables: Record<string, string[][]>
  coverPhoto?: string
  coverVeil: number // 0–100
  photos: PhotoItem[] // registro fotográfico del servicio ejecutado, máx. 6
  findings: Finding[]
  layoutImage?: string
  status: DocStatus
}
