/**
 * В продакшене (Vercel) ключ Groq нельзя держать в браузере.
 * Поэтому фронт ходит на Serverless Function `/api/groq`, а ключ хранится на сервере.
 */
const API_URL = '/api/groq'

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
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'cityStory',
      cityName,
      prompt,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    let errCode = ''
    let apiMessage = ''
    try {
      const parsed = JSON.parse(errText)
      errCode = parsed?.error?.code ?? ''
      apiMessage = parsed?.error?.message ?? ''
    } catch {
      /* ignore */
    }
    if (errCode === 'missing_key' || res.status === 401 || res.status === 403) {
      throw new Error(NO_GEMINI_KEY_MESSAGE)
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
  const text = json?.content
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
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'chat',
      history: safeHistory,
      userText,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    let errCode = ''
    let apiMessage = ''
    try {
      const parsed = JSON.parse(errText)
      errCode = parsed?.error?.code ?? ''
      apiMessage = parsed?.error?.message ?? ''
    } catch {
      /* ignore */
    }
    if (errCode === 'missing_key' || res.status === 401 || res.status === 403) {
      throw new Error(NO_GEMINI_KEY_MESSAGE)
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
  const text = json?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty chat response from AI')
  }
  return text.trim()
}

export async function geminiGenerateJson({ prompt }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'json',
      prompt,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    let errCode = ''
    try {
      const parsed = JSON.parse(errText)
      errCode = parsed?.error?.code ?? ''
    } catch {
      /* ignore */
    }
    if (errCode === 'missing_key' || res.status === 401 || res.status === 403) {
      throw new Error(NO_GEMINI_KEY_MESSAGE)
    }
    throw new GeminiApiError(res.status, `AI: ${res.status}`, errText)
  }

  const json = await res.json()
  const text = json?.content
  return extractJsonObject(text)
}
