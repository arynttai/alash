import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import kz from './locales/kz.json'
import ru from './locales/ru.json'

const resources = {
  en: { translation: en },
  kz: { translation: kz },
  ru: { translation: ru },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Crucial requirement: preferred language order en -> kz -> ru
    fallbackLng: ['en', 'kz', 'ru'],
    supportedLngs: ['en', 'kz', 'ru'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: true,
    },
  })

export default i18n

