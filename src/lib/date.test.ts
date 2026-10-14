import { describe, expect, it } from 'vitest'
import { formatDateInput, fromIsoDate, isValidDate, parseLooseDate, todayDate, toIsoDate, dueLabel, monthsFrom } from './date'

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

describe('selector de fecha', () => {
  it('convierte entre dd/mm/aaaa y aaaa-mm-dd', () => {
    expect(toIsoDate('17/09/2026')).toBe('2026-09-17')
    expect(fromIsoDate('2026-09-17')).toBe('17/09/2026')
  })
  it('lo vacío o inválido da vacío, nunca una fecha inventada', () => {
    expect(toIsoDate('')).toBe('')
    expect(toIsoDate('31/02/2026')).toBe('')
    expect(toIsoDate('17-09-2026')).toBe('')
    expect(fromIsoDate('')).toBe('')
    expect(fromIsoDate('basura')).toBe('')
  })
})

describe('fecha estimada de los hitos', () => {
  it('lee los meses del hito', () => {
    expect(monthsFrom('6 meses')).toBe(6)
    expect(monthsFrom('12 Meses')).toBe(12)
    expect(monthsFrom('1 mes')).toBe(1)
    expect(monthsFrom('al instalar')).toBeNull()
  })
  it('suma los meses a la fecha de ejecución y dice mes y año', () => {
    expect(dueLabel('17/09/2026', '6 meses')).toBe('marzo 2027')
    expect(dueLabel('17/09/2026', '12 meses')).toBe('septiembre 2027')
    expect(dueLabel('17/09/2026', '18 meses')).toBe('marzo 2028')
    expect(dueLabel('31/01/2026', '1 mes')).toBe('febrero 2026')
  })
  it('sin fecha válida o sin meses no inventa nada', () => {
    expect(dueLabel('', '6 meses')).toBe('')
    expect(dueLabel('31/02/2026', '6 meses')).toBe('')
    expect(dueLabel('17/09/2026', 'al instalar')).toBe('')
  })
})
