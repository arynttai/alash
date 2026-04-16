import { fetchCityStoryFromGemini } from '../utils/geminiApi.js'

/** @deprecated Prefer fetchCityStoryFromGemini / useGeminiCityContent */
export async function handleQueryAI(context) {
  try {
    const city = context?.city
    if (!city) throw new Error('city is required')
    const data = await fetchCityStoryFromGemini({ cityName: city })
    return { ok: true, message: JSON.stringify(data, null, 2), context }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      context,
    }
  }
}
