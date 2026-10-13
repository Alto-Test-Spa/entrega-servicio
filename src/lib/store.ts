import { useEffect, useRef, useState } from 'react'
import type { AccessMode, EntregaState } from '../types'
import { initialState, normalizeState } from './template'
import { applyEdit } from './issuance'
import { fetchReport, saveReport, ApiError } from './api'
import type { SyncState } from './api'

// Copia local del último informe activo: solo para no dejar la pantalla en blanco si el Worker no
// responde. La nube manda.
const MIRROR_KEY = 'altotest_entrega_servicio_mirror'

// Espera de inactividad antes de subir. El plan free de KV da 1000 escrituras/día compartidas
// entre todas las apps de Alto Test.
const AUTOSAVE_DEBOUNCE_MS = 3000

const serialize = (s: EntregaState) => JSON.stringify(s)

function readMirror(): EntregaState | null {
  const saved = localStorage.getItem(MIRROR_KEY)
  if (!saved) return null
  try {
    return normalizeState(JSON.parse(saved))
  } catch {
    return null
  }
}

function writeMirror(s: EntregaState) {
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(s))
  } catch (e) {
    console.warn('No se pudo escribir la copia local del informe:', e)
  }
}

export function useEntregaStore(onAuthExpired: () => void) {
  const [state, setState] = useState<EntregaState | null>(() => readMirror())
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [booting, setBooting] = useState(() => !!readMirror())
  const saveSeq = useRef(0)
  const hadMirrorOnBoot = useRef(!!readMirror())
  // Un informe recién creado que nadie tocó no se guarda. Se compara por referencia y no con un
  // flag de una sola consumición: StrictMode monta cada efecto dos veces.
  const pristine = useRef<EntregaState | null>(state)
  const lastSaved = useRef(state ? serialize(state) : '')
  const onAuthExpiredRef = useRef(onAuthExpired)
  useEffect(() => {
    onAuthExpiredRef.current = onAuthExpired
  })

  // Al montar, si había un informe activo se vuelve a pedir al Worker: la nube manda.
  useEffect(() => {
    const mirror = readMirror()
    if (!mirror) return
    fetchReport(mirror.code)
      .then((fresh) => {
        setState(fresh)
        writeMirror(fresh)
        lastSaved.current = serialize(fresh)
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) return void onAuthExpiredRef.current()
        if (e instanceof ApiError && e.status === 404) return // nunca guardado
        setSyncState('offline')
      })
      .finally(() => setBooting(false))
  }, [])

  useEffect(() => {
    if (!state) return
    if (!hadMirrorOnBoot.current && state === pristine.current) return
    const seq = ++saveSeq.current
    const t = setTimeout(async () => {
      const snapshot = serialize(state)
      if (snapshot === lastSaved.current) return
      writeMirror(state)
      setSyncState('saving')
      try {
        await saveReport(state)
        if (saveSeq.current === seq) {
          lastSaved.current = snapshot
          setSyncState('saved')
        }
      } catch (e) {
        if (saveSeq.current !== seq) return
        if (e instanceof ApiError) {
          if (e.status === 401) return void onAuthExpiredRef.current()
          setSyncState('error')
        } else setSyncState('offline')
      }
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [state])

  // Con 3 s de debounce, cambiar de pestaña podría perder los últimos segundos: se fuerza el guardado.
  useEffect(() => {
    const flushIfHidden = () => {
      if (document.visibilityState !== 'hidden' || !state) return
      if (!hadMirrorOnBoot.current && state === pristine.current) return
      const snapshot = serialize(state)
      if (snapshot === lastSaved.current) return
      const seq = ++saveSeq.current
      writeMirror(state)
      saveReport(state)
        .then(() => {
          if (saveSeq.current === seq) lastSaved.current = snapshot
        })
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', flushIfHidden)
    return () => document.removeEventListener('visibilitychange', flushIfHidden)
  }, [state])

  function update(fn: (s: EntregaState) => EntregaState) {
    setState((prev) => (prev ? applyEdit(prev, fn(prev)) : prev))
  }

  function startReport(serviceId: string, accessMode?: AccessMode) {
    const s = initialState(serviceId)
    const fresh = accessMode ? { ...s, accessMode } : s
    pristine.current = fresh
    hadMirrorOnBoot.current = false
    lastSaved.current = ''
    setState(fresh)
  }

  function loadReport(incoming: EntregaState) {
    lastSaved.current = serialize(incoming)
    hadMirrorOnBoot.current = true
    setState(incoming)
  }

  function reset() {
    localStorage.removeItem(MIRROR_KEY)
    pristine.current = null
    hadMirrorOnBoot.current = false
    setState(null)
  }

  return { state, update, startReport, loadReport, reset, syncState, booting }
}
