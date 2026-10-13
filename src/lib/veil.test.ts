import { describe, expect, it } from 'vitest'
import { veilBackground } from './veil'

describe('veilBackground', () => {
  it('devuelve un degradado corto más una capa pareja', () => {
    const v = veilBackground(60)
    expect(v).toContain('linear-gradient(180deg')
    expect(v.trim().endsWith(')')).toBe(true)
  })
  it('acota el porcentaje entre 0 y 100', () => {
    expect(veilBackground(-20)).toBe(veilBackground(0))
    expect(veilBackground(900)).toBe(veilBackground(100))
  })
  it('0 % no oscurece nada', () => {
    expect(veilBackground(0)).toContain('rgba(16,21,30,0.000)')
  })
})
