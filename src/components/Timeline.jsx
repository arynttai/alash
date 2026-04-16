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
    <div className="px-4 py-3 md:px-5 md:py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-[Playfair_Display] text-sm text-[#005F73]">
            {t('common.timeline')}
          </div>
          <div className="font-[Merriweather] text-sm text-slate-800">
            {t('timeline.yearLabel', { year })}
          </div>
        </div>
        <div className="hidden md:flex gap-2 text-xs font-[Merriweather] text-slate-600">
          {eras.map((e) => (
            <button
              key={e.id}
              type="button"
              className={[
                'rounded-full px-3 py-1 border border-black/10',
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
      </div>

      <div className="mt-3">
        <div className="relative">
          <div className="h-3 rounded-full bg-black/10 overflow-hidden">
            <div className="h-full w-full flex">
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
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `calc(${pct}% - 10px)` }}
            animate={{ left: `calc(${pct}% - 10px)` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="h-5 w-5 rounded-full bg-[#005F73] shadow ring-4 ring-white/40" />
          </motion.div>

          <input
            aria-label={t('common.year')}
            className="absolute inset-0 w-full opacity-0 cursor-pointer touch-pan-x"
            type="range"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          />
        </div>

        <div className="mt-2 flex justify-between text-[11px] font-[Merriweather] text-slate-600">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>
    </div>
  )
}

