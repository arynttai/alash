import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchAlashChatReply,
  GeminiApiError,
  isGeminiConfigured,
} from '../utils/geminiApi.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'

let messageIdSeq = 0
function nextMessageId() {
  messageIdSeq += 1
  return `msg-${messageIdSeq}`
}

export default function AlashChatbot() {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: t('chat.welcome'),
    },
  ])
  const scrollRef = useRef(null)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

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

    if (!isGeminiConfigured()) {
      setMessages((m) => [
        ...m,
        { id: nextMessageId(), role: 'user', content: q },
        {
          id: nextMessageId(),
          role: 'assistant',
          content: t('chat.noApiKey'),
        },
      ])
      return
    }

    const historyForApi = (messagesRef.current ?? []).map((x) => ({
      role: x.role,
      content: x.content,
    }))
    setMessages((m) => [...m, { id: nextMessageId(), role: 'user', content: q }])

    setLoading(true)
    try {
      const reply = await fetchAlashChatReply({
        history: historyForApi,
        userText: q,
      })
      setMessages((m) => [
        ...m,
        { id: nextMessageId(), role: 'assistant', content: reply },
      ])
    } catch (e) {
      const msg =
        e instanceof GeminiApiError && e.status === 429
          ? t('chat.quota')
          : e instanceof Error
            ? e.message
            : String(e)
      setMessages((m) => [
        ...m,
        { id: nextMessageId(), role: 'assistant', content: msg },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, t])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'fixed z-[1250] flex h-14 w-14 items-center justify-center rounded-full border border-black/15 bg-[#005F73] text-[#F4EBD0] shadow-lg active:scale-95',
          'bottom-[max(7.25rem,calc(6.75rem+env(safe-area-inset-bottom,0px)))] right-[max(1rem,env(safe-area-inset-right,0px))]',
          'md:bottom-6 md:right-6',
        ].join(' ')}
        aria-label={open ? t('common.close') : t('chat.toggle')}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: isDesktop ? 16 : '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isDesktop ? 16 : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className={[
              'fixed z-[1250] flex flex-col overflow-hidden border border-black/10 bg-[#F4EBD0]/97 shadow-2xl backdrop-blur-md',
              isDesktop
                ? 'bottom-24 right-4 h-[min(420px,70vh)] w-[min(380px,calc(100vw-2rem))] rounded-2xl'
                : 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl pb-[env(safe-area-inset-bottom,0px)]',
            ].join(' ')}
          >
            <div className="flex shrink-0 items-start justify-between gap-2 border-b border-black/10 px-4 py-3">
              <div>
                <div className="font-[Playfair_Display] text-sm text-[#005F73]">
                  {t('chat.title')}
                </div>
                <div className="font-[Merriweather] text-[11px] text-slate-600">
                  {t('chat.subtitle')}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-black/10 bg-white/60 active:bg-white md:min-h-9 md:min-w-9"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {!isDesktop ? (
              <div className="flex justify-center pb-1" aria-hidden>
                <div className="h-1 w-10 rounded-full bg-black/12" />
              </div>
            ) : null}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={[
                    'max-w-[92%] rounded-xl px-3 py-2.5 text-sm font-[Merriweather] leading-relaxed',
                    m.role === 'user'
                      ? 'ml-auto bg-[#005F73] text-[#F4EBD0]'
                      : 'mr-auto border border-black/10 bg-white/75 text-slate-800',
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
            <div className="flex shrink-0 gap-2 border-t border-black/10 p-3">
              <input
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-black/10 bg-white/90 px-3 text-base font-[Merriweather] outline-none focus:ring-2 focus:ring-[#005F73]/30 md:min-h-0 md:py-2 md:text-sm"
                value={input}
                placeholder={t('chat.placeholder')}
                enterKeyHint="send"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#005F73] text-[#F4EBD0] disabled:opacity-40 md:h-10 md:w-10"
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
