const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'

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
  if (!GEMINI_API_KEY?.trim()) {
    throw new Error(
      'VITE_GEMINI_API_KEY is missing. Add it to .env locally and restart the dev server.',
    )
  }
  return GEMINI_API_KEY.trim()
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
 * Calls Google AI Studio (Gemini) generateContent over REST.
 * Requires VITE_GEMINI_API_KEY in .env
 */
export async function fetchCityStoryFromGemini({ cityName }) {
  const key = getGeminiApiKey()
  const prompt = buildCityPrompt(cityName)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL,
  )}:generateContent?key=${encodeURIComponent(key)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.65,
        responseMimeType: 'application/json',
      },
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
  const part = json?.candidates?.[0]?.content?.parts?.[0]
  const text = part?.text
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from Gemini')
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
export async function fetchAlashChatReply({ history, userText }) {
  const key = getGeminiApiKey()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL,
  )}:generateContent?key=${encodeURIComponent(key)}`

  const recent = history.slice(-10)
  const contents = [
    ...recent.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userText }] },
  ]

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: BOKEIKHANOV_SYSTEM }] },
      contents,
      generationConfig: {
        temperature: 0.72,
        maxOutputTokens: 1024,
      },
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
  const part = json?.candidates?.[0]?.content?.parts?.[0]
  const text = part?.text
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty chat response from Gemini')
  }
  return text.trim()
}

export async function geminiGenerateJson({ prompt }) {
  const key = getGeminiApiKey()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL,
  )}:generateContent?key=${encodeURIComponent(key)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.65,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new GeminiApiError(res.status, `Gemini: ${res.status}`, errText)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
  return extractJsonObject(text)
}
