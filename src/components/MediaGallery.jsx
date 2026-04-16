import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function MediaGallery({ media }) {
  const { t } = useTranslation()
  const photos = media?.photos ?? []
  const audio = media?.audio ?? []
  const [idx, setIdx] = useState(0)

  const current = useMemo(() => photos[idx] ?? null, [photos, idx])

  if (!photos.length && !audio.length) return null

  return (
    <div className="space-y-4">
      {photos.length ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-[Playfair_Display] text-sm text-[#005F73]">
              {t('panel.photos')}
            </div>
            <div className="text-[11px] font-[Merriweather] text-slate-600">
              {idx + 1}/{photos.length}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-black/10 bg-white/40">
            <div className="relative aspect-[16/9] bg-black/10">
              <AnimatePresence mode="wait">
                {current ? (
                  <motion.img
                    key={current.src}
                    src={current.src}
                    alt={current.alt ?? ''}
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    loading="lazy"
                    onError={(ev) => {
                      ev.currentTarget.style.display = 'none'
                    }}
                  />
                ) : null}
              </AnimatePresence>

              {!current ? (
                <div className="absolute inset-0 grid place-items-center text-slate-600">
                  <div className="flex items-center gap-2 font-[Merriweather] text-xs">
                    <ImageIcon className="h-4 w-4" />
                    {t('panel.noImage')}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between px-2 py-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-[Merriweather] bg-white/60 hover:bg-white border border-black/10 disabled:opacity-50"
                onClick={() => setIdx((v) => Math.max(0, v - 1))}
                disabled={idx === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('common.back')}
              </button>
              <div className="text-[11px] font-[Merriweather] text-slate-700 truncate px-2">
                {current?.alt ?? ''}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-[Merriweather] bg-white/60 hover:bg-white border border-black/10 disabled:opacity-50"
                onClick={() => setIdx((v) => Math.min(photos.length - 1, v + 1))}
                disabled={idx === photos.length - 1}
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {audio.length ? (
        <section className="space-y-2">
          <div className="font-[Playfair_Display] text-sm text-[#005F73]">
            {t('panel.audio')}
          </div>
          <div className="space-y-3">
            {audio.map((a) => (
              <div
                key={a.src}
                className="rounded-xl border border-black/10 bg-white/50 p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-[Merriweather] text-xs text-slate-900">
                    {a.title ?? t('panel.audioFallbackTitle')}
                  </div>
                  {a.durationHint ? (
                    <div className="font-[Merriweather] text-[11px] text-slate-600">
                      {a.durationHint}
                    </div>
                  ) : null}
                </div>
                <audio className="mt-2 w-full" controls preload="none">
                  <source src={a.src} />
                </audio>
                <div className="mt-1 text-[11px] font-[Merriweather] text-slate-600">
                  {t('panel.audioMissingHint')}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

