import type { Finding, PhotoItem } from '../types'
import { generateId } from './code'

// Tope por sección (pedido de Matías): 6 en el registro del servicio y 6 en total en hallazgos.
export const MAX_PHOTOS = 6

export function countFindingPhotos(findings: Finding[]): number {
  return findings.reduce((n, f) => n + f.photos.length, 0)
}

export function canAddServicePhoto(photos: PhotoItem[]): boolean {
  return photos.length < MAX_PHOTOS
}

export function canAddFindingPhoto(findings: Finding[]): boolean {
  return countFindingPhotos(findings) < MAX_PHOTOS
}

export function newPhoto(dataUrl: string): PhotoItem {
  return { id: generateId(), dataUrl, caption: '' }
}
