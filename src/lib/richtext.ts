// Texto con formato (negrita, listas, saltos de línea) guardado como HTML mínimo dentro del mismo
// string de siempre. Solo sobreviven <b>, <ul>, <ol>, <li> y <br>: lo demás se descarta, así que
// ni lo pegado ni lo guardado puede meter HTML arbitrario. Un texto sin etiquetas (los informes
// guardados antes de esto) se lee como texto plano, con "\n" como salto de línea.

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g
const KEEP = new Set(['b', 'ul', 'ol', 'li'])
const BLOCK_END = /(<br>|<\/li>|<\/ul>|<\/ol>)$/

const protect = (t: string) => t.replace(/&(?!(?:amp|lt|gt|quot|#39);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// Texto que viene de un HTML ya serializado: se respetan sus entidades y solo se protege lo suelto.
const cleanSegment = (t: string) =>
  t.replace(/\r?\n/g, ' ').replace(/&nbsp;/g, ' ').replace(/&(?!(?:amp|lt|gt|quot|#39);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function sanitizeRich(input: string): string {
  if (!TAG_RE.test(input)) {
    TAG_RE.lastIndex = 0
    // Sin etiquetas: texto plano antiguo, o texto ya serializado (con &amp;): no se escapa dos veces.
    return protect(input.replace(/&nbsp;/g, ' ')).replace(/\r?\n/g, '<br>').replace(/^(<br>)+|(<br>)+$/g, '')
  }
  TAG_RE.lastIndex = 0
  let out = ''
  const stack: string[] = []
  let last = 0
  const pushBreak = () => { if (out !== '' && !BLOCK_END.test(out)) out += '<br>' }
  for (const m of input.matchAll(TAG_RE)) {
    out += cleanSegment(input.slice(last, m.index))
    last = m.index + m[0].length
    const name = m[1].toLowerCase()
    const closing = m[0].startsWith('</')
    if (name === 'strong') {
      out += closing ? '</b>' : '<b>'
      if (closing) { const i = stack.lastIndexOf('b'); if (i >= 0) stack.splice(i, 1) } else stack.push('b')
    } else if (name === 'br') {
      if (!closing) out += '<br>'
    } else if (name === 'div' || name === 'p') {
      if (!closing) pushBreak()
    } else if (KEEP.has(name)) {
      if (!closing) { out += `<${name}>`; stack.push(name) } else {
        const i = stack.lastIndexOf(name)
        if (i >= 0) { while (stack.length > i + 1) out += `</${stack.pop()}>`; stack.pop(); out += `</${name}>` }
      }
    }
  }
  out += cleanSegment(input.slice(last))
  while (stack.length) out += `</${stack.pop()}>`
  return out
    .replace(/(<br>)+<\/li>/g, '</li>')
    .replace(/<b><\/b>/g, '')
    .replace(/<li><\/li>/g, '')
    .replace(/<(ul|ol)><\/\1>/g, '')
    .replace(/^(<br>)+|(<br>)+$/g, '')
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }

// Lo que ve una persona al leerlo: sirve para saber si está vacío y para buscar marcadores.
export function plainText(value: string): string {
  return value
    .replace(/<\/li>|<br\s*\/?>|<\/div>|<\/p>/gi, '\n')
    .replace(TAG_RE, '')
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTITIES[e])
}
