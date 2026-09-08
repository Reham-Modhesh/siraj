// The ONLY import path the rest of the app should use for i18n. Nothing
// outside src/i18n/* should import locales/poi/ritual/format directly.
export type {Lang} from './types'
export {LANGS, RTL_LANGS, dirFor, localeFor} from './types'
export type {TranslationKey} from './locales/ar'
export {t, formatNumber} from './format'
export {poiName, stageName, stageHint, floorName, categoryName, nodeName} from './poi'
export {ritual, ritualField} from './ritual'
export type {RitualEntry} from './ritual'
