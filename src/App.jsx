import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { Volume2, VolumeX } from 'lucide-react'
import MapComponent from './components/MapComponent.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'
import AmbientScape from './components/AmbientScape.jsx'
import AnalyticsPopover from './components/AnalyticsPopover.jsx'
import AlashChatbot from './components/AlashChatbot.jsx'

const SITE_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : ''
const OG_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/7/71/Kazakh_intelligentsia_%281918%29.jpg'

export default function App() {
  const { t, i18n } = useTranslation()
  const [ambientOn, setAmbientOn] = useState(false)
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]
  const helmetTitle = t('app.helmetTitle')
  const helmetDesc = t('app.helmetDescription')

  return (
    <div className="alash-app-root flex min-h-dvh flex-col bg-[#F4EBD0] text-slate-900">
      <Helmet>
        <html lang={lang === 'kz' ? 'kk' : lang} />
        <title>{helmetTitle}</title>
        <meta name="description" content={helmetDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={helmetTitle} />
        <meta property="og:description" content={helmetDesc} />
        <meta property="og:image" content={OG_IMAGE} />
        {SITE_ORIGIN ? <meta property="og:url" content={SITE_ORIGIN} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={helmetTitle} />
        <meta name="twitter:description" content={helmetDesc} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>

      <AmbientScape enabled={ambientOn} />

      <header className="shrink-0 border-b border-black/10 bg-[#F4EBD0]/80 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur md:px-6 md:py-4">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-2 md:items-baseline md:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-[Playfair_Display] text-lg leading-tight tracking-tight text-[#0b1b22] md:text-2xl">
              {t('app.title')}
            </h1>
            <p className="mt-0.5 line-clamp-2 font-[Merriweather] text-[11px] leading-snug text-slate-700 md:mt-0 md:line-clamp-none md:text-sm">
              {t('app.subtitle')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
            <div className="hidden font-[Merriweather] text-xs text-slate-700 md:block">
              {t('app.hint')}
            </div>
            <button
              type="button"
              onClick={() => setAmbientOn((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white/50 text-slate-700 active:bg-white/90 md:h-9 md:w-9 md:hover:bg-white/80"
              title={
                ambientOn ? t('ambient.disable') : t('ambient.enable')
              }
              aria-pressed={ambientOn}
            >
              {ambientOn ? (
                <Volume2 className="h-4 w-4 text-[#005F73]" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
            <AnalyticsPopover />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="alash-map-stage relative min-h-0 flex-1">
        <MapComponent />
      </main>

      <AlashChatbot />
    </div>
  )
}
