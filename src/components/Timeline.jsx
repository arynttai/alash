import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export default function Timeline({
  year,
  onYearChange,
  minYear,
  maxYear,
  eras,
}) {
  const { t } = useTranslation()
  const pct = ((year - minYear) / (maxYear - minYear)) * 100

  return (
    <div className="px-3 py-2 md:px-5 md:py-4">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="font-[Playfair_Display] text-xs text-[#005F73] md:text-sm">
            {t('common.timeline')}
          </div>
          <div className="font-[Merriweather] text-xs text-slate-800 md:text-sm">
            {t('timeline.yearLabel', { year })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] md:hidden">
        {eras.map((e) => (
          <button
            key={e.id}
            type="button"
            className={[
              'shrink-0 rounded-full border border-black/10 px-3 py-2 text-[11px] font-[Merriweather] leading-tight',
              year >= e.startYear && year <= e.endYear
                ? 'bg-white/85 text-slate-900 shadow-sm'
                : 'bg-white/45 text-slate-700 active:bg-white/70',
            ].join(' ')}
            onClick={() => onYearChange(e.startYear)}
          >
            {t('timeline.eraChip', {
              range: e.range,
              label: t(`eras.${e.id}`),
            })}
          </button>
        ))}
      </div>

      <div className="mt-2 hidden items-center gap-2 md:flex">
        {eras.map((e) => (
          <button
            key={e.id}
            type="button"
            className={[
              'rounded-full border border-black/10 px-3 py-1.5 text-xs font-[Merriweather]',
              year >= e.startYear && year <= e.endYear
                ? 'bg-white/70 text-slate-900'
                : 'bg-white/40 hover:bg-white/60',
            ].join(' ')}
            onClick={() => onYearChange(e.startYear)}
          >
            {t('timeline.eraChip', {
              range: e.range,
              label: t(`eras.${e.id}`),
            })}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <div className="relative py-1">
          <div className="h-4 overflow-hidden rounded-full bg-black/10 md:h-3">
            <div className="flex h-full w-full">
              {eras.map((e) => {
                const left = ((e.startYear - minYear) / (maxYear - minYear)) * 100
                const right = ((e.endYear - minYear) / (maxYear - minYear)) * 100
                const width = clamp(right - left, 0, 100)
                return (
                  <div
                    key={e.id}
                    className="h-full"
                    style={{
                      width: `${width}%`,
                      background:
                        e.id === 'awakening'
                          ? 'rgba(0,95,115,0.25)'
                          : e.id === 'autonomy'
                            ? 'rgba(202,138,4,0.22)'
                            : 'rgba(51,65,85,0.18)',
                    }}
                    title={t('timeline.eraChip', {
                      range: e.range,
                      label: t(`eras.${e.id}`),
                    })}
                  />
                )
              })}
            </div>
          </div>

          <motion.div
            className="pointer-events-none absolute top-1/2 -translate-y-1/2"
            style={{ left: `calc(${pct}% - 12px)` }}
            animate={{ left: `calc(${pct}% - 12px)` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="h-6 w-6 rounded-full bg-[#005F73] shadow-md ring-4 ring-white/50 md:h-5 md:w-5 md:ring-4" />
          </motion.div>

          <input
            aria-label={t('common.year')}
            className="absolute inset-0 h-full min-h-[44px] w-full cursor-pointer opacity-0"
            type="range"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          />
        </div>

        <div className="mt-1 flex justify-between text-[10px] font-[Merriweather] text-slate-600 md:text-[11px]">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>
    </div>
  )
}
