import test from 'node:test'
import assert from 'node:assert/strict'
import {resolveSirajNavigation, matchRitualFaq, ritualFaqAnswer} from './siraj'

test('mapped location_id resolves to navigate', () => {
  const r = resolveSirajNavigation({
    categories: ['locations'],
    tool_calls: [{tool: 'search_locations', input: {}, result: [{location_id: 'MCH-CORE-006', category: 'خدمة - مياه زمزم'}]}],
  })
  assert.deepEqual(r, {type: 'navigate', poiId: 'zamzam'})
})

test('get_location_details (single object result) also resolves', () => {
  const r = resolveSirajNavigation({
    categories: ['locations'],
    tool_calls: [{tool: 'get_location_details', input: {}, result: {location_id: 'MCH-CORE-003', category: 'نسك أساسي - مقام إبراهيم'}}],
  })
  assert.deepEqual(r, {type: 'navigate', poiId: 'maqam'})
})

test('ritual FAQ matching: prayer beats tawaf even though "ركعتا الطواف" contains "طواف"', () => {
  assert.equal(matchRitualFaq('كم ركعة بعد الطواف'), 'prayer')
  assert.equal(matchRitualFaq('ماذا أقول في صلاة الطواف'), 'prayer')
})

test('ritual FAQ matching: sai keywords resolve to sai, plain tawaf to tawaf', () => {
  assert.equal(matchRitualFaq('كيف أسعى بين الصفا والمروة'), 'sai')
  assert.equal(matchRitualFaq('كيف أطوف حول الكعبة'), 'tawaf')
})

test('ritual FAQ matching: unrelated questions return null', () => {
  assert.equal(matchRitualFaq('وين أقرب دورة مياه'), null)
  assert.equal(matchRitualFaq('هل يوجد مواقف سيارات'), null)
})

test('ritual FAQ matching: plain location questions naming Safa/Marwa/Tawaf are not hijacked', () => {
  // These contain the same topic keywords as the how-to questions above,
  // but no instructional-intent word - Siraj already answers these
  // correctly with real location facts, so matchRitualFaq must stay out
  // of the way here.
  assert.equal(matchRitualFaq('وين الصفا'), null)
  assert.equal(matchRitualFaq('كم يبعد المطاف عن باب الملك فهد'), null)
})

test('ritual FAQ answer text is non-empty and localized per language', () => {
  const ar = ritualFaqAnswer('tawaf', 'ar')
  const en = ritualFaqAnswer('tawaf', 'en')
  assert.ok(ar.length > 0 && en.length > 0)
  assert.notEqual(ar, en)
})

test('unmapped location_id but known category falls back to nearest', () => {
  const r = resolveSirajNavigation({
    categories: ['locations'],
    tool_calls: [{tool: 'search_locations', input: {}, result: [{location_id: 'MCH-GAP-001', category: 'خدمة - دورات مياه'}]}],
  })
  assert.deepEqual(r, {type: 'nearest', category: 'toilet'})
})

test('fully unmapped location (no id match, no category fallback) is reported honestly', () => {
  const r = resolveSirajNavigation({
    categories: ['locations'],
    tool_calls: [{tool: 'search_locations', input: {}, result: [{location_id: 'MCH-LMK-001', category: 'معلم تاريخي/ديني - جبل ومغارة'}]}],
  })
  assert.deepEqual(r, {type: 'unmapped'})
})

test('locations category with no results at all is unmapped, not a crash', () => {
  const r = resolveSirajNavigation({
    categories: ['locations'],
    tool_calls: [{tool: 'search_locations', input: {}, result: []}],
  })
  assert.deepEqual(r, {type: 'unmapped'})
})

test('services/faq-only answers never trigger navigation', () => {
  assert.deepEqual(resolveSirajNavigation({categories: ['services'], tool_calls: []}), {type: 'none'})
  assert.deepEqual(resolveSirajNavigation({categories: ['faq'], tool_calls: []}), {type: 'none'})
  assert.deepEqual(resolveSirajNavigation({categories: [], tool_calls: []}), {type: 'none'})
})

test('a multi-category answer (locations + faq) still resolves navigation from the locations tool call', () => {
  const r = resolveSirajNavigation({
    categories: ['locations', 'faq'],
    tool_calls: [
      {tool: 'search_locations', input: {}, result: [{location_id: 'MCH-CORE-004', category: 'نسك أساسي - المسعى'}]},
      {tool: 'search_faq', input: {}, result: []},
    ],
  })
  assert.deepEqual(r, {type: 'navigate', poiId: 'safa'})
})
