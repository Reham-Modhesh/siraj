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
import {ritual, ritualField} from './i18n/ritual'
import {t} from './i18n/index'
import type {Lang} from './i18n/types'

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

// Siraj's dataset is locations-only (gates, facilities, landmarks) - it
// has no content on HOW to actually perform tawaf/sai/the post-tawaf
// prayer, so those questions always come back as its "no reliable
// answer" fallback (confirmed by asking it directly). Sakina already has
// real, sourced content for exactly this - i18n/ritual.ts, sourced from
// Nusuk and Sahih Muslim/Bukhari, already shown in the ritual-guide
// popup - so answer these questions from that instead of surfacing
// Siraj's dead end for something the app already knows. Matched against
// question_ar (Siraj always returns this, regardless of the question's
// original language), so this works no matter which of the 7 languages
// the pilgrim asks in. Order matters: the prayer pattern must be checked
// before the tawaf one, since "ركعتا الطواف" contains "طواف".
//
// Requires an instructional-intent word (كيف/خطوات/كم شوط/دعاء/ماذا
// أفعل...) on top of the topic keyword - topic alone isn't enough.
// "صفا"/"سعي" also show up in plain "وين الصفا؟" location questions,
// which Siraj already answers correctly (confirmed: it recognizes
// Safa/Marwa as real places) - matching on topic alone would hijack
// that working case and show ritual how-to instead of the location
// facts actually asked for.
const RITUAL_INTENT = /كيف|متى|خطوات|طريقة|كم شوط|كم مرة|كم ركعة|ماذا (أ|ا)قول|ماذا (أ|ا)فعل|وش (أ|ا)سوي|ايش (أ|ا)سوي|ماذا بعد|وش بعد|أدعية|ادعية|أذكار|اذكار|دعاء/
// 'completion' (shaving/trimming after sa'i) must be checked before
// 'sai', since "ماذا أفعل بعد السعي؟" contains "السعي" too.
const RITUAL_FAQ_PATTERNS: [RegExp, 'tawaf' | 'prayer' | 'sai' | 'completion'][] = [
  [/ركع|صلاة الطواف/, 'prayer'],
  [/حلق|تقصير|قصّر|قصر شعر|بعد السعي|بعد الصفا والمروة|انتهيت من السعي|خلصت السعي|اكملت السعي/, 'completion'],
  [/سعي|أسعى|اسعى|صفا|مروة|المسعى/, 'sai'],
  [/طواف|أطوف|اطوف/, 'tawaf'],
]

export function matchRitualFaq(questionAr: string): 'tawaf' | 'prayer' | 'sai' | 'completion' | null {
  if (!RITUAL_INTENT.test(questionAr)) return null
  for (const [pattern, type] of RITUAL_FAQ_PATTERNS) {
    if (pattern.test(questionAr)) return type
  }
  return null
}

export function ritualFaqAnswer(type: 'tawaf' | 'prayer' | 'sai' | 'completion', lang: Lang): string {
  // Source/citation deliberately left out here - this is the spoken/
  // read Q&A answer, not the ritual-guide popup (Home.tsx), which still
  // shows the source as a proper clickable link for whoever wants it.
  const entry = ritual[type]
  return [
    ritualField(entry, 'title', lang),
    ritualField(entry, 'explanation', lang),
    `${t('guide.dhikr_heading', lang)}: ${entry.dhikr}` + (lang !== 'ar' ? ` (${ritualField(entry, 'dhikrMeaning', lang)})` : ''),
    ritualField(entry, 'dhikrNote', lang),
  ].filter(Boolean).join('\n\n')
}

// Siraj location_id -> Sakina POI id, for the handful of places that
// genuinely exist in both datasets.
export const SIRAJ_TO_SAKINA_POI: Record<string, string> = {
  'MCH-LMK-003': 'clock-tower', // Existing Siraj dataset: Abraj Al Bait
  'MCH-CORE-001': 'kaaba', // الكعبة المشرفة / المطاف
  'MCH-CORE-002': 'mataf', // الحجر الأسود - في زاوية الكعبة عند المطاف، لا نقطة مستقلة في سكينة
  'MCH-CORE-003': 'maqam', // مقام إبراهيم
  'MCH-CORE-004': 'safa', // جبل الصفا
  'MCH-CORE-005': 'marwa', // جبل المروة
  'MCH-CORE-006': 'zamzam', // نقاط توزيع مياه زمزم
  'MCH-GATE-079': 'gate-fahd', // باب الملك فهد
}

// Siraj `category` field (free text) substring -> Sakina Category, used
// with findNearest() when there's no single exact POI to jump to. Siraj's
// dataset has 27 named gates (5 main + 22 historical/secondary) and 8
// accessibility entries, none with a 1:1 Sakina counterpart of their own
// (Sakina only models a handful of generic gate/accessible POIs) - these
// two fallbacks are what stop the large majority of "أين باب ...؟" and
// accessibility questions from reporting unmapped, by pointing at the
// nearest gate/accessible-prayer-area Sakina actually has instead.
export const SIRAJ_CATEGORY_FALLBACK: [string, Category][] = [
  ['دورات مياه', 'toilet'],
  ['إسعاف', 'medical'],
  ['مصاعد', 'elevator'],
  ['عربات', 'cart'],
  ['بوابة', 'gate'],
  ['إمكانية وصول', 'accessible'],
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
