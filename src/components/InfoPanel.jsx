import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CityDetails from './CityDetails.jsx'
import MediaGallery from './MediaGallery.jsx'
import TimelineCompare from './TimelineCompare.jsx'
import GlassPanel from './ui/GlassPanel.jsx'
import { useGeminiCityContent } from '../hooks/useGeminiCityContent.js'

export default function InfoPanel({ selected, onClose }) {
  const { t } = useTranslation()
  const { status, data, error, refresh } = useGeminiCityContent(
    selected?.city,
    selected?.id,
  )

  return (
    <AnimatePresence>
      {selected ? (
        <motion.aside
          className="absolute top-0 right-0 z-[1200] h-full w-full md:w-[440px] p-3 md:p-4"
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <GlassPanel className="h-full overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex items-start justify-between gap-3 p-4 border-b border-black/10">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-slate-600 font-[Merriweather]">
                    {selected.era?.range ? `${selected.era.range} • ` : ''}
                    {selected.era?.id
                      ? t(`eras.${selected.era.id}`)
                      : (selected.era?.label ?? t('common.location'))}
                  </div>
                  <h2 className="font-[Playfair_Display] text-xl text-[#0b1b22] truncate">
                    {selected.city}
                  </h2>
                  <div className="font-[Merriweather] text-sm text-slate-700">
                    {selected.yearRangeLabel}{' '}
                    <span className="text-slate-500">
                      {selected.countryHint ? `• ${selected.countryHint}` : ''}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-[Merriweather] bg-white/60 hover:bg-white border border-black/10"
                >
                  <X className="h-4 w-4" />
                  {t('common.close')}
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-5">
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
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-black/10 shrink-0">
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
                            <div className="font-[Merriweather] text-sm text-slate-900 truncate">
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
      ) : null}
    </AnimatePresence>
  )
}
