import { describe, expect, it } from 'vitest'
import { formatDateInput, isValidDate, parseLooseDate, todayDate } from './date'

describe('date', () => {
  it('todayDate usa dd/mm/aaaa', () => {
    expect(todayDate(new Date(2026, 8, 7))).toBe('07/09/2026')
  })
  it('autoformatea con barras', () => {
    expect(formatDateInput('17092026')).toBe('17/09/2026')
  })
  it('valida fechas reales', () => {
    expect(isValidDate('17/09/2026')).toBe(true)
    expect(isValidDate('31/02/2026')).toBe(false)
    expect(isValidDate('17-09-2026')).toBe(false)
    expect(isValidDate('17/9/2026')).toBe(false)
  })
  it('parseLooseDate lee dd.mm.aaaa y dd/mm/aaaa', () => {
    expect(parseLooseDate('Vence 30.06.2026')).toEqual(new Date(2026, 5, 30))
    expect(parseLooseDate('30/06/2026')).toEqual(new Date(2026, 5, 30))
  })
  it('parseLooseDate lee mm.aaaa como el último día del mes', () => {
    expect(parseLooseDate('02.2028')).toEqual(new Date(2028, 1, 29))
  })
  it('parseLooseDate devuelve null si no hay fecha legible', () => {
    expect(parseLooseDate('vigente')).toBeNull()
    expect(parseLooseDate('31.02.2026')).toBeNull()
    expect(parseLooseDate('13.2026')).toBeNull()
  })
})
