/**
 * Vercel Serverless Function proxy for Groq (OpenAI-compatible).
 *
 * IMPORTANT:
 * - This repo uses `"type": "module"`, so this file MUST be ESM (no require/module.exports).
 *
 * Configure in Vercel Project Settings → Environment Variables:
 *  - GROQ_API_KEY
 *  - GROQ_MODEL (optional, default llama-3.3-70b-versatile)
 */

import { fetch as undiciFetch } from 'undici'

const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

// Ensure fetch exists (Node 18 has it, but keep a safe fallback).
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = undiciFetch
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

async function groqChatCompletions({ apiKey, model, messages, responseFormat }) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
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
    const msg = parsed?.error?.message || `Groq HTTP ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    err.body = text
    throw err
  }

  return parsed
}

export default async function handler(req, res) {
  const apiKey = process.env.GROQ_API_KEY
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL

  // Safe diagnostics endpoint (does not reveal secrets).
  if (req.method === 'GET') {
    return json(res, 200, {
      ok: true,
      hasKey: Boolean(apiKey && String(apiKey).trim()),
      model,
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return json(res, 405, { error: { message: 'Method not allowed' } })
  }

  if (!apiKey || !String(apiKey).trim()) {
    return json(res, 500, {
      error: {
        code: 'missing_key',
        message: 'GROQ_API_KEY is not configured on the server',
      },
    })
  }

  let body
  try {
    body = await readBody(req)
  } catch {
    return json(res, 400, { error: { message: 'Invalid JSON body' } })
  }

  const type = body?.type

  try {
    if (type === 'cityStory') {
      const cityName = String(body?.cityName || '').trim()
      if (!cityName) return json(res, 400, { error: { message: 'cityName is required' } })

      const prompt = `Act as an expert historian on the Alash Movement. Provide a detailed, engaging description in English, Kazakh, and Russian of the key historical events that occurred in ${cityName} between 1905 and 1920. Also suggest URLs for 2 relevant historical images from Wikimedia Commons or similar free archives (must be direct https URLs to image files), and suggest a topic for a potential audio narration.\n\nReturn ONLY valid JSON with this exact shape (no markdown, no code fences):\n{\n  \"descriptions\": {\"en\": \"string\", \"kz\": \"string\", \"ru\": \"string\"},\n  \"imageUrls\": [\"https://...\", \"https://...\"],\n  \"audioTopic\": \"string\"\n}`

      const out = await groqChatCompletions({
        apiKey,
        model,
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

      return json(res, 200, { content: out?.choices?.[0]?.message?.content ?? '' })
    }

    if (type === 'json') {
      const prompt = String(body?.prompt || '').trim()
      if (!prompt) return json(res, 400, { error: { message: 'prompt is required' } })

      const out = await groqChatCompletions({
        apiKey,
        model,
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

      return json(res, 200, { content: out?.choices?.[0]?.message?.content ?? '' })
    }

    if (type === 'chat') {
      const userText = String(body?.userText || '').trim()
      const history = Array.isArray(body?.history) ? body.history : []
      if (!userText) return json(res, 400, { error: { message: 'userText is required' } })

      const system = `You are Alikhan Bukeikhanov (Әлихан Бөкейхан), a respected leader of the early 20th-century Alash movement in Kazakhstan. Speak in his voice: dignified, modernizing, committed to Kazakh autonomy, education, and the rule of law. Ground answers in real history; if uncertain, say so briefly. Mirror the user's language: reply in Kazakh if they write Kazakh, Russian for Russian, English for English. Keep answers focused (about 80–150 words) unless the user asks for more detail. Do not claim to be an AI or a language model.`

      const recent = history.slice(-10).map((m) => ({
        role: m?.role === 'assistant' ? 'assistant' : 'user',
        content: String(m?.content ?? ''),
      }))

      const out = await groqChatCompletions({
        apiKey,
        model,
        messages: [
          { role: 'system', content: system },
          ...recent,
          { role: 'user', content: userText },
        ],
      })

      return json(res, 200, { content: out?.choices?.[0]?.message?.content ?? '' })
    }

    return json(res, 400, { error: { message: 'Unknown type' } })
  } catch (e) {
    const status = Number(e?.status) || 500
    return json(res, status, {
      error: {
        message: e instanceof Error ? e.message : String(e),
      },
    })
  }
}

