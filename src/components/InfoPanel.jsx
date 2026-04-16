import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Link2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CityDetails from './CityDetails.jsx'
import MediaGallery from './MediaGallery.jsx'
import TimelineCompare from './TimelineCompare.jsx'
import GlassPanel from './ui/GlassPanel.jsx'
import { useGeminiCityContent } from '../hooks/useGeminiCityContent.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { useLocalStorageState } from '../hooks/useLocalStorageState.js'

const FAV_KEY = 'alash-favorite-cities'

function buildShareUrl(cityId) {
  try {
    const u = new URL(window.location.href)
    u.searchParams.set('city', cityId)
    return u.toString()
  } catch {
    return ''
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  // fallback
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

export default function InfoPanel({ selected, onClose }) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [favorites, setFavorites] = useLocalStorageState(FAV_KEY, [])
  const isFav = Array.isArray(favorites) && selected?.id ? favorites.includes(selected.id) : false
  const { status, data, error, refresh } = useGeminiCityContent(
    selected?.city,
    selected?.id,
  )

  return (
    <AnimatePresence>
      {selected ? (
        <>
          <motion.button
            type="button"
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1180] border-0 bg-black/40 backdrop-blur-[1px] md:hidden"
            aria-label={t('common.close')}
            onClick={onClose}
          />

          <motion.aside
            key="panel"
            className={[
              'z-[1200] flex flex-col',
              isDesktop
                ? 'absolute top-0 right-0 h-full w-[min(100%,440px)] p-3 md:p-4'
                : 'fixed inset-x-0 bottom-0 max-h-[92dvh] p-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2',
            ].join(' ')}
            initial={
              isDesktop
                ? { x: 48, opacity: 0 }
                : { y: '100%', opacity: 1 }
            }
            animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
            exit={
              isDesktop
                ? { x: 48, opacity: 0 }
                : { y: '100%', opacity: 1 }
            }
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <GlassPanel
              className={[
                'flex h-full max-h-[92dvh] flex-col overflow-hidden md:max-h-none',
                isDesktop ? '' : 'rounded-b-none rounded-t-3xl',
              ].join(' ')}
            >
              {!isDesktop ? (
                <div
                  className="flex shrink-0 justify-center pt-2 pb-1"
                  aria-hidden
                >
                  <div className="h-1.5 w-12 rounded-full bg-black/15" />
                </div>
              ) : null}

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/10 p-3 md:p-4">
                  <div className="min-w-0 pr-2">
                    <div className="text-[11px] font-[Merriweather] uppercase tracking-wider text-slate-600 md:text-xs">
                      {selected.era?.range ? `${selected.era.range} • ` : ''}
                      {selected.era?.id
                        ? t(`eras.${selected.era.id}`)
                        : (selected.era?.label ?? t('common.location'))}
                    </div>
                    <h2 className="font-[Playfair_Display] text-lg leading-tight text-[#0b1b22] md:text-xl">
                      {selected.city}
                    </h2>
                    <div className="mt-0.5 font-[Merriweather] text-xs text-slate-700 md:text-sm">
                      {selected.yearRangeLabel}{' '}
                      <span className="text-slate-500">
                        {selected.countryHint ? `• ${selected.countryHint}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selected?.id) return
                        const url = buildShareUrl(selected.id)
                        if (!url) return
                        try {
                          if (navigator.share) {
                            await navigator.share({ title: 'Alash Path', url })
                            return
                          }
                        } catch {
                          /* ignore */
                        }
                        try {
                          await copyToClipboard(url)
                        } catch {
                          /* ignore */
                        }
                      }}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-black/10 bg-white/70 text-slate-800 active:bg-white md:min-h-10 md:min-w-10"
                      aria-label={t('nav.share')}
                      title={t('nav.share')}
                    >
                      <Link2 className="h-5 w-5 md:h-4 md:w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!selected?.id) return
                        setFavorites((prev) => {
                          const arr = Array.isArray(prev) ? prev : []
                          return arr.includes(selected.id)
                            ? arr.filter((x) => x !== selected.id)
                            : [...arr, selected.id]
                        })
                      }}
                      className={[
                        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-black/10 bg-white/70 active:bg-white md:min-h-10 md:min-w-10',
                        isFav ? 'text-[#005F73]' : 'text-slate-700',
                      ].join(' ')}
                      aria-label={isFav ? t('nav.unfavorite') : t('nav.favorite')}
                      title={isFav ? t('nav.unfavorite') : t('nav.favorite')}
                    >
                      <Heart className={isFav ? 'h-5 w-5 fill-current md:h-4 md:w-4' : 'h-5 w-5 md:h-4 md:w-4'} />
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white/70 px-3 text-sm font-[Merriweather] active:bg-white md:min-h-10 md:min-w-0"
                    >
                      <X className="h-5 w-5 md:h-4 md:w-4" />
                      <span className="hidden md:inline">{t('common.close')}</span>
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 pb-6 md:space-y-5 md:p-4">
                  {selected.chapterTitle ? (
                    <div className="rounded-xl border border-black/10 bg-white/45 p-3">
                      <div className="font-[Playfair_Display] text-sm text-[#005F73]">
                        {t('panel.chapter')}
                      </div>
                      <div className="mt-1 font-[Merriweather] text-sm text-slate-900">
                        {selected.chapterTitle}
                      </div>
                      {selected.highlightQuote ? (
                        <div className="mt-2 font-[Merriweather] text-xs text-slate-700 italic">
                          {selected.highlightQuote}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <CityDetails
                    geminiStatus={status}
                    geminiData={data}
                    geminiError={error}
                    onRefreshGemini={refresh}
                    offlineDescription={selected.description}
                    offlineKeyEvents={selected.keyEvents}
                  />

                  <TimelineCompare compare={selected.compare} />

                  <MediaGallery media={selected.media} />

                  {selected.keyFigures?.length ? (
                    <section className="space-y-2">
                      <div className="text-sm font-[Playfair_Display] text-[#005F73]">
                        {t('panel.figures')}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {selected.keyFigures.map((p) => (
                          <div
                            key={p.name}
                            className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/50 p-3"
                          >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/10">
                              <img
                                src={p.portrait}
                                alt={p.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(ev) => {
                                  ev.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-[Merriweather] text-sm text-slate-900">
                                {p.name}
                              </div>
                              {p.note ? (
                                <div className="font-[Merriweather] text-xs text-slate-600">
                                  {p.note}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </GlassPanel>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
