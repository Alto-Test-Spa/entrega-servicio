import { describe, expect, it } from 'vitest'
import { plainText, sanitizeRich } from './richtext'

describe('sanitizeRich', () => {
  it('lee el texto plano antiguo: escapa y convierte \\n en salto', () => {
    expect(sanitizeRich('a\nb')).toBe('a<br>b')
    expect(sanitizeRich('R&D con 3 < 5')).toBe('R&amp;D con 3 &lt; 5')
  })
  it('conserva negrita, listas y saltos', () => {
    expect(sanitizeRich('x <b>fuerte</b><ul><li>uno</li><li>dos</li></ul>')).toBe('x <b>fuerte</b><ul><li>uno</li><li>dos</li></ul>')
    expect(sanitizeRich('a<br>b')).toBe('a<br>b')
  })
  it('convierte <strong> y los bloques de Enter del navegador', () => {
    expect(sanitizeRich('<strong>x</strong>')).toBe('<b>x</b>')
    expect(sanitizeRich('a<div>b</div><div><br></div><div>c</div>')).toBe('a<br>b<br><br>c')
  })
  it('descarta lo que no está permitido', () => {
    expect(sanitizeRich('<script>alert(1)</script><i onclick="x()">t</i><b style="x">n</b>')).toBe('alert(1)t<b>n</b>')
    expect(sanitizeRich('<a href="javascript:x">l</a><img src=x onerror=y>')).toBe('l')
  })
  it('cierra lo que quedó abierto y quita vacíos y saltos de los bordes', () => {
    expect(sanitizeRich('<ul><li>a')).toBe('<ul><li>a</li></ul>')
    expect(sanitizeRich('<br><b>a</b><br>')).toBe('<b>a</b>')
    expect(sanitizeRich('<ul><li><br></li></ul>')).toBe('')
    expect(sanitizeRich('<b></b>')).toBe('')
  })
})

describe('plainText', () => {
  it('devuelve el texto visible', () => {
    expect(plainText('<b>a</b> &amp; b<br>c')).toBe('a & b\nc')
    expect(plainText('sin etiquetas')).toBe('sin etiquetas')
    expect(plainText('<br>').trim()).toBe('')
  })
})

describe('texto ya serializado (editor)', () => {
  it('no escapa dos veces ni deja &nbsp; visibles', () => {
    expect(sanitizeRich('marco&nbsp;PVC')).toBe('marco PVC')
    expect(sanitizeRich('A &amp; B')).toBe('A &amp; B')
    expect(sanitizeRich(sanitizeRich('A & B'))).toBe('A &amp; B')
    expect(plainText('A &amp; B')).toBe('A & B')
  })
  it('un párrafo vacío entre dos párrafos es una línea en blanco', () => {
    expect(sanitizeRich('<p>a</p><p><br></p><p>b</p>')).toBe('a<br><br>b')
    expect(sanitizeRich('<p>a</p><p>b</p>')).toBe('a<br>b')
  })
})
