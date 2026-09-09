// Explore screen: no map here - grouped-by-category list of the current
// region's POIs, each section showing a couple of rows plus a "more" /
// "less" expand toggle. Reuses the same POI data App.tsx used to filter
// for its old always-visible services-dock/explore-list, just grouped.
import {useEffect, useRef, useState} from 'react'
import {MapPin, LocateFixed, Footprints, Droplets, Accessibility, DoorOpen, HeartPulse, Users, ArrowUpDown, ArrowUpLeft, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, LayoutGrid} from 'lucide-react'
import {useMap} from './store'
import {pois, categories, shortestPath} from './navigation'
import {regionNames} from './geography'
import {levelLabel} from './levels'
import {t, formatNumber, dirFor, poiName, floorName, categoryName} from './i18n/index'

const icons: Record<string, typeof MapPin> = {ritual: Footprints, gate: DoorOpen, water: Droplets, toilet: Users, medical: HeartPulse, cart: Accessibility, elevator: ArrowUpDown, escalator: ArrowUpLeft, meeting: Users, accessible: Accessibility}

// Real-route distance (same pathfinding used for navigation/"find nearest") shown on the
// opposite side of each item's label - not a placeholder, reflects the current position.
function distanceLabel(s: ReturnType<typeof useMap.getState>, nodeId: string, lang: ReturnType<typeof useMap.getState>['lang']): string | null {
 const route = shortestPath(s.nodeId, nodeId, s.accessible, s.closed, s.preferQuiet)
 if (!route) return null
 if (route.meters >= 1000) return t('unit.km', lang, {value: formatNumber(Math.round(route.meters / 100) / 10, lang)})
 return t('unit.meters', lang, {value: formatNumber(Math.round(route.meters), lang)})
}

export default function Explore({onPick}: {onPick: (id: string) => void}) {
 const s = useMap()
 const lang = s.lang
 const Chevron = dirFor(lang) === 'rtl' ? ChevronLeft : ChevronRight
 const [expanded, setExpanded] = useState<Set<string>>(new Set())
 const [filter, setFilter] = useState<string | null>(null)
 const [filterOpen, setFilterOpen] = useState(false)
 const filterRef = useRef<HTMLDivElement>(null)
 useEffect(() => {
  if (!filterOpen) return
  const onDoc = (e: MouseEvent) => {
   if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
  }
  document.addEventListener('mousedown', onDoc)
  return () => document.removeEventListener('mousedown', onDoc)
 }, [filterOpen])
 const inRegion = pois.filter(p => s.region === 'overview' || p.region === s.region)
 const allSections = categories.map(c => ({c, items: inRegion.filter(p => p.category === c.id)})).filter(sec => sec.items.length)
 const sections = filter ? allSections.filter(sec => sec.c.id === filter) : allSections
 const filterLabel = filter ? categoryName(filter as Parameters<typeof categoryName>[0], lang) : t('category.all', lang)
 return (
  <section className="explore-screen">
   <div className="explore-header">
    <h1>{t('explore.header_title', lang)}</h1>
    <div className="explore-filter" ref={filterRef}>
     <button type="button" className="explore-filter-trigger" aria-haspopup="listbox" aria-expanded={filterOpen} onClick={() => setFilterOpen(o => !o)}>
      <LayoutGrid size={15} />
      <span>{filterLabel}</span>
      <ChevronDown size={14} className={filterOpen ? 'explore-filter-caret open' : 'explore-filter-caret'} />
     </button>
     {filterOpen && (
      <ul className="explore-filter-list" role="listbox">
       <li role="option" aria-selected={filter === null}>
        <button type="button" className={filter === null ? 'active' : ''} onClick={() => {setFilter(null); setFilterOpen(false)}}>
         <LayoutGrid size={15} />
         <span>{t('category.all', lang)}</span>
         {filter === null && <Check size={14} />}
        </button>
       </li>
       {allSections.map(({c}) => {
        const OptIcon = icons[c.id]
        return (
         <li key={c.id} role="option" aria-selected={filter === c.id}>
          <button type="button" className={filter === c.id ? 'active' : ''} onClick={() => {setFilter(c.id); setFilterOpen(false)}}>
           <OptIcon size={15} />
           <span>{categoryName(c.id, lang)}</span>
           {filter === c.id && <Check size={14} />}
          </button>
         </li>
        )
       })}
      </ul>
     )}
    </div>
   </div>
   <div className="explore-sections">
    {sections.map(({c, items}) => {
     const open = expanded.has(c.id)
     const shown = open ? items : items.slice(0, 2)
     const Icon = icons[c.id]
     return (
      <div className="explore-section" key={c.id}>
       <div className="explore-section-header">
        <b><span className="explore-section-icon" style={{color: c.color}}><Icon size={16} /></span>{categoryName(c.id, lang)}</b>
        {items.length > 2 && <button className="explore-more-link" onClick={() => setExpanded(prev => {const next = new Set(prev); next.has(c.id) ? next.delete(c.id) : next.add(c.id); return next})}>{open ? t('explore.section_less', lang) : t('explore.section_more', lang)}{open ? <ChevronUp size={13} /> : <Chevron size={13} />}</button>}
       </div>
       {shown.map(p => (
        <button className="explore-item" key={p.id} onClick={() => onPick(p.id)}>
         <span className="explore-item-icon"><Icon size={19} /></span>
         <div><strong>{poiName(p.id, lang)}</strong><small>{regionNames[p.region][lang]} · {(p.region === 'haram' ? levelLabel(p.floor, lang) : floorName(p.floor, lang))}</small></div>
         <span className="explore-item-distance">{distanceLabel(s, p.nodeId, lang)}</span>
         <Chevron size={15} className="explore-item-chevron" />
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
