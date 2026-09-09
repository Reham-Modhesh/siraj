// Home screen: the only place Scene mounts (unmounts when the user leaves
// this screen - store.ts already persists/rehydrates position/camera/floor/
// region/route, so returning here resumes exactly where the map left off).
// Holds a bounded map card instead of a fullscreen map: region switching,
// floor picking, camera controls, search, turn-by-turn banner and the
// compact journey stepper all live anchored to that card now.
import {useMemo, useState, Component} from 'react'
import type {ReactNode} from 'react'
import {Search, MapPin, Navigation, Compass, Plus, Minus, LocateFixed, Layers, X, Check, ArrowUpDown, Flag, ArrowRight, ArrowLeft, ArrowUp, Expand, HelpCircle} from 'lucide-react'
import Scene from './Scene'
import RegionNavigator from './RegionNavigator'
import FloorPicker from './FloorPicker'
import {regionAt, regionNames} from './geography'
import {levelLabel} from './levels'
import {useMap, getRemainingMeters} from './store'
import {pois, stages, nodes, shortestPath, navigationSteps, activeStepIndex, resolveDestination, distance} from './navigation'
import {t, formatNumber, poiName, stageName, floorName} from './i18n/index'

class MapBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
 state = {failed: false}
 static getDerivedStateFromError() {
  return {failed: true}
 }
 render() {
  if (!this.state.failed) return this.props.children
  const lang = useMap.getState().lang
  return (
   <div className="webgl-error">
    <Layers />
    <h2>{t('webgl.title', lang)}</h2>
    <p>{t('webgl.description', lang)}</p>
    <button onClick={() => location.reload()}>{t('webgl.retry', lang)}</button>
   </div>
  )
 }
}

