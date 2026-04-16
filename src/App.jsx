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
  const helmetTitle =
    lang === 'kz'
      ? 'Alash Path — Алаш жолы (1905–1930)'
      : lang === 'ru'
        ? 'Alash Path — путь Алаш (1905–1930)'
        : 'Alash Path — The Alash intelligentsia (1905–1930)'
  const helmetDesc =
    lang === 'kz'
      ? 'Интерактивті карта: Алаш қозғалысы мен зиялылар желісі.'
      : lang === 'ru'
        ? 'Интерактивная карта движения Алаш и сети интеллигенции.'
        : 'Interactive map of the Alash movement and its intellectual network.'

  return (
    <div className="min-h-dvh bg-[#F4EBD0] text-slate-900">
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

      <header className="border-b border-black/10 bg-[#F4EBD0]/80 px-4 py-3 backdrop-blur md:px-6 md:py-4">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4">
          <div>
            <h1 className="font-[Playfair_Display] text-xl tracking-tight text-[#0b1b22] md:text-2xl">
              {t('app.title')}
            </h1>
            <p className="font-[Merriweather] text-xs text-slate-700 md:text-sm">
              {t('app.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden font-[Merriweather] text-xs text-slate-700 md:block">
              {t('app.hint')}
            </div>
            <button
              type="button"
              onClick={() => setAmbientOn((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white/50 text-slate-700 hover:bg-white/80"
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

      <main className="h-[calc(100dvh-64px)]">
        <MapComponent />
      </main>

      <AlashChatbot />
    </div>
  )
}
