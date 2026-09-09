// Home screen: the only place Scene mounts (unmounts when the user leaves
// this screen - store.ts already persists/rehydrates position/camera/floor/
// region/route, so returning here resumes exactly where the map left off).
// Holds a bounded map card instead of a fullscreen map: region switching,
// floor picking, camera controls, search, turn-by-turn banner and the
// compact journey stepper all live anchored to that card now.
import {useMemo, useState, useEffect, Component} from 'react'
import type {ReactNode} from 'react'
import {Search, MapPin, Navigation, Compass, Plus, Minus, LocateFixed, Layers, X, Check, ArrowUpDown, Flag, ArrowRight, ArrowLeft, ArrowUp, Expand, HelpCircle, RotateCcw, Play, Pause, CheckCircle2, Undo2, Route, Footprints, BookOpen, ExternalLink, ChevronUp, ChevronDown, Mic} from 'lucide-react'
import Scene from './Scene'
import RegionNavigator from './RegionNavigator'
import LanguageSwitcher from './LanguageSwitcher'
import {regionAt, regionNames} from './geography'
import {levelLabel} from './levels'
import {useMap, getRemainingMeters} from './store'
import {pois, stages, navigationSteps, activeStepIndex, resolveDestination, distance} from './navigation'
import {t, formatNumber, poiName, stageName, stageHint, floorName, ritual, ritualField} from './i18n/index'

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

