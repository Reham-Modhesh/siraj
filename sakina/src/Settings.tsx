// Extracted from App.tsx's old inline .settings-panel. Same accessible/
// quiet/closure toggles and demo-location picker, unchanged logic - now a
// modal-style overlay (same family as AskSakina) opened from the tab bar's
// gear icon instead of a corner button. LanguageSwitcher moved to Home's
// header (a visible icon) instead of living here, so it's not duplicated
// in two places.
import {Accessibility, Leaf, Route, MapPin, X} from 'lucide-react'
import {useMap} from './store'
import {pois, nodes} from './navigation'
import {regionAt, regionalText, closureByRegion} from './geography'
import {levelLabel} from './levels'
import {t, floorName, poiName} from './i18n/index'

export default function Settings({open, onClose, onTapToSet}: {open: boolean; onClose: () => void; onTapToSet: () => void}) {
 const s = useMap()
 const lang = s.lang
 const viewed = s.region === 'overview' ? regionAt(s.position) : s.region
 const closure = closureByRegion[viewed]
 if (!open) return null
 return (
  <div className="ask-overlay">
   <div className="ask-sheet settings-sheet">
    <div className="row between"><strong>{t('settings.title', lang)}</strong><button className="icon-button" onClick={onClose} aria-label={t('settings.close_aria', lang)}><X size={18} /></button></div>
    <label><input type="checkbox" checked={s.accessible} onChange={s.toggleAccessible} /><Accessibility size={18} /> {t('settings.accessible_label', lang)}</label>
    <label><input type="checkbox" checked={s.preferQuiet} onChange={s.toggleQuiet} /><Leaf size={18} /> {t('settings.quiet_label', lang)}</label>
    <label><input type="checkbox" disabled={!closure} checked={!!closure && s.closed.includes(closure)} onChange={s.toggleClosure} /><Route size={18} /> {regionalText.regionalClosure[lang]}</label>
    <label className="location-select">{t('settings.demo_location_label', lang)}
     <select aria-label={t('settings.demo_location_aria', lang)} value="" onChange={e => {const p = pois.find(p => p.id === e.target.value)!; s.moveTo(nodes.find(n => n.id === p.nodeId)!.position, p.floor)}}>
      <option value="" disabled>{t('settings.choose_location_placeholder', lang)}</option>
      {pois.map(p => <option key={p.id} value={p.id}>{poiName(p.id, lang)}{!p.id.startsWith('level-') && ' · ' + (p.region === 'haram' ? levelLabel(p.floor, lang) : floorName(p.floor, lang))}</option>)}
     </select>
    </label>
    <button className="secondary w-full" onClick={onTapToSet}><MapPin size={17} />{t('settings.tap_to_set', lang)}</button>
   </div>
  </div>
 )
}
