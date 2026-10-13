const CODE_PATTERN = /^EN-\d{8}-\d{6}$/

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// Mismo formato que el resto de la familia (PT-, COT-, IL-): EN-aaaammdd-hhmmss.
export function generateCode(now: Date = new Date()): string {
  const date = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`
  return `EN-${date}-${time}`
}

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code)
}

export function generateId(): string {
  return crypto.randomUUID()
}
