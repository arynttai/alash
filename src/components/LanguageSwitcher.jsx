import { Check, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'kz', label: 'KZ' },
  { code: 'ru', label: 'RU' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/40 px-1.5 py-1 backdrop-blur md:gap-2 md:px-2 md:py-1.5">
      <Globe className="hidden h-4 w-4 text-slate-700 sm:block" />
      <div className="flex items-center gap-0.5 md:gap-1">
        {LANGS.map((l) => {
          const active = current === l.code
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => i18n.changeLanguage(l.code)}
              className={[
                'relative inline-flex min-h-9 min-w-9 items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-[Merriweather] md:min-h-0 md:min-w-0',
                active
                  ? 'border border-black/10 bg-white/85 text-slate-900'
                  : 'text-slate-700 active:bg-white/70 md:hover:bg-white/60',
              ].join(' ')}
              aria-pressed={active}
            >
              {active ? <Check className="h-3.5 w-3.5" /> : null}
              {l.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

