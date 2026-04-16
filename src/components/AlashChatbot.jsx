import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchAlashChatReply, GeminiApiError } from '../utils/geminiApi.js'

export default function AlashChatbot() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      content: t('chat.welcome'),
    },
  ])
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!open) return
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, open])

  const send = useCallback(async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    const historyForApi = messages.map((x) => ({
      role: x.role,
      content: x.content,
    }))
    setMessages((m) => [...m, { role: 'user', content: q }])
    setLoading(true)
    try {
      const reply = await fetchAlashChatReply({
        history: historyForApi,
        userText: q,
      })
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      const msg =
        e instanceof GeminiApiError && e.status === 429
          ? t('chat.quota')
          : e instanceof Error
            ? e.message
            : String(e)
      setMessages((m) => [...m, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, t])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-[1250] flex h-14 w-14 items-center justify-center rounded-full border border-black/15 bg-[#005F73] text-[#F4EBD0] shadow-lg md:bottom-8"
        aria-label={t('chat.toggle')}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="fixed bottom-40 right-4 z-[1250] flex h-[min(420px,70vh)] w-[min(380px,92vw)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#F4EBD0]/95 shadow-2xl backdrop-blur-md md:bottom-24"
          >
            <div className="border-b border-black/10 px-4 py-3">
              <div className="font-[Playfair_Display] text-sm text-[#005F73]">
                {t('chat.title')}
              </div>
              <div className="font-[Merriweather] text-[11px] text-slate-600">
                {t('chat.subtitle')}
              </div>
            </div>
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={[
                    'max-w-[92%] rounded-xl px-3 py-2 text-sm font-[Merriweather] leading-relaxed',
                    m.role === 'user'
                      ? 'ml-auto bg-[#005F73] text-[#F4EBD0]'
                      : 'mr-auto border border-black/10 bg-white/70 text-slate-800',
                  ].join(' ')}
                >
                  {m.content}
                </div>
              ))}
              {loading ? (
                <div className="text-xs font-[Merriweather] text-slate-500">
                  {t('chat.thinking')}
                </div>
              ) : null}
            </div>
            <div className="flex gap-2 border-t border-black/10 p-3">
              <input
                className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm font-[Merriweather] outline-none focus:ring-2 focus:ring-[#005F73]/30"
                value={input}
                placeholder={t('chat.placeholder')}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005F73] text-[#F4EBD0] disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
