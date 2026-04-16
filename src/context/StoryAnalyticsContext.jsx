import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'alash-analytics-city-clicks'

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStorage(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
}

const StoryAnalyticsContext = createContext(null)

export function StoryAnalyticsProvider({ children }) {
  const [clicks, setClicks] = useState(() => readStorage())

  const recordCityClick = useCallback((cityId) => {
    if (!cityId) return
    setClicks((prev) => {
      const next = { ...prev, [cityId]: (prev[cityId] || 0) + 1 }
      writeStorage(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      clicks,
      recordCityClick,
      topCities: Object.entries(clicks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
    }),
    [clicks, recordCityClick],
  )

  return (
    <StoryAnalyticsContext.Provider value={value}>
      {children}
    </StoryAnalyticsContext.Provider>
  )
}

export function useStoryAnalytics() {
  const ctx = useContext(StoryAnalyticsContext)
  if (!ctx) {
    return {
      clicks: {},
      recordCityClick: () => {},
      topCities: [],
    }
  }
  return ctx
}