export default function Home({picking, setPicking}: {picking: boolean; setPicking: (v: boolean) => void}) {
 const s = useMap()
 const lang = s.lang
 const number = (n: number) => formatNumber(n, lang)
 const [ready, setReady] = useState(false)
 const [query, setQuery] = useState('')
 const destination = pois.find(p => p.id === s.destination)
 const selected = pois.find(p => p.id === s.selected)
 const lostPoint = pois.find(p => p.id === s.lostLandmark)
 const visible = useMemo(() => pois.filter(p => p.floor === s.floor && (s.region === 'overview' ? ['kaaba', 'clock-tower', 'mina-camp', 'mashar-mosque', 'jabal-rahmah'].includes(p.id) : p.region === s.region || (s.region === 'haram' && p.id === 'clock-tower')) && (p.region !== 'haram' || p.id.startsWith('level-') || ['kaaba', 'maqam', 'safa', 'marwa', 'zamzam', 'gate-fahd', 'family', 'mataf-exit', 'roof', 'upper-prayer', 'lift-1', 'lift-2', 'masaa-water'].includes(p.id) || p.id === s.selected)).map(p => ({...p, name: poiName(p.id, lang)})), [s.floor, s.region, s.selected, lang])
 const results = useMemo(() => pois.filter(p => (s.region === 'overview' || p.region === s.region) && (p.name.includes(query) || p.description.includes(query) || (lang !== 'ar' && poiName(p.id, lang).toLowerCase().includes(query.toLowerCase())))), [query, lang, s.region])
 const intent = query ? resolveDestination(query, lang) : {}
 const steps = useMemo(() => navigationSteps(s.route, s.routeIds, destination ? poiName(destination.id, lang) : '', lang), [s.route, s.routeIds, destination, lang])
 const stepIndex = activeStepIndex(s.route, s.progress)
 const instruction = steps[stepIndex]
 const stepMeters = s.route[stepIndex + 1] ? Math.round(distance(s.position, s.route[stepIndex + 1]) * 2.8) : 0
 const meters = getRemainingMeters()
 const stage = stages[s.stage]
 const cameraAction = (action: string) => window.dispatchEvent(new CustomEvent('sakina-camera', {detail: action}))
 const runSearch = () => {
  if (query.includes('خلص') && query.includes('طواف')) {
   s.finishTawaf()
   setQuery('')
   return
  }
  if (intent.nearest) {
   const id = s.nearest(intent.nearest)
   if (id) setQuery('')
  } else if (intent.id) {
   s.select(intent.id)
   setQuery('')
  }
 }
 return (
  <section className="map-surface" aria-label={t('map.aria', lang)}>
   <div className="home-header">
    <div className="brand-row"><MapPin size={16} /><div><strong>{regionNames[s.region === 'overview' ? regionAt(s.position) : s.region][lang]}</strong><small>{t('home.brand_subtitle', lang)}</small></div></div>
    <button className="lost-trigger" onClick={() => s.lost()} aria-label={t('home.lost_button', lang)}><HelpCircle size={16} /></button>
   </div>
   <div className="map-search">
    <div className="search-input">
     <Search size={20} />
     <input aria-label={t('search.aria', lang)} placeholder={t('search.placeholder', lang)} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => {if (e.key === 'Enter') runSearch()}} />
     {query ? <button onClick={() => setQuery('')} aria-label={t('search.clear_aria', lang)}><X size={17} /></button> : <span className="search-key">{t('search.label', lang)}</span>}
    </div>
    {query && (
     <div className="search-results">
      {(intent.id || intent.nearest) && <button className="intent-result" onClick={runSearch}><Navigation size={18} /><span>{query.includes('خلص') ? t('search.confirm_tawaf_done', lang) : intent.nearest ? t('search.find_nearest', lang) : t('search.go_to', lang, {name: poiName(intent.id || '', lang)})}<small>{t('search.suggestion_hint', lang)}</small></span></button>}
      {results.length ? results.map(p => <button key={p.id} onClick={() => {s.select(p.id); setQuery('')}}><MapPin size={17} /><span>{poiName(p.id, lang)}<small>{regionNames[p.region][lang]} · {(p.region === 'haram' ? levelLabel(p.floor, lang) : floorName(p.floor, lang))}</small></span></button>) : !intent.id && !intent.nearest ? <p>{t('search.no_results', lang)}</p> : null}
     </div>
    )}
    {!query && lang !== 'ar' && <small className="search-hint">{t('search.other_lang_hint', lang)}</small>}
   </div>
   <div className="map-card">
    <div className="canvas-container">
     <MapBoundary>
      <Scene region={s.region} lang={lang} floor={s.floor} user={s.position} direction={s.direction} pois={visible} selected={s.selected} route={s.route} routeProgress={s.progress} follow={s.follow} crowd={s.preferQuiet} onManual={() => useMap.setState({follow: false})} camera={s.camera} running={s.running} picking={picking} onPick={p => {s.moveTo(p); setPicking(false)}} onSelect={id => s.select(id)} onReady={() => setReady(true)} />
     </MapBoundary>
    </div>
    {!ready && <div className="loading"><Layers size={36} /><strong>{t('loading.title', lang)}</strong><span>{t('loading.subtitle', lang)}</span><i /></div>}
    <RegionNavigator />
    <FloorPicker />
    <div className="map-controls">
     <button className="compass-control" onClick={() => s.setRegion(s.region)} aria-label={t('controls.reset_camera', lang)}><Compass size={25} /></button>
     <div className="control-group">
      <button onClick={() => cameraAction('zoom-in')} aria-label={t('controls.zoom_in', lang)}><Plus /></button>
      <button onClick={() => cameraAction('zoom-out')} aria-label={t('controls.zoom_out', lang)}><Minus /></button>
     </div>
     <button onClick={() => {s.setRegion(regionAt(s.position)); s.setFloor(s.userFloor); s.focus(s.position, 1.8)}} aria-label={t('controls.my_location', lang)}><LocateFixed size={22} /></button>
     <button onClick={() => {s.frameRoute(); if (!s.route.length) s.setRegion(s.region)}} aria-label={t('controls.frame_route', lang)}><Expand size={21} /></button>
    </div>
    {picking && <button className="picking-banner" onClick={() => setPicking(false)}>{t('picking.hint', lang)} <X size={15} /></button>}
   </div>
   {lostPoint && (
    <div className="lost-card">
     <div className="row between"><strong>{t('lost.title', lang)}</strong><button className="icon-button" onClick={() => useMap.setState({lostLandmark: null})} aria-label={t('lost.close_aria', lang)}><X size={16} /></button></div>
     <p>{t('lost.nearest_landmark_label', lang)} <b>{poiName(lostPoint.id, lang)}</b></p>
     <small>{(regionAt(s.position) === 'haram' ? levelLabel(s.userFloor, lang) : floorName(s.userFloor, lang))} {t('lost.hint_suffix', lang)}</small>
     <button className="primary w-full" onClick={() => {s.navigate(lostPoint.id); useMap.setState({lostLandmark: null})}}><Navigation size={16} />{t('lost.guide_me', lang)}</button>
    </div>
   )}
   {selected && (
    <div className="selected-card">
     <button className="selected-close icon-button" onClick={() => useMap.setState({selected: null})} aria-label={t('selected.close_aria', lang)}><X size={16} /></button>
     <span className="location-category" style={{background: selected.color}}><MapPin size={23} /></span>
     <div className="selected-info">
      <strong>{poiName(selected.id, lang)}</strong>
      <small>{regionNames[selected.region][lang]} · {(selected.region === 'haram' ? levelLabel(selected.floor, lang) : floorName(selected.floor, lang))}</small>
     </div>
     <button className="primary compact" onClick={() => s.navigate(selected.id)} aria-label={t('selected.navigate_aria', lang)}><Navigation size={16} /><span>{t('selected.navigate_label', lang)}</span></button>
    </div>
   )}
   {destination && s.route.length > 1 && !s.ritual && !s.paused && !selected && s.floor === s.userFloor && s.region === regionAt(s.position) && (
    <div className="turn-banner">
     <span className="turn-icon">{s.progress >= 1 ? <Flag size={25} /> : instruction?.turn === 'right' ? <ArrowRight size={25} /> : instruction?.turn === 'left' ? <ArrowLeft size={25} /> : instruction?.turn === 'vertical' ? <ArrowUpDown size={25} /> : <ArrowUp size={25} />}</span>
     <div><strong>{s.progress >= 1 ? t('nav.arrived_at', lang, {name: poiName(destination.id, lang)}) : instruction?.instruction + ' ' + t('unit.meters', lang, {value: number(stepMeters)})}</strong><span>{s.progress >= 1 ? t('nav.confirm_to_continue', lang) : instruction?.landmark}</span></div>
     <button onClick={() => {if (s.progress >= 1) s.confirmArrival(destination.id); else {useMap.setState({follow: true}); s.focus(s.position, 2.8)}}} aria-label={t('nav.continue_aria', lang)}>{s.progress >= 1 ? <Check size={19} /> : <LocateFixed size={19} />}</button>
    </div>
   )}
   <div className="home-stepper">
    <div className="stepper-track"><i style={{width: `${(s.stage / 9) * 100}%`}} /></div>
    <small>{t('home.stage_caption', lang, {current: number(s.stage + 1), total: number(10), stage: stageName(s.stage, lang)})}</small>
   </div>
   <div className="map-attribution"><span className="scale-line" /><span>{t('attribution.scale', lang, {value: number(50)})}</span><i />{t('attribution.disclaimer', lang)}</div>
  </section>
 )
}
