import type {Lang} from './types'
import {localeFor} from './types'
import {ar, type TranslationKey} from './locales/ar'
import {en} from './locales/en'
import {ur} from './locales/ur'
import {id} from './locales/id'
import {tr} from './locales/tr'
import {fr} from './locales/fr'
import {fa} from './locales/fa'

const LOCALES: Record<Lang, Record<TranslationKey, string>> = {ar, en, ur, id, tr, fr, fa}

const warned = new Set<string>()
function devWarnOnce(message: string) {
 if (typeof import.meta !== 'undefined' && !import.meta.env?.DEV) return
 if (warned.has(message)) return
 warned.add(message)
 console.warn(message)
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
 // Any {placeholder} left in the template is substituted, defaulting to
 // '' when `vars` is missing entirely or just lacks that key - a
 // template is never shown to the user with a raw {placeholder} in it.
 return template.replace(/\{(\w+)\}/g, (_, key: string) => (vars?.[key] !== undefined ? String(vars[key]) : ''))
}

/** Translate `key` for `lang`. Falls back to Arabic, then to the key
 * itself only as an absolute last resort (never silently shown to a
 * real user - the fallback-to-Arabic case covers every real key since
 * `ar` always has every key by construction). */
export function t(key: TranslationKey, lang: Lang, vars?: Record<string, string | number>): string {
 const template = LOCALES[lang]?.[key] ?? LOCALES.ar[key]
 if (LOCALES[lang]?.[key] === undefined) devWarnOnce(`[i18n] missing key "${key}" for lang "${lang}", falling back to ar`)
 if (template === undefined) {
  devWarnOnce(`[i18n] unknown translation key "${key}"`)
  return ''
 }
 return interpolate(template, vars)
}

export function formatNumber(n: number, lang: Lang): string {
 return n.toLocaleString(localeFor(lang))
}

export {LOCALES}
