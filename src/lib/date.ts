export function todayDate(now: Date = new Date()): string {
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${now.getFullYear()}`
}

// El selector de fecha del navegador habla aaaa-mm-dd; el informe guarda dd/mm/aaaa.
export function toIsoDate(value: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  return m && isValidDate(value) ? `${m[3]}-${m[2]}-${m[1]}` : ''
}
export function fromIsoDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
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

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// «6 meses» → 6. Los hitos del plan de mantención se escriben así.
export function monthsFrom(text: string): number | null {
  const m = /(\d+)\s*mes/i.exec(text)
  return m ? Number(m[1]) : null
}

// Mes y año en que cae un hito: la fecha de ejecución más los meses del hito («marzo 2027»).
// Vacío si falta una fecha válida o el hito no dice cuántos meses son: nunca se inventa.
export function dueLabel(executionDate: string, milestone: string): string {
  const months = monthsFrom(milestone)
  if (months === null || !isValidDate(executionDate)) return ''
  const [, mm, yyyy] = executionDate.split('/').map(Number)
  const index = mm - 1 + months
  return `${MONTHS[index % 12]} ${yyyy + Math.floor(index / 12)}`
}
