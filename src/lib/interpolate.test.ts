import { describe, expect, it } from 'vitest'
import { KNOWN_VARS, interpolate } from './interpolate'

describe('interpolate', () => {
  it('reemplaza variables conocidas', () => {
    expect(interpolate('Obra en {{asset}} ({{client}})', { asset: 'Torre A', client: 'DAG MS' })).toBe(
      'Obra en Torre A (DAG MS)',
    )
  })
  it('tolera espacios dentro de las llaves', () => {
    expect(interpolate('{{ asset }}', { asset: 'X' })).toBe('X')
  })
  it('deja intacta una variable desconocida para que el validador la detecte', () => {
    expect(interpolate('Hola {{nope}}', { asset: 'X' })).toBe('Hola {{nope}}')
  })
  it('un dato único vacío se reemplaza por texto vacío', () => {
    expect(interpolate('[{{asset}}]', { asset: '' })).toBe('[]')
  })
  it('la lista de variables conocidas incluye las de modalidad', () => {
    expect(KNOWN_VARS).toContain('accessEquipment')
    expect(KNOWN_VARS).toContain('executionDate')
  })
})
