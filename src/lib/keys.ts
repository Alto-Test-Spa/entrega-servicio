import type { AccessMode } from '../types'

// Claves de `EntregaState.values`: una por cada texto editable que no vive en tables/photos/findings.
export const keys = {
  fact: (sectionId: string, index: number) => `${sectionId}.fact${index}`,
  conclusion: (sectionId: string) => `${sectionId}.conclusion`,
  legend: (sectionId: string) => `${sectionId}.legend`,
  annexValidity: (sectionId: string, index: number) => `${sectionId}.annex${index}.validity`,
  // La normativa va por modalidad: lo editado para una no se filtra a otra.
  norm: (mode: AccessMode, index: number) => `normative.${mode}.${index}`,
}
