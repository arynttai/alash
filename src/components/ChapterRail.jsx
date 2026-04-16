import { motion } from 'framer-motion'
import { ChevronRight, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ChapterRail({ chapters, selectedId, onSelect }) {
  const { t } = useTranslation()

  return (
    <div className="px-2 py-2 md:px-4 md:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="font-[Playfair_Display] text-xs text-[#005F73] md:text-sm">
          {t('common.chapters')}
        </div>
        <div className="hidden font-[Merriweather] text-[10px] text-slate-600 sm:block md:text-[11px]">
          {t('chapters.tapHint')}
        </div>
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
        {chapters.map((c, idx) => {
          const active = c.id === selectedId
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              whileTap={{ scale: 0.98 }}
              className={[
                'shrink-0 rounded-2xl border text-left',
                'min-h-[72px] min-w-[min(85vw,200px)] sm:min-w-[230px]',
                'px-3 py-2.5',
                'border-black/10 bg-white/55 active:bg-white/85',
                'md:bg-white/50 md:hover:bg-white/70',
                active ? 'ring-2 ring-[#005F73]/40' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-[Merriweather] md:text-[11px]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.city}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 font-[Playfair_Display] text-xs leading-snug text-slate-900 md:text-sm">
                    {idx + 1}. {c.chapterTitle ?? c.city}
                  </div>
                  <div className="mt-0.5 font-[Merriweather] text-[11px] text-slate-700 md:text-xs">
                    {c.yearRangeLabel}
                  </div>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
