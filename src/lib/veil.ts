// Mismo reparto que veilBackground() de propuesta_tecnica_react: capa pareja + degradado de recorrido
// corto (un degradado largo se imprime en bandas visibles).
export function veilBackground(percent: number): string {
  const v = Math.max(0, Math.min(100, percent)) / 100
  const tone = (a: number) => `rgba(16,21,30,${Math.min(1, a).toFixed(3)})`
  return `linear-gradient(180deg,${tone(v * 0.05)} 0%,${tone(v * 0.16)} 34%,${tone(v * 0.3)} 68%,${tone(v * 0.42)} 100%), ${tone(v * 0.62)}`
}
