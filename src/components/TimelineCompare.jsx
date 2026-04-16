import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function TimelineCompare({ compare }) {
  const { t } = useTranslation()
  const [pos, setPos] = useState(50)
  if (!compare?.oldSrc || !compare?.newSrc) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className="space-y-2 rounded-xl border border-black/10 bg-white/40 p-3"
    >
      <div className="font-[Playfair_Display] text-sm text-[#005F73]">
        {t('compare.title')}
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-black/10">
        <img
          src={compare.newSrc}
          alt={compare.newLabel ?? ''}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <img
          src={compare.oldSrc}
          alt={compare.oldLabel ?? ''}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-[Merriweather] text-white">
          {compare.oldLabel}
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-[Merriweather] text-white">
          {compare.newLabel}
        </div>
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-[#F4EBD0] shadow"
          style={{ left: `${pos}%` }}
        />
      </div>
      <input
        type="range"
        min={8}
        max={92}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="w-full accent-[#005F73]"
        aria-label={t('compare.slider')}
      />
    </motion.section>
  )
}
