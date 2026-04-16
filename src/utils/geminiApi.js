/**
 * В продакшене (Vercel) ключ Groq нельзя держать в браузере.
 * Поэтому фронт ходит на Serverless Function `/api/groq`, а ключ хранится на сервере.
 */
const API_URL = '/api/groq'
const DEV_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
const DEV_GROQ_MODEL =
  import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

/** Сообщение об ошибке, если ключ не задан (обрабатывается в UI). */
export const NO_GEMINI_KEY_MESSAGE = 'NO_GEMINI_KEY'

export function isGeminiConfigured() {
  // Ключ находится на сервере, поэтому на клиенте всегда пытаемся.
  return true
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

async function fetchApiJson({ path, payload }) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  // Local Vite dev server doesn't serve Vercel /api routes.
  if (import.meta.env.DEV && res.status === 404) {
    return { __notFound: true }
  }

  const text = await res.text()
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = null
  }

  if (!res.ok) {
    const errCode = parsed?.error?.code ?? ''
    const apiMessage = parsed?.error?.message ?? ''
    if (errCode === 'missing_key' || res.status === 401 || res.status === 403) {
      throw new Error(NO_GEMINI_KEY_MESSAGE)
    }
    if (res.status === 429) {
      throw new GeminiApiError(429, apiMessage || 'Quota exceeded (429)', text)
    }
    throw new GeminiApiError(res.status, apiMessage || `HTTP ${res.status}`, text)
  }

  return parsed
}

async function groqDirectChat({ messages, responseFormat }) {
  const apiKey = String(DEV_GROQ_KEY ?? '').trim()
  if (!apiKey) throw new Error(NO_GEMINI_KEY_MESSAGE)
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEV_GROQ_MODEL,
      temperature: 0.72,
      max_tokens: 1024,
      messages,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  })

  const text = await res.text()
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = null
  }

  if (!res.ok) {
    const apiMessage = parsed?.error?.message ?? ''
    if (res.status === 429) {
      throw new GeminiApiError(429, apiMessage || 'Quota exceeded (429)', text)
    }
    throw new GeminiApiError(res.status, apiMessage || `HTTP ${res.status}`, text)
  }

  return parsed?.choices?.[0]?.message?.content ?? ''
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
  const prompt = buildCityPrompt(cityName)
  const api = await fetchApiJson({
    path: API_URL,
    payload: { type: 'cityStory', cityName, prompt },
  })

  let text = api?.content
  if (api?.__notFound) {
    text = await groqDirectChat({
      responseFormat: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a historian of the Alash Movement. Reply ONLY with valid JSON. No markdown, no commentary.',
        },
        { role: 'user', content: prompt },
      ],
    })
  }

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from AI')
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
  const safeHistory = Array.isArray(history) ? history : []
  const api = await fetchApiJson({
    path: API_URL,
    payload: { type: 'chat', history: safeHistory, userText },
  })

  let text = api?.content
  if (api?.__notFound) {
    const recent = safeHistory.slice(-10).map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: String(m?.content ?? ''),
    }))
    text = await groqDirectChat({
      messages: [
        { role: 'system', content: BOKEIKHANOV_SYSTEM },
        ...recent,
        { role: 'user', content: userText },
      ],
    })
  }

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty chat response from AI')
  }
  return text.trim()
}

export async function geminiGenerateJson({ prompt }) {
  const api = await fetchApiJson({
    path: API_URL,
    payload: { type: 'json', prompt },
  })

  let text = api?.content
  if (api?.__notFound) {
    text = await groqDirectChat({
      responseFormat: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You must reply ONLY with valid JSON matching the requested structure. No markdown, no extra commentary.',
        },
        { role: 'user', content: prompt },
      ],
    })
  }

  return extractJsonObject(text)
}
