export type Lang = 'ar' | 'en' | 'ur' | 'id' | 'tr' | 'fr' | 'fa'

export const LANGS: {code: Lang; label: string}[] = [
 {code: 'ar', label: 'العربية'},
 {code: 'en', label: 'English'},
 {code: 'ur', label: 'اردو'},
 {code: 'id', label: 'Bahasa Indonesia'},
 {code: 'tr', label: 'Türkçe'},
 {code: 'fr', label: 'Français'},
 {code: 'fa', label: 'فارسی'},
]

export const RTL_LANGS: Set<Lang> = new Set(['ar', 'ur', 'fa'])

export function dirFor(lang: Lang): 'rtl' | 'ltr' {
 return RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
}

// Intl.NumberFormat/toLocaleString tags - a distinct concern from Web
// Speech API locales (see VoiceAssistant.tsx::SPEECH_LOCALE), even where
// the values happen to look similar.
const INTL_LOCALE: Record<Lang, string> = {
 ar: 'ar-SA',
 en: 'en-US',
 ur: 'ur-PK',
 id: 'id-ID',
 tr: 'tr-TR',
 fr: 'fr-FR',
 fa: 'fa-IR',
}

export function localeFor(lang: Lang): string {
 return INTL_LOCALE[lang]
}
