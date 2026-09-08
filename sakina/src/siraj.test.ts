import test from 'node:test'
import assert from 'node:assert/strict'
import {resolveSirajNavigation} from './siraj'

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
