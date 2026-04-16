import { Pause, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

function pickVoiceForLang(lang) {
  const voices = window.speechSynthesis?.getVoices?.() ?? []
  const primary =
    lang === 'kz'
      ? (v) =>
          /kk|kazakh|қазақ/i.test(v.lang) ||
          v.lang.toLowerCase().startsWith('kk')
      : lang === 'ru'
        ? (v) =>
            v.lang.toLowerCase().startsWith('ru') ||
            /russian/i.test(v.name)
        : (v) => v.lang.toLowerCase().startsWith('en')

  const found = voices.find(primary)
  return found ?? voices[0]
}

export default function NarratorButton({ textByLang, disabled }) {
  const { i18n, t } = useTranslation()
  const [speaking, setSpeaking] = useState(false)
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    const prime = () => synth.getVoices()
    prime()
    synth.addEventListener('voiceschanged', prime)
    return () => synth.removeEventListener('voiceschanged', prime)
  }, [])

  const text =
    lang === 'ru'
      ? textByLang.ru
      : lang === 'kz'
        ? textByLang.kz
        : textByLang.en

  const canSpeak =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    Boolean(text?.trim())

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const play = useCallback(() => {
    if (!canSpeak || disabled) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    const voice = pickVoiceForLang(lang === 'kz' ? 'kz' : lang === 'ru' ? 'ru' : 'en')
    if (voice) utter.voice = voice
    utter.lang =
      lang === 'kz'
        ? 'kk-KZ'
        : lang === 'ru'
          ? 'ru-RU'
          : 'en-US'
    utter.rate = 0.92
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utter)
    setSpeaking(true)
  }, [canSpeak, disabled, lang, text])

  if (!canSpeak) return null

  return (
    <button
      type="button"
      disabled={disabled || !text?.trim()}
      onClick={() => (speaking ? stop() : play())}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-[Merriweather] bg-[#005F73]/15 text-[#005F73] border border-[#005F73]/25 hover:bg-[#005F73]/25 disabled:opacity-45"
    >
      {speaking ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {speaking ? t('narrator.stop') : t('narrator.listen')}
    </button>
  )
}
