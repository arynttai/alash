import { motion } from 'framer-motion'
import { ChevronRight, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ChapterRail({ chapters, selectedId, onSelect }) {
  const { t } = useTranslation()

  return (
    <div className="px-3 py-3 md:px-4 md:py-4">
      <div className="flex items-center justify-between">
        <div className="font-[Playfair_Display] text-sm text-[#005F73]">
          {t('common.chapters')}
        </div>
        <div className="font-[Merriweather] text-[11px] text-slate-600">
          {t('chapters.tapHint')}
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        {chapters.map((c, idx) => {
          const active = c.id === selectedId
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              whileTap={{ scale: 0.98 }}
              className={[
                'shrink-0 text-left rounded-2xl border',
                'px-3 py-2.5 min-w-[230px]',
                'bg-white/50 hover:bg-white/70',
                'border-black/10',
                active ? 'ring-2 ring-[#005F73]/35' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-[Merriweather]">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{c.city}</span>
                  </div>
                  <div className="mt-1 font-[Playfair_Display] text-sm text-slate-900 leading-snug">
                    {idx + 1}. {c.chapterTitle ?? c.city}
                  </div>
                  <div className="mt-1 font-[Merriweather] text-xs text-slate-700">
                    {c.yearRangeLabel}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 mt-0.5" />
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

