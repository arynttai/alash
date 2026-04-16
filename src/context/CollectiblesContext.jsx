import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'alash-collected-docs'

function readIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

const CollectiblesContext = createContext(null)

export function CollectiblesProvider({ children, totalCount }) {
  const [collected, setCollected] = useState(() => new Set(readIds()))

  const collect = useCallback((id) => {
    setCollected((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      writeIds([...next])
      return next
    })
  }, [])

  const isCollected = useCallback(
    (id) => collected.has(id),
    [collected],
  )

  const value = useMemo(
    () => ({
      collectedIds: [...collected],
      collectedCount: collected.size,
      totalCount,
      collect,
      isCollected,
      allFound: totalCount > 0 && collected.size >= totalCount,
    }),
    [collected, totalCount, collect, isCollected],
  )

  return (
    <CollectiblesContext.Provider value={value}>
      {children}
    </CollectiblesContext.Provider>
  )
}

export function useCollectibles() {
  const ctx = useContext(CollectiblesContext)
  if (!ctx) {
    throw new Error('useCollectibles must be used within CollectiblesProvider')
  }
  return ctx
}
