import { AnimatePresence, motion } from 'framer-motion'
import { Heart, LocateFixed, MapPin, Search, Share2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { useLocalStorageState } from '../hooks/useLocalStorageState.js'

const STORAGE_KEY = 'alash-favorite-cities'

function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function copyText(text) {
  return navigator.clipboard?.writeText
    ? navigator.clipboard.writeText(text)
    : Promise.reject(new Error('Clipboard API not available'))
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

export default function CityNavigator({
  allCities,
  selectedId,
  onSelect,
  buildShareUrl,
}) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useLocalStorageState(STORAGE_KEY, [])

  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  const filtered = useMemo(() => {
    const q = normalize(query)
    const base = Array.isArray(allCities) ? allCities : []
    if (!q) return base
    return base.filter((c) => normalize(c.city).includes(q))
  }, [allCities, query])

  const sorted = useMemo(() => {
    const base = [...filtered]
    base.sort((a, b) => {
      const af = favoriteSet.has(a.id) ? 1 : 0
      const bf = favoriteSet.has(b.id) ? 1 : 0
      if (af !== bf) return bf - af
      return (a.startYear ?? 0) - (b.startYear ?? 0)
    })
    return base
  }, [filtered, favoriteSet])

  const toggleFavorite = (id) => {
    if (!id) return
    setFavorites((prev) => {
      const arr = Array.isArray(prev) ? prev : []
      return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
    })
  }

  const shareSelected = async () => {
    if (!selectedId) return
    const url = buildShareUrl?.(selectedId) ?? ''
    if (!url) return
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Alash Path', url })
        return
      }
    } catch {
      // ignore (user cancelled)
    }
    try {
      await copyText(url)
      // small UX: close panel after copy on mobile
      if (!isDesktop) setOpen(false)
    } catch {
      // ignore
    }
  }

  const pickNearest = async () => {
    try {
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('no-geo'))
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60_000,
        })
      })
      const user = [pos.coords.latitude, pos.coords.longitude]
      const base = Array.isArray(allCities) ? allCities : []
      const best = base
        .filter((c) => Array.isArray(c.coords) && c.coords.length === 2)
        .map((c) => ({ c, d: haversineKm(user, c.coords) }))
        .sort((a, b) => a.d - b.d)[0]?.c
      if (best?.id) {
        onSelect?.(best.id)
        if (!isDesktop) setOpen(false)
      }
    } catch {
      // soft-fail
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-black/10 bg-white/65 px-3 text-sm font-[Merriweather] text-slate-900 shadow-sm backdrop-blur-md active:bg-white md:min-h-10 md:hover:bg-white/80"
          aria-label={t('nav.open')}
        >
          <Search className="h-4 w-4 text-[#005F73]" />
          <span className="truncate">{t('nav.searchPlaceholder')}</span>
        </button>

        <button
          type="button"
          onClick={shareSelected}
          disabled={!selectedId}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/60 text-slate-800 shadow-sm backdrop-blur-md disabled:opacity-40 active:bg-white md:h-10 md:w-10 md:hover:bg-white/80"
          aria-label={t('nav.share')}
          title={t('nav.share')}
        >
          <Share2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={pickNearest}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/60 text-slate-800 shadow-sm backdrop-blur-md active:bg-white md:h-10 md:w-10 md:hover:bg-white/80"
          aria-label={t('nav.nearMe')}
          title={t('nav.nearMe')}
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1195] bg-black/35 md:hidden"
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
            />

            <motion.div
              initial={
                isDesktop ? { opacity: 0, y: 8, scale: 0.98 } : { y: '100%' }
              }
              animate={isDesktop ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }}
              exit={isDesktop ? { opacity: 0, y: 8, scale: 0.98 } : { y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className={[
                'fixed z-[1200] overflow-hidden border border-black/10 bg-[#F4EBD0]/97 shadow-2xl backdrop-blur-md',
                isDesktop
                  ? 'top-20 left-6 w-[min(560px,calc(100vw-3rem))] rounded-3xl'
                  : 'inset-x-0 bottom-0 max-h-[82dvh] rounded-t-3xl pb-[env(safe-area-inset-bottom,0px)]',
              ].join(' ')}
            >
              {!isDesktop ? (
                <div className="flex justify-center pt-2 pb-1" aria-hidden>
                  <div className="h-1.5 w-12 rounded-full bg-black/15" />
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-3 border-b border-black/10 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-[Playfair_Display] text-base text-[#005F73]">
                    {t('nav.title')}
                  </div>
                  <div className="mt-0.5 text-[11px] font-[Merriweather] text-slate-600">
                    {t('nav.subtitle')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/70 active:bg-white md:min-h-10 md:min-w-10 md:hover:bg-white/85"
                  aria-label={t('common.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-white/90 py-3 pl-10 pr-3 text-base font-[Merriweather] outline-none focus:ring-2 focus:ring-[#005F73]/25 md:py-2 md:text-sm"
                    placeholder={t('nav.inputPlaceholder')}
                    enterKeyHint="search"
                  />
                </div>
              </div>

              <div className="max-h-[calc(82dvh-160px)] overflow-y-auto overscroll-contain px-2 pb-4 md:max-h-[min(520px,70vh)]">
                {sorted.length ? (
                  <ul className="space-y-2 px-2">
                    {sorted.map((c) => {
                      const active = c.id === selectedId
                      const fav = favoriteSet.has(c.id)
                      return (
                        <li key={c.id}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              onSelect?.(c.id)
                              if (!isDesktop) setOpen(false)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onSelect?.(c.id)
                                if (!isDesktop) setOpen(false)
                              }
                            }}
                            className={[
                              'w-full rounded-2xl border px-3 py-3 text-left outline-none',
                              'border-black/10 bg-white/70 active:bg-white',
                              active ? 'ring-2 ring-[#005F73]/30' : '',
                              'focus:ring-2 focus:ring-[#005F73]/25',
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 shrink-0 text-[#005F73]" />
                                  <div className="truncate font-[Playfair_Display] text-sm text-slate-900">
                                    {c.city}
                                  </div>
                                </div>
                                <div className="mt-1 text-[11px] font-[Merriweather] text-slate-600">
                                  {c.yearRangeLabel}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleFavorite(c.id)
                                }}
                                className={[
                                  'inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10',
                                  fav ? 'bg-[#005F73]/10 text-[#005F73]' : 'bg-white/70 text-slate-700',
                                  'active:bg-white',
                                ].join(' ')}
                                aria-label={fav ? t('nav.unfavorite') : t('nav.favorite')}
                                title={fav ? t('nav.unfavorite') : t('nav.favorite')}
                              >
                                <Heart className={fav ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
                              </button>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-8 text-center text-sm font-[Merriweather] text-slate-600">
                    {t('nav.empty')}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}

