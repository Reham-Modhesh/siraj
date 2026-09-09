// Explore screen: no map here - grouped-by-category list of the current
// region's POIs, each section showing a couple of rows plus a "more" /
// "less" expand toggle. Reuses the same POI data App.tsx used to filter
// for its old always-visible services-dock/explore-list, just grouped.
import {useState} from 'react'
import {MapPin, LocateFixed, Footprints, Droplets, Accessibility, DoorOpen, HeartPulse, Users, ArrowUpDown, ArrowUpLeft, ChevronLeft, ChevronRight, ChevronUp} from 'lucide-react'
import {useMap} from './store'
import {pois, categories} from './navigation'
import {regionNames} from './geography'
import {levelLabel} from './levels'
import {t, dirFor, poiName, floorName, categoryName} from './i18n/index'

const icons: Record<string, typeof MapPin> = {ritual: Footprints, gate: DoorOpen, water: Droplets, toilet: Users, medical: HeartPulse, cart: Accessibility, elevator: ArrowUpDown, escalator: ArrowUpLeft, meeting: Users, accessible: Accessibility}

export default function Explore({onPick}: {onPick: (id: string) => void}) {
 const s = useMap()
 const lang = s.lang
 const Chevron = dirFor(lang) === 'rtl' ? ChevronLeft : ChevronRight
 const [expanded, setExpanded] = useState<Set<string>>(new Set())
 const inRegion = pois.filter(p => s.region === 'overview' || p.region === s.region)
 const sections = categories.map(c => ({c, items: inRegion.filter(p => p.category === c.id)})).filter(sec => sec.items.length)
 return (
  <section className="explore-screen">
   <div className="explore-header"><h1>{t('explore.header_title', lang)}</h1></div>
   <div className="explore-sections">
    {sections.map(({c, items}) => {
     const open = expanded.has(c.id)
     const shown = open ? items : items.slice(0, 2)
     const Icon = icons[c.id]
     return (
      <div className="explore-section" key={c.id}>
       <div className="explore-section-header">
        <b><span style={{color: c.color}}><Icon size={16} /></span>{categoryName(c.id, lang)}</b>
        {items.length > 2 && <button className="explore-more-link" onClick={() => setExpanded(prev => {const next = new Set(prev); next.has(c.id) ? next.delete(c.id) : next.add(c.id); return next})}>{open ? t('explore.section_less', lang) : t('explore.section_more', lang)}{open ? <ChevronUp size={13} /> : <Chevron size={13} />}</button>}
       </div>
       {shown.map(p => (
        <button className="explore-item" key={p.id} onClick={() => onPick(p.id)}>
         <span style={{color: p.color, background: p.color + '16'}}><Icon size={19} /></span>
         <div><strong>{poiName(p.id, lang)}</strong><small>{regionNames[p.region][lang]} · {(p.region === 'haram' ? levelLabel(p.floor, lang) : floorName(p.floor, lang))}</small></div>
         <Chevron size={15} />
        </button>
       ))}
       <button className="explore-nearest" onClick={() => {const id = s.nearest(c.id); if (id) onPick(id)}}><LocateFixed size={14} />{t('explore.find_nearest', lang)}</button>
      </div>
     )
    })}
   </div>
  </section>
 )
}
