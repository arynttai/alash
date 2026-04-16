import { motion } from 'framer-motion'
import { ExternalLink, ImageIcon, Loader2, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GeminiApiError } from '../utils/geminiApi.js'
import NarratorButton from './NarratorButton.jsx'

/** CC0 demo track (MDN sample) — replace with your narration when ready */
const DEMO_AUDIO_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'

const HISTORICAL_PLACEHOLDER_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Library_of_Congress%2C_Washington%2C_D.C._-_LOC_-_2001696459.jpg/640px-Library_of_Congress%2C_Washington%2C_D.C._-_LOC_-_2001696459.jpg'

function SafeImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  const url = failed || !src ? HISTORICAL_PLACEHOLDER_IMAGE : src

  return (
    <img
      src={url}
      alt={alt || ''}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export default function CityDetails({
  geminiStatus,
  geminiData,
  geminiError,
  onRefreshGemini,
  offlineDescription,
  offlineKeyEvents,
}) {
  const { t } = useTranslation()
  const isQuota =
    geminiError instanceof GeminiApiError && geminiError.status === 429

  const descriptions = geminiData?.descriptions ?? {}
  const imageUrls = useMemo(
    () => (Array.isArray(geminiData?.imageUrls) ? geminiData.imageUrls : []),
    [geminiData],
  )
  const audioTopic = geminiData?.audioTopic ?? ''

  const textByLang = useMemo(
    () => ({
      en: descriptions.en || offlineDescription || '',
      kz: descriptions.kz || offlineDescription || '',
      ru: descriptions.ru || offlineDescription || '',
    }),
    [descriptions, offlineDescription],
  )

  const showNarrator =
    (geminiStatus === 'ready' && geminiData) ||
    (geminiStatus === 'error' && Boolean(offlineDescription?.trim()))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="font-[Playfair_Display] text-sm text-[#005F73]">
          {t('cityDetails.aiTitle')}
        </div>
        <button
          type="button"
          onClick={onRefreshGemini}
          disabled={geminiStatus === 'loading'}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-[Merriweather] bg-white/60 hover:bg-white border border-black/10 disabled:opacity-50"
        >
          {geminiStatus === 'loading' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {t('cityDetails.refresh')}
        </button>
      </div>

      {geminiStatus === 'loading' ? (
        <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/45 px-3 py-3 text-sm font-[Merriweather] text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin text-[#005F73]" />
          {t('cityDetails.loading')}
        </div>
      ) : null}

      {geminiStatus === 'error' && geminiError ? (
        <div
          className={[
            'rounded-xl border px-3 py-3 text-xs font-[Merriweather]',
            isQuota
              ? 'border-amber-200/90 bg-amber-50/90 text-amber-950'
              : 'border-red-200/80 bg-red-50/80 text-red-900',
          ].join(' ')}
        >
          {isQuota ? (
            <div className="space-y-2">
              <div className="font-[Playfair_Display] text-sm text-amber-900">
                {t('cityDetails.quotaTitle')}
              </div>
              <p className="leading-relaxed">{t('cityDetails.quotaBody')}</p>
              <a
                className="inline-flex text-[#005F73] underline underline-offset-2"
                href="https://ai.google.dev/gemini-api/docs/rate-limits"
                target="_blank"
                rel="noreferrer"
              >
                {t('cityDetails.quotaLink')}
              </a>
              {geminiError.message ? (
                <p className="mt-2 text-[11px] opacity-80 break-words">
                  {geminiError.message}
                </p>
              ) : null}
            </div>
          ) : (
            <span>
              {geminiError instanceof Error
                ? geminiError.message
                : String(geminiError)}
            </span>
          )}
        </div>
      ) : null}

      {geminiStatus === 'error' && offlineDescription ? (
        <div className="space-y-2 rounded-xl border border-black/10 bg-white/50 p-3">
          <div className="font-[Playfair_Display] text-sm text-[#005F73]">
            {t('cityDetails.offlineContextTitle')}
          </div>
          <p className="text-sm leading-relaxed text-slate-800">
            {offlineDescription}
          </p>
          {offlineKeyEvents?.length ? (
            <ul className="space-y-2 pt-1">
              {offlineKeyEvents.map((ev, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 text-sm text-slate-800"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#005F73]" />
                  <span className="leading-relaxed">{ev}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {geminiStatus === 'ready' && geminiData ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-xl border border-black/10 bg-white/40 p-3"
          >
            <div className="text-[11px] font-[Merriweather] uppercase tracking-wide text-slate-500">
              English
            </div>
            <p className="text-sm leading-relaxed text-slate-800">
              {descriptions.en || '—'}
            </p>
            <div className="text-[11px] font-[Merriweather] uppercase tracking-wide text-slate-500">
              Қазақша
            </div>
            <p className="text-sm leading-relaxed text-slate-800">
              {descriptions.kz || '—'}
            </p>
            <div className="text-[11px] font-[Merriweather] uppercase tracking-wide text-slate-500">
              Русский
            </div>
            <p className="text-sm leading-relaxed text-slate-800">
              {descriptions.ru || '—'}
            </p>
          </motion.div>

          {imageUrls.length > 0 ? (
            <div className="space-y-2">
              <div className="font-[Playfair_Display] text-sm text-[#005F73] flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {t('cityDetails.suggestedImages')}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {imageUrls.slice(0, 2).map((url, i) => (
                  <a
                    key={`${url}-${i}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block overflow-hidden rounded-xl border border-black/10 bg-white/40"
                  >
                    <div className="relative aspect-[16/10] bg-black/10">
                      <SafeImage
                        src={url}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-2 text-[11px] font-[Merriweather] text-[#005F73]">
                      <ExternalLink className="h-3 w-3" />
                      {t('cityDetails.openImage')}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2 rounded-xl border border-black/10 bg-white/45 p-3">
            <div className="font-[Playfair_Display] text-sm text-[#005F73]">
              {t('cityDetails.audioTopic')}
            </div>
            <p className="text-xs font-[Merriweather] text-slate-700">
              {audioTopic || t('cityDetails.audioTopicFallback')}
            </p>
            <audio className="mt-2 w-full" controls preload="metadata">
              <source src={DEMO_AUDIO_URL} type="audio/mpeg" />
            </audio>
            <p className="text-[11px] font-[Merriweather] text-slate-500">
              {t('cityDetails.demoAudioHint')}
            </p>
          </div>
        </>
      ) : null}

      {showNarrator ? (
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <NarratorButton textByLang={textByLang} />
        </div>
      ) : null}

      {geminiStatus === 'idle' ? (
        <p className="text-xs font-[Merriweather] text-slate-600">
          {t('cityDetails.idle')}
        </p>
      ) : null}
    </div>
  )
}
