import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCityStoryFromGemini } from '../utils/geminiApi.js'

const DEBOUNCE_MS = 520

export function useGeminiCityContent(cityName, locationId) {
  const [status, setStatus] = useState(() =>
    cityName && locationId ? 'loading' : 'idle',
  )
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    if (!cityName || !locationId) return
    const id = ++requestId.current
    setStatus('loading')
    setError(null)
    try {
      const result = await fetchCityStoryFromGemini({ cityName })
      if (id !== requestId.current) return
      setData(result)
      setStatus('ready')
    } catch (e) {
      if (id !== requestId.current) return
      setData(null)
      setError(e instanceof Error ? e : new Error(String(e)))
      setStatus('error')
    }
  }, [cityName, locationId])

  useEffect(() => {
    if (!cityName || !locationId) {
      setData(null)
      setError(null)
      setStatus('idle')
      return
    }
    setStatus('loading')
    setError(null)
    const id = ++requestId.current
    const t = window.setTimeout(async () => {
      try {
        const result = await fetchCityStoryFromGemini({ cityName })
        if (id !== requestId.current) return
        setData(result)
        setStatus('ready')
      } catch (e) {
        if (id !== requestId.current) return
        setData(null)
        setError(e instanceof Error ? e : new Error(String(e)))
        setStatus('error')
      }
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [cityName, locationId])

  return { status, data, error, refresh }
}