export default function Home({picking, setPicking, onAsk}: {picking: boolean; setPicking: (v: boolean) => void; onAsk: () => void}) {
 const s = useMap()
 const lang = s.lang
 const number = (n: number) => formatNumber(n, lang)
 const [ready, setReady] = useState(false)
 const [query, setQuery] = useState('')
 const [guideOpen, setGuideOpen] = useState(false)
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
 const minutes = Math.max(1, Math.ceil(meters / 70))
 const stage = stages[s.stage]
 const guide = s.stage === 3 ? ritual.tawaf : s.stage === 4 ? ritual.prayer : ritual.sai
 const guideType = s.stage === 3 ? t('ritual.type_tawaf', lang) : s.stage === 4 ? t('ritual.type_prayer', lang) : t('ritual.type_sai', lang)
 // Show the ritual's how-to/story/dhikr (already fully localized in
 // i18n/ritual.ts) the moment the pilgrim actually starts it, instead of
 // leaving it collapsed behind a manual tap they might never notice.
 // Stages 3/4/7 are the actual performing stages (tawaf/prayer/sai);
 // stage 6 ("heading to Safa") still renders the guide as a preview but
 // doesn't force it open since sai hasn't started yet.
 useEffect(() => {
  if (s.stage === 3 || s.stage === 4 || s.stage === 7) setGuideOpen(true)
 }, [s.stage])
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
    <div className="home-header-actions">
     <LanguageSwitcher />
     <button className="lost-trigger" onClick={() => s.lost()} aria-label={t('home.lost_button', lang)}><HelpCircle size={16} /></button>
    </div>
   </div>
   <div className="hajj-umrah-toggle"><span aria-disabled="true" title={t('rituals.mode_hajj_unavailable', lang)}>{t('rituals.mode_hajj', lang)}</span><span className="on">{t('rituals.mode_umrah', lang)}</span></div>
   <div className="map-search">
    <div className="search-input">
     <Search size={20} />
     <input aria-label={t('search.aria', lang)} placeholder={t('search.placeholder', lang)} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => {if (e.key === 'Enter') runSearch()}} />
     {query ? <button onClick={() => setQuery('')} aria-label={t('search.clear_aria', lang)}><X size={17} /></button> : <button className="search-mic" onClick={onAsk} aria-label={t('tabbar.ask_fab_aria', lang)}><Mic size={18} /></button>}
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
   <div className="home-journey">
    <div className="home-stepper">
     <div className="stepper-track"><i style={{width: `${(s.stage / 9) * 100}%`}} /></div>
     <small>{t('home.stage_caption', lang, {current: number(s.stage + 1), total: number(10), stage: stageName(s.stage, lang)})}</small>
    </div>
    {s.paused && <div className="resume-card"><span className="row"><RotateCcw size={18} /><strong>{t('summary.resume_title', lang)}</strong></span><p>{t('resume.description', lang)}</p><button className="primary w-full" onClick={s.resume}><Play size={16} />{t('resume.button', lang)}</button></div>}
    {s.ritual ? (
     <div className="ritual-card">
      <div className="row between"><span className="eyebrow">{s.ritual === 'tawaf' ? t('ritual.tracking_tawaf', lang) : t('ritual.tracking_sai', lang)}</span><span className="live-dot">{s.running ? t('sim.running', lang) : t('sim.paused', lang)}</span></div>
      <div className="lap-number">{number(Math.min(7, (s.ritual === 'tawaf' ? s.tawaf : s.sai) + 1))}<span>{t('ritual.of_seven_suffix', lang)}</span></div>
      <h3>{s.ritual === 'tawaf' ? t('ritual.around_kaaba', lang) : s.sai % 2 === 0 ? t('ritual.safa_to_marwa_full', lang) : t('ritual.marwa_to_safa_full', lang)}</h3>
      <div className="lap-dots">{Array.from({length: 7}, (_, i) => <span className={i < (s.ritual === 'tawaf' ? s.tawaf : s.sai) ? 'done' : ''} key={i}>{i < (s.ritual === 'tawaf' ? s.tawaf : s.sai) ? <Check size={14} /> : number(i + 1)}</span>)}</div>
      <button className="primary w-full" onClick={s.completeLap}><CheckCircle2 size={17} />{t('ritual.complete_lap', lang)}</button>
      <div className="row"><button className="text-button" onClick={s.undoLap}><Undo2 size={15} />{t('common.undo', lang)}</button><button className="text-button" onClick={s.running ? s.pause : s.resume}>{s.running ? <Pause size={15} /> : <Play size={15} />} {s.running ? t('sim.pause_label', lang) : t('ritual.resume_lap', lang)}</button></div>
      <p className="fine-print">{t('ritual.fine_print', lang)}</p>
     </div>
    ) : destination && s.route.length > 0 ? (
     <div className="navigation-card">
      <div className="row between"><span className="eyebrow">{s.progress >= 1 ? t('nav.arrived_label', lang) : t('nav.current_destination_label', lang)}</span><span className="step-badge"><Navigation size={12} />{t('nav.badge', lang)}</span></div>
      <h2>{poiName(destination.id, lang)}</h2>
      <p>{s.preferQuiet ? t('nav.desc_quiet', lang) : s.closed.length ? t('nav.desc_closed', lang) : s.accessible ? t('nav.desc_accessible', lang) : t('nav.desc_default', lang)}</p>
      <div className="route-stats"><div><strong>{number(meters)}</strong><span>{t('nav.meters_remaining_label', lang)}</span></div><span /><div><strong>{s.progress >= 1 ? number(0) : number(minutes)}</strong><span>{t('nav.minutes_label', lang)}</span></div><Footprints size={25} /></div>
      <div className="route-progress"><i style={{width: `${s.progress * 100}%`}} /></div>
      <div className="navigation-buttons">
       {s.progress >= 1 ? <button className="primary w-full" onClick={() => {if (s.arrived.includes(destination.id) && destination.id === stage.poi) s.completeStage(); else s.confirmArrival(destination.id)}}><Check size={17} />{s.arrived.includes(destination.id) && destination.id === stage.poi ? (s.stage === 4 ? t('nav.prayer_done_continue', lang) : t('nav.stage_done_continue', lang)) : t('common.confirm_arrival', lang)}</button> : <button className="primary w-full" onClick={s.simulate}>{s.running ? <Pause size={16} /> : <Play size={16} />} {s.running ? t('sim.stop', lang) : t('sim.start', lang)}</button>}
       <button className="secondary" onClick={s.frameRoute} aria-label={t('nav.frame_route_aria', lang)}><Route size={18} /></button>
      </div>
     </div>
    ) : (
     <div className="current-stage-card">
      <div className="row between"><span className="eyebrow">{t('summary.next_step', lang)}</span><span className="step-badge">{t('journey.stage_count', lang, {current: number(s.stage + 1), total: number(10)})}</span></div>
      <h2>{stageName(s.stage, lang)}</h2>
      <p>{stageHint(s.stage, lang)}</p>
      <button className="primary w-full" onClick={() => s.navigate(stage.poi)}><Navigation size={17} />{t('common.start_navigation', lang)}</button>
     </div>
    )}
    {(s.stage === 3 || s.stage === 4 || s.stage === 6 || s.stage === 7) && (
     <div className="ritual-guide">
      <button className="guide-heading" onClick={() => setGuideOpen(!guideOpen)}><BookOpen size={19} /><span>{t('guide.about', lang, {type: guideType})}</span>{guideOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      {guideOpen && (
       <div className="guide-body">
        <h3>{ritualField(guide, 'title', lang)}</h3>
        <p>{ritualField(guide, 'explanation', lang)}</p>
        <h4>{t('guide.meaning_heading', lang)}</h4>
        <p>{ritualField(guide, 'story', lang)}</p>
        <h4>{t('guide.dhikr_heading', lang)}</h4>
        <blockquote>{guide.dhikr}</blockquote>
        <p>{ritualField(guide, 'dhikrMeaning', lang)}</p>
        <p>{ritualField(guide, 'dhikrNote', lang)}</p>
        <a href={guide.url} target="_blank" rel="noreferrer">{ritualField(guide, 'source', lang)}<ExternalLink size={12} /></a>
        {'storyUrl' in guide && <a href={String(guide.storyUrl)} target="_blank" rel="noreferrer">{t('guide.hajar_story_link', lang)}<ExternalLink size={12} /></a>}
       </div>
      )}
     </div>
    )}
   </div>
   <div className="map-attribution"><span className="scale-line" /><span>{t('attribution.scale', lang, {value: number(50)})}</span><i />{t('attribution.disclaimer', lang)}</div>
  </section>
 )
}
