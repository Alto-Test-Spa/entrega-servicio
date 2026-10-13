import { describe, expect, it } from 'vitest'
import type { Finding, PhotoItem } from '../types'
import { MAX_PHOTOS, canAddFindingPhoto, canAddServicePhoto, countFindingPhotos, newPhoto } from './photos'
import { imageErrorMessage } from './image'

const photos = (n: number): PhotoItem[] => Array.from({ length: n }, () => newPhoto('data:x'))
const finding = (n: number): Finding => ({
  id: 'f', location: '', description: '', photos: photos(n), severity: 'observation',
  immediateRisk: false, recommendation: '', commercialOpportunity: false,
})

describe('photos', () => {
  it('el tope es 6', () => expect(MAX_PHOTOS).toBe(6))
  it('el registro del servicio admite hasta 6', () => {
    expect(canAddServicePhoto(photos(5))).toBe(true)
    expect(canAddServicePhoto(photos(6))).toBe(false)
  })
  it('los hallazgos comparten el tope de 6 en total', () => {
    const fs = [finding(4), finding(1)]
    expect(countFindingPhotos(fs)).toBe(5)
    expect(canAddFindingPhoto(fs)).toBe(true)
    expect(canAddFindingPhoto([finding(4), finding(2)])).toBe(false)
  })
  it('cada foto nueva trae id propio y descripción vacía', () => {
    const [a, b] = photos(2)
    expect(a.id).not.toBe(b.id)
    expect(a.caption).toBe('')
  })
})

describe('imageErrorMessage', () => {
  it('sugiere JPG o PNG y no revienta con valores raros', () => {
    expect(imageErrorMessage(new Error('boom'))).toContain('JPG o PNG')
    expect(imageErrorMessage('texto')).toContain('JPG o PNG')
    expect(imageErrorMessage(undefined)).toContain('JPG o PNG')
  })
})
