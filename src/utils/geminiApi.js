/**
 * Vite подставляет только переменные с префиксом VITE_ (см. документацию Vite).
 * @see https://vitejs.dev/guide/env-and-mode.html
 *
 * Здесь мы используем OpenAI‑совместимый API Groq:
 *  - базовый URL: https://api.groq.com/openai/v1
 *  - ключ: VITE_GROQ_API_KEY
 *  - модель по умолчанию: llama-3.3-70b-versatile
 */
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_MODEL =
  import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

/** Сообщение об ошибке, если ключ не задан (обрабатывается в UI). */
export const NO_GEMINI_KEY_MESSAGE = 'NO_GEMINI_KEY'

let warnedMissingGroqKey = false

function warnMissingGroqKeyOnce() {
  if (warnedMissingGroqKey) return
  warnedMissingGroqKey = true
  if (import.meta.env.DEV) {
    console.warn(
      '[Alash] VITE_GROQ_API_KEY не задан или пуст. Скопируйте .env.example → .env, задайте ключ Groq и перезапустите `npm run dev`.',
    )
  }
}

export function isGeminiConfigured() {
  return Boolean(String(GROQ_API_KEY ?? '').trim())
}

/** Распознаётся в UI для429 / лимитов */
export class GeminiApiError extends Error {
  /** @param {number} status HTTP status */
  /** @param {string} [body] сырое тело ответа */
  constructor(status, message, body = '') {
    super(message)
    this.name = 'GeminiApiError'
    this.status = status
    this.body = body
  }
}

export function getGeminiApiKey() {
  const key = String(GROQ_API_KEY ?? '').trim()
  if (!key) {
    warnMissingGroqKeyOnce()
    throw new Error(
      'VITE_GROQ_API_KEY is missing. Add it to .env locally and restart the dev server.',
    )
  }
  return key
}

function buildCityPrompt(cityName) {
  return `Act as an expert historian on the Alash Movement. Provide a detailed, engaging description in English, Kazakh, and Russian of the key historical events that occurred in ${cityName} between 1905 and 1920. Also suggest URLs for 2 relevant historical images from Wikimedia Commons or similar free archives (must be direct https URLs to image files), and suggest a topic for a potential audio narration (e.g., "Reading of the Alash Manifesto").

Return ONLY valid JSON with this exact shape (no markdown, no code fences):
{
  "descriptions": {
    "en": "string",
    "kz": "string",
    "ru": "string"
  },
  "imageUrls": ["https://...", "https://..."],
  "audioTopic": "string"
}`
}

function extractJsonObject(text) {
  const trimmed = String(text).trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error('Could not parse JSON from Gemini response')
  }
}

function normalizePayload(raw) {
  const descriptions = {
    en: raw?.descriptions?.en ?? '',
    kz: raw?.descriptions?.kz ?? '',
    ru: raw?.descriptions?.ru ?? '',
  }
  const imageUrls = Array.isArray(raw?.imageUrls)
    ? raw.imageUrls.filter((u) => typeof u === 'string' && u.startsWith('http'))
    : []
  const audioTopic =
    typeof raw?.audioTopic === 'string' ? raw.audioTopic : ''

  return { descriptions, imageUrls, audioTopic }
}

/**
 * Исторический JSON‑нарратив по городу через Groq (OpenAI‑совместимый chat.completions).
 * Использует JSON‑ответ; модель — GROQ_MODEL.
 */
export async function fetchCityStoryFromGemini({ cityName }) {
  const apiKey = getGeminiApiKey()
  const prompt = buildCityPrompt(cityName)
  const url = 'https://api.groq.com/openai/v1/chat/completions'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.65,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content:
            'You are a historian of the Alash Movement. You must reply ONLY with valid JSON. No markdown, no commentary.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    let apiMessage = ''
    try {
      const parsed = JSON.parse(errText)
      apiMessage = parsed?.error?.message ?? ''
    } catch {
      /* ignore */
    }
    if (res.status === 429) {
      throw new GeminiApiError(
        429,
        apiMessage || 'Quota exceeded (429)',
        errText,
      )
    }
    throw new GeminiApiError(
      res.status,
      apiMessage || `HTTP ${res.status}`,
      errText,
    )
  }

  const json = await res.json()
  const text = json?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from Groq')
  }

  const raw = extractJsonObject(text)
  return normalizePayload(raw)
}

const BOKEIKHANOV_SYSTEM = `You are Alikhan Bukeikhanov (Әлихан Бөкейхан), a respected leader of the early 20th-century Alash movement in Kazakhstan. Speak in his voice: dignified, modernizing, committed to Kazakh autonomy, education, and the rule of law. Ground answers in real history; if uncertain, say so briefly. Mirror the user's language: reply in Kazakh if they write Kazakh, Russian for Russian, English for English. Keep answers focused (about 80–150 words) unless the user asks for more detail. Do not claim to be an AI or a language model.`

/**
 * Короткий диалог «как Әлихан Бөкейхан» (мульти-тёрн).
 * @param {{ role: 'user' | 'assistant', content: string }[]} history
 * @param {string} userText
 */
export async function fetchAlashChatReply({ history = [], userText }) {
  const apiKey = getGeminiApiKey()
  const url = 'https://api.groq.com/openai/v1/chat/completions'

  const safeHistory = Array.isArray(history) ? history : []
  const recent = safeHistory.slice(-10)
  const messages = [
    { role: 'system', content: BOKEIKHANOV_SYSTEM },
    ...recent.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: userText },
  ]

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.72,
      max_tokens: 1024,
      messages,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    let apiMessage = ''
    try {
      const parsed = JSON.parse(errText)
      apiMessage = parsed?.error?.message ?? ''
    } catch {
      /* ignore */
    }
    if (res.status === 429) {
      throw new GeminiApiError(
        429,
        apiMessage || 'Quota exceeded (429)',
        errText,
      )
    }
    throw new GeminiApiError(
      res.status,
      apiMessage || `HTTP ${res.status}`,
      errText,
    )
  }

  const json = await res.json()
  const text = json?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty chat response from Groq')
  }
  return text.trim()
}

export async function geminiGenerateJson({ prompt }) {
  const apiKey = getGeminiApiKey()
  const url = 'https://api.groq.com/openai/v1/chat/completions'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.65,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content:
            'You must reply ONLY with valid JSON matching the requested structure. No markdown, no extra commentary.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new GeminiApiError(res.status, `Groq: ${res.status}`, errText)
  }

  const json = await res.json()
  const text = json?.choices?.[0]?.message?.content
  return extractJsonObject(text)
}
