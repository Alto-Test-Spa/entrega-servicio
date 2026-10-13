import { useId, useState } from 'react'
import { compressImage, imageErrorMessage } from '../lib/image'

interface Props {
  label: string
  disabled?: boolean
  onPhoto: (dataUrl: string) => void
  maxDimension?: number
  quality?: number
  className?: string
}

// Botón de subir imagen. Si el archivo no se puede leer (HEIC, corrupto, vacío) muestra un mensaje
// y deja todo como estaba.
export function PhotoPicker({ label, disabled, onPhoto, maxDimension, quality, className }: Props) {
  const id = useId()
  const [error, setError] = useState('')

  async function onFile(file: File | undefined) {
    if (!file) return
    setError('')
    try {
      onPhoto(await compressImage(file, maxDimension, quality))
    } catch (e) {
      setError(imageErrorMessage(e))
    }
  }

  return (
    <span className={`photo-picker no-print ${className ?? ''}`}>
      <label htmlFor={id} className={`sbtn ${disabled ? 'is-disabled' : ''}`} aria-disabled={disabled}>
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        hidden
        disabled={disabled}
        onChange={(e) => {
          void onFile(e.target.files?.[0])
          e.target.value = '' // permite volver a elegir el mismo archivo
        }}
      />
      {error && <span className="photo-error" role="alert">{error}</span>}
    </span>
  )
}
