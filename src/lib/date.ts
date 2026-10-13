export function todayDate(now: Date = new Date()): string {
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${now.getFullYear()}`
}

// Autoformato progresivo: agrega las barras mientras se escribe.
export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/')
}

function buildDate(year: number, month: number, day: number): Date | null {
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day ? d : null
}

// Estricta: solo dd/mm/aaaa con ceros (la fecha de ejecución).
export function isValidDate(value: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  return !!m && buildDate(Number(m[3]), Number(m[2]), Number(m[1])) !== null
}

// Laxa: busca una fecha dentro de un texto libre (vigencias escritas por una persona).
// dd.mm.aaaa o dd/mm/aaaa → ese día; mm.aaaa → último día del mes (la lectura más permisiva,
// para no avisar vencimientos de más).
export function parseLooseDate(text: string): Date | null {
  const full = /(\d{2})[./](\d{2})[./](\d{4})/.exec(text)
  if (full) return buildDate(Number(full[3]), Number(full[2]), Number(full[1]))
  const monthYear = /(?<!\d)(\d{2})[./](\d{4})/.exec(text)
  if (monthYear) {
    const month = Number(monthYear[1])
    if (month < 1 || month > 12) return null
    return new Date(Number(monthYear[2]), month, 0)
  }
  return null
}
