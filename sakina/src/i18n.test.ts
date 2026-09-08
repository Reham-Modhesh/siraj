import test from 'node:test'
import assert from 'node:assert/strict'
import {dirFor, LANGS, t, formatNumber} from './i18n/index'
import {ar} from './i18n/locales/ar'
import {en} from './i18n/locales/en'
import {ur} from './i18n/locales/ur'
import {id as idLocale} from './i18n/locales/id'
import {tr} from './i18n/locales/tr'
import {fr} from './i18n/locales/fr'
import {fa} from './i18n/locales/fa'
import {POI_NAMES, STAGE_NAMES, STAGE_HINTS, FLOOR_NAMES, CATEGORY_NAMES} from './i18n/poi'
import {ritual} from './i18n/ritual'
import {pois, stages, floors, categories, resolveDestination} from './navigation'

const ALL_LOCALES = {ar, en, ur, id: idLocale, tr, fr, fa} as const
const LANG_CODES = LANGS.map(l => l.code)

test('dirFor returns rtl for ar/ur/fa and ltr for en/id/tr/fr', () => {
 assert.equal(dirFor('ar'), 'rtl')
 assert.equal(dirFor('ur'), 'rtl')
 assert.equal(dirFor('fa'), 'rtl')
 assert.equal(dirFor('en'), 'ltr')
 assert.equal(dirFor('id'), 'ltr')
 assert.equal(dirFor('tr'), 'ltr')
 assert.equal(dirFor('fr'), 'ltr')
})

test('every locale has exactly the same UI translation keys as the base (ar) locale', () => {
 const baseKeys = Object.keys(ar).sort()
 for (const [lang, locale] of Object.entries(ALL_LOCALES)) {
  assert.deepEqual(Object.keys(locale).sort(), baseKeys, `${lang} key set mismatch`)
 }
})

test('every POI has a localized name in all 7 languages', () => {
 for (const poi of pois) {
  const entry = POI_NAMES[poi.id]
  assert.ok(entry, `missing POI_NAMES entry for "${poi.id}"`)
  for (const lang of LANG_CODES) assert.ok(entry[lang], `POI "${poi.id}" missing name for "${lang}"`)
 }
})

test('every stage has name + hint in all 7 languages', () => {
 stages.forEach((_, i) => {
  assert.ok(STAGE_NAMES[i], `missing stage name entry for index ${i}`)
  assert.ok(STAGE_HINTS[i], `missing stage hint entry for index ${i}`)
  for (const lang of LANG_CODES) {
   assert.ok(STAGE_NAMES[i][lang], `stage ${i} missing name for "${lang}"`)
   assert.ok(STAGE_HINTS[i][lang], `stage ${i} missing hint for "${lang}"`)
  }
 })
})

test('every floor and category has a localized name in all 7 languages', () => {
 for (const floor of floors) {
  const entry = FLOOR_NAMES[floor.id]
  assert.ok(entry, `missing floor name for id ${floor.id}`)
  for (const lang of LANG_CODES) assert.ok(entry[lang], `floor ${floor.id} missing "${lang}"`)
 }
 for (const category of categories) {
  const entry = CATEGORY_NAMES[category.id]
  assert.ok(entry, `missing category name for "${category.id}"`)
  for (const lang of LANG_CODES) assert.ok(entry[lang], `category ${category.id} missing "${lang}"`)
 }
})

test('every ritual entry has all required per-language fields, dhikr stored once in Arabic', () => {
 for (const [key, entry] of Object.entries(ritual)) {
  assert.equal(typeof entry.dhikr, 'string', `${key}.dhikr must be a single Arabic string`)
  for (const field of ['dhikrMeaning', 'title', 'explanation', 'story', 'dhikrNote', 'source'] as const) {
   for (const lang of LANG_CODES) assert.ok(entry[field][lang], `ritual "${key}".${field} missing "${lang}"`)
  }
 }
})

test('t() interpolates variables correctly', () => {
 assert.equal(t('search.go_to', 'en', {name: 'Zamzam'}), 'Go to Zamzam')
 assert.equal(t('nav.arrived_at', 'ar', {name: 'زمزم'}), 'وصلت إلى زمزم')
})

test('t() substitutes missing interpolation vars with empty string instead of throwing', () => {
 assert.doesNotThrow(() => t('search.go_to', 'en'))
 assert.equal(t('search.go_to', 'en'), 'Go to ')
})

test('t() falls back to Arabic (never the raw key) for an unrecognized language code', () => {
 const result = t('webgl.title', 'xx' as any)
 assert.equal(result, ar['webgl.title'])
 assert.notEqual(result, 'webgl.title')
})

test('formatNumber uses a locale-aware digit system', () => {
 assert.equal(formatNumber(5, 'en'), '5')
 // Arabic-Indic digits differ from ASCII digits for the ar-SA locale.
 assert.notEqual(formatNumber(5, 'ar'), formatNumber(5, 'en'))
})

test('resolveDestination: Arabic POI matching still works (regression)', () => {
 assert.equal(resolveDestination('وين الصفا؟').id, 'safa')
 assert.equal(resolveDestination('أبغى أروح للمسعى').id, 'safa')
})

test('resolveDestination: localized POI names resolve in the given language', () => {
 assert.equal(resolveDestination('Zamzam', 'en').id, 'zamzam')
 assert.equal(resolveDestination('Where is Safa?', 'en').id, 'safa')
 assert.equal(resolveDestination('Take me to King Fahd Gate', 'en').id, 'gate-fahd')
})

test('resolveDestination: a non-Latin language resolves a POI name too', () => {
 // "Safa" in Urdu.
 assert.equal(resolveDestination('صفا کہاں ہے؟', 'ur').id, 'safa')
})

test('resolveDestination: arbitrary natural-language questions are not falsely handled locally', () => {
 assert.deepEqual(resolveDestination('What is the ruling on Hajj by proxy?', 'en'), {})
 assert.deepEqual(resolveDestination('هل يجوز الحج عن شخص آخر؟'), {})
})
