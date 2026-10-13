// Las fotos se guardan como base64 dentro del documento (un valor de KV admite 25 MB):
// se comprimen en el navegador antes de guardarlas.
export async function compressImage(file: File, maxDimension = 1600, quality = 0.78): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar el lienzo para comprimir la imagen')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}

// Mensaje para la persona cuando una foto no se puede leer (HEIC, archivo corrupto, vacío).
export function imageErrorMessage(err: unknown): string {
  const detail = err instanceof Error && err.message ? ` (${err.message})` : ''
  return `No se pudo leer esa imagen. Prueba con un archivo JPG o PNG${detail}.`
}
