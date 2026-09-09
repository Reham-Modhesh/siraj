// Integration with Siraj (../siraj/voice_prototype/server.py, POST /ask),
// the multilingual Hajj/Umrah knowledge base. Pure logic - no React, no
// map/store access - so it can be unit tested on its own (siraj.test.ts).
//
// Siraj's 50-location dataset and Sakina's ~30 fictional demo POIs use
// unrelated ids and only partially overlap, so mapping is a small,
// explicit, hand-curated table - never fuzzy/automatic - plus a
// category-level fallback for generic services Sakina can already locate
// via findNearest(). Anything outside both is reported as unmapped
// rather than guessed at.
import type {Category} from './navigation'

// 'localhost' only means "this machine" - when Sakina is opened from
// another device on the network (e.g. a phone hitting the dev machine's
// LAN IP, matching how voice_prototype/server.py binds 0.0.0.0), a
// hardcoded 'localhost' here would point that device at itself instead
// of back at the machine actually running the backend, and every
// request would fail outright (connection refused). Deriving the host
// from the page's own address fixes both cases; typeof window guards
// the Node test environment (siraj.test.ts), which has no window.
const SIRAJ_HOST = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost'
export const SIRAJ_ENDPOINT = `http://${SIRAJ_HOST}:8787/ask`
export const SIRAJ_SPEAK_ENDPOINT = `http://${SIRAJ_HOST}:8787/speak`

// Keeps spoken answers to a reasonable length regardless of which TTS
// provider i18n/tts.py calls (started with Gemini, now openai/gpt-audio
// via OpenRouter) - long text costs more, is slower to generate, and has
// no benefit when the full answer is already shown in writing. Shared by
// every caller of SIRAJ_SPEAK_ENDPOINT (AskSakina.tsx, Home.tsx's ritual
// guide).
const MAX_TTS_CHARS = 700
export function truncateForSpeech(text: string): string {
  if (text.length <= MAX_TTS_CHARS) return text
  const cut = text.slice(0, MAX_TTS_CHARS)
  const breakAt = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('. '), cut.lastIndexOf('؛'), cut.lastIndexOf('.\n'))
  return (breakAt > MAX_TTS_CHARS * 0.4 ? cut.slice(0, breakAt) : cut).trim() + '…'
}

// Siraj location_id -> Sakina POI id, for the handful of places that
// genuinely exist in both datasets.
export const SIRAJ_TO_SAKINA_POI: Record<string, string> = {
  'MCH-LMK-003': 'clock-tower', // Existing Siraj dataset: Abraj Al Bait
  'MCH-CORE-001': 'kaaba', // الكعبة المشرفة / المطاف
  'MCH-CORE-003': 'maqam', // مقام إبراهيم
  'MCH-CORE-004': 'safa', // جبل الصفا
  'MCH-CORE-005': 'marwa', // جبل المروة
  'MCH-CORE-006': 'zamzam', // نقاط توزيع مياه زمزم
  'MCH-GATE-079': 'gate-fahd', // باب الملك فهد
}

// Siraj `category` field (free text) substring -> Sakina Category, used
// with findNearest() when there's no single exact POI to jump to.
export const SIRAJ_CATEGORY_FALLBACK: [string, Category][] = [
  ['دورات مياه', 'toilet'],
  ['إسعاف', 'medical'],
  ['مصاعد', 'elevator'],
  ['عربات', 'cart'],
]

export interface SirajToolCall {
  tool: string
  input: Record<string, unknown>
  result: unknown
}

export interface SirajResult {
  answer: string
  categories: string[]
  tool_calls: SirajToolCall[]
  lang: string
  question_ar: string
}

export type SirajNavResult =
  | {type: 'navigate'; poiId: string}
  | {type: 'nearest'; category: Category}
  | {type: 'unmapped'}
  | {type: 'none'}

function firstLocationRecord(toolCalls: SirajToolCall[]): Record<string, string> | null {
  for (const call of toolCalls) {
    if (call.tool !== 'search_locations' && call.tool !== 'get_location_details') continue
    const result = call.result
    if (Array.isArray(result)) {
      if (result.length && typeof result[0] === 'object') return result[0] as Record<string, string>
    } else if (result && typeof result === 'object') {
      return result as Record<string, string>
    }
  }
  return null
}

// Decides what, if anything, Sakina's map should do with a Siraj answer.
// Only ever acts on the "locations" category - services/faq answers are
// informational only (matches the "ask about Zamzam -> navigate there"
// scenario, which is a locations question).
export function resolveSirajNavigation(result: Pick<SirajResult, 'categories' | 'tool_calls'>): SirajNavResult {
  if (!result.categories.includes('locations')) return {type: 'none'}

  const record = firstLocationRecord(result.tool_calls)
  if (!record) return {type: 'unmapped'}

  const locationId = record.location_id
  if (locationId && SIRAJ_TO_SAKINA_POI[locationId]) {
    return {type: 'navigate', poiId: SIRAJ_TO_SAKINA_POI[locationId]}
  }

  const category = record.category || ''
  for (const [needle, sakinaCategory] of SIRAJ_CATEGORY_FALLBACK) {
    if (category.includes(needle)) return {type: 'nearest', category: sakinaCategory}
  }

  return {type: 'unmapped'}
}

export async function askSiraj(question: string, lang: string): Promise<SirajResult> {
  const res = await fetch(SIRAJ_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({question, lang}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Siraj request failed (${res.status})`)
  return data as SirajResult
}
