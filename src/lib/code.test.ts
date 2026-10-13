import { describe, expect, it } from 'vitest'
import { generateCode, isValidCode } from './code'

describe('code', () => {
  it('genera EN-aaaammdd-hhmmss', () => {
    expect(generateCode(new Date(2026, 8, 17, 10, 15, 0))).toBe('EN-20260917-101500')
  })
  it('valida el formato', () => {
    expect(isValidCode('EN-20260917-101500')).toBe(true)
    expect(isValidCode('IL-20260917-101500')).toBe(false)
    expect(isValidCode('EN-2026-1')).toBe(false)
  })
})
