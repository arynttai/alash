import { BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import locations from '../data/locations.json'
import { useStoryAnalytics } from '../context/StoryAnalyticsContext.jsx'

const cityTitle = (id) =>
  locations.find((l) => l.id === id)?.city ?? id

export default function AnalyticsPopover() {
  const { t } = useTranslation()
  const { topCities } = useStoryAnalytics()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white/50 text-slate-700 active:bg-white/90 md:h-9 md:w-9 md:hover:bg-white/80"
        aria-expanded={open}
        title={t('analytics.title')}
      >
        <BarChart3 className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-[1300] w-[min(16rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1rem)] rounded-xl border border-black/10 bg-[#F4EBD0]/95 p-3 text-left shadow-xl backdrop-blur md:top-10 md:w-64">
          <div className="font-[Playfair_Display] text-xs text-[#005F73]">
            {t('analytics.title')}
          </div>
          <p className="mt-1 text-[11px] font-[Merriweather] text-slate-600">
            {t('analytics.hint')}
          </p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-[11px] font-[Merriweather] text-slate-800">
            {topCities.length ? (
              topCities.map(([id, n]) => (
                <li key={id} className="flex justify-between gap-2">
                  <span className="truncate">{cityTitle(id)}</span>
                  <span className="shrink-0 font-bold">{n}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500">{t('analytics.empty')}</li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
