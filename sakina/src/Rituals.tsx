// Rituals screen: absorbs the old journey-panel's "journey" tab in full -
// ritual/navigation/current-stage cards, the step-by-step preview list, the
// ritual guide accordion, the 10-stage timeline and the tawaf/sai shortcuts
// - plus a new circular progress ring (drawn from the real 10 stages, not
// the reference mockup's illustrative 5/6) and a Hajj/Umrah toggle. Hajj is
// shown but disabled: store.ts only models one Umrah journey today, so this
// is a visual placeholder, not new logic, and a known gap worth flagging.
import {useState} from 'react'
import {Footprints, Navigation, Play, Pause, Check, CheckCircle2, Undo2, RefreshCw, RotateCcw, Route, MapPin, BookOpen, ExternalLink, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, LocateFixed} from 'lucide-react'
import {useMap, getRemainingMeters} from './store'
import {pois, stages, nodes, shortestPath, navigationSteps, activeStepIndex, distance} from './navigation'
import {levelUI} from './levels'
import {t, formatNumber, dirFor, poiName, stageName, stageHint, ritual, ritualField} from './i18n/index'

export default function Rituals({goHome}: {goHome: () => void}) {
 const s = useMap()
 const lang = s.lang
 const number = (n: number) => formatNumber(n, lang)
 const Chevron = dirFor(lang) === 'rtl' ? ChevronLeft : ChevronRight
 const [openedStage, setOpenedStage] = useState<number | null>(s.stage)
 const [guideOpen, setGuideOpen] = useState(false)
 const [previewStep, setPreviewStep] = useState<number | null>(null)
 const destination = pois.find(p => p.id === s.destination)
 const stage = stages[s.stage]
 const meters = getRemainingMeters()
 const minutes = Math.max(1, Math.ceil(meters / 70))
 const steps = navigationSteps(s.route, s.routeIds, destination ? poiName(destination.id, lang) : '', lang)
 const stepIndex = activeStepIndex(s.route, s.progress)
 const stepMeters = s.route[stepIndex + 1] ? Math.round(distance(s.position, s.route[stepIndex + 1]) * 2.8) : 0
 const guide = s.stage === 3 ? ritual.tawaf : s.stage === 4 ? ritual.prayer : ritual.sai
 const guideType = s.stage === 3 ? t('ritual.type_tawaf', lang) : s.stage === 4 ? t('ritual.type_prayer', lang) : t('ritual.type_sai', lang)
 const previewDirection = (delta: number) => {
  const index = Math.max(0, Math.min(steps.length - 1, (previewStep ?? stepIndex) + delta))
  setPreviewStep(index)
  const node = nodes.find(n => distance(n.position, steps[index].position) < 0.01)
  if (node) {s.setRegion(node.region); s.setFloor(node.floor)}
  useMap.setState({follow: false})
  s.focus(steps[index].position, 2.4)
 }
 const ring = {r: 46, c: 2 * Math.PI * 46}
 const ringOffset = ring.c - (ring.c * (s.stage / 9))
 return (
  <section className="rituals-screen">
   <div className="rituals-header">
    <h1>{t('rituals.header_title', lang)}</h1>
    <div className="hajj-umrah-toggle"><span aria-disabled="true" title={t('rituals.mode_hajj_unavailable', lang)}>{t('rituals.mode_hajj', lang)}</span><span className="on">{t('rituals.mode_umrah', lang)}</span></div>
   </div>
   <div className="rituals-ring-wrap">
    <svg width="150" height="150" viewBox="0 0 120 120" role="img" aria-label={t('rituals.ring_step_of', lang, {current: number(s.stage + 1), total: number(10)})}>
     <circle cx="60" cy="60" r={ring.r} fill="none" className="rituals-ring-track" strokeWidth="8" />
     <circle cx="60" cy="60" r={ring.r} fill="none" className="rituals-ring-fill" strokeWidth="8" strokeLinecap="round" strokeDasharray={ring.c} strokeDashoffset={ringOffset} transform="rotate(-90 60 60)" />
     <rect x="50" y="50" width="20" height="20" rx="2" className="rituals-ring-kaaba" />
    </svg>
    <div className="rituals-ring-caption"><b>{stageName(s.stage, lang)}</b><small>{t('rituals.ring_step_of', lang, {current: number(s.stage + 1), total: number(10)})}</small></div>
   </div>

   {s.paused && <div className="resume-card"><span className="row"><RotateCcw size={18} /><strong>{t('summary.resume_title', lang)}</strong></span><p>{t('resume.description', lang)}</p><button className="primary w-full" onClick={s.resume}><Play size={16} />{t('resume.button', lang)}</button></div>}

   <div className="journey-status"><span>{t('journey.you_are_now_label', lang)} <b>{stageName(s.stage, lang)}</b></span><small>{t('journey.then_prefix', lang, {stage: stageName(Math.min(9, s.stage + 1), lang)})}</small></div>
   <label className="ritual-status-select">{t('ritual_select.label', lang)}
    <select aria-label={t('ritual_select.aria', lang)} value="" onChange={e => {if (e.target.value === 'finished-tawaf') s.finishTawaf(); else s.startRitual(e.target.value as 'tawaf' | 'sai'); goHome()}}>
     <option value="" disabled>{t('ritual_select.placeholder', lang)}</option>
     <option value="tawaf">{t('ritual_select.start_tawaf', lang)}</option>
     <option value="finished-tawaf">{t('ritual_select.finished_tawaf', lang)}</option>
     <option value="sai">{t('ritual_select.start_sai', lang)}</option>
    </select>
   </label>

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
      {s.progress >= 1 ? <button className="primary w-full" onClick={() => {if (s.arrived.includes(destination.id) && destination.id === stage.poi) s.completeStage(); else s.confirmArrival(destination.id)}}><Check size={17} />{s.arrived.includes(destination.id) && destination.id === stage.poi ? (s.stage === 4 ? t('nav.prayer_done_continue', lang) : t('nav.stage_done_continue', lang)) : t('common.confirm_arrival', lang)}</button> : <button className="primary w-full" onClick={() => {s.simulate(); goHome()}}>{s.running ? <Pause size={16} /> : <Play size={16} />} {s.running ? t('sim.stop', lang) : t('sim.start', lang)}</button>}
      <button className="secondary" onClick={s.frameRoute} aria-label={t('nav.frame_route_aria', lang)}><Route size={18} /></button>
     </div>
     <button className="text-button small" onClick={() => {s.focus(s.position, 2.2); goHome()}}><LocateFixed size={14} />{t('nav.focus_current_step', lang)}</button>
    </div>
   ) : (
    <div className="current-stage-card">
     <div className="row between"><span className="eyebrow">{t('summary.next_step', lang)}</span><span className="step-badge">{t('journey.stage_count', lang, {current: number(s.stage + 1), total: number(10)})}</span></div>
     <h2>{stageName(s.stage, lang)}</h2>
     <p>{stageHint(s.stage, lang)}</p>
     <button className="primary w-full" onClick={() => {s.navigate(stage.poi); goHome()}}><Navigation size={17} />{t('common.start_navigation', lang)}<Chevron size={17} /></button>
    </div>
   )}

   {destination && !s.ritual && steps.length > 0 && (
    <div className="step-list">
     <div className="row between"><strong>{t('steps.title', lang)}</strong><small>{t('steps.progress', lang, {current: number(Math.min(steps.length, stepIndex + 1)), total: number(steps.length)})}</small></div>
     <div className="direction-preview">
      <button className="secondary" aria-label={levelUI.previous[lang]} disabled={(previewStep ?? stepIndex) <= 0} onClick={() => previewDirection(-1)}>←</button>
      <span>{levelUI.preview[lang]} · {number((previewStep ?? stepIndex) + 1)}/{number(steps.length)}</span>
      <button className="secondary" aria-label={levelUI.next[lang]} disabled={(previewStep ?? stepIndex) >= steps.length - 1} onClick={() => previewDirection(1)}>→</button>
     </div>
     {steps.slice(previewStep ?? stepIndex, (previewStep ?? stepIndex) + 4).map((step, i) => (
      <button key={step.index} className={i === 0 ? 'current-step' : ''} onClick={() => {setPreviewStep(step.index); s.focus(step.position, 2.4); useMap.setState({follow: false})}}>
       <span>{i === 0 ? <Navigation size={16} /> : number(step.index + 1)}</span>
       <div><strong>{step.instruction} {t('unit.meters', lang, {value: number(step.index === stepIndex ? stepMeters : step.meters)})}</strong><small>{step.landmark}</small></div>
      </button>
     ))}
     <small className="sim-note">{t('steps.disclaimer', lang)}</small>
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

   <div className="journey-heading"><div><h2>{t('journey.title', lang)}</h2><span>{t('journey.subtitle', lang)}</span></div><span className="completion-ring">{number(s.completed.length)}<small>{t('journey.of_ten', lang, {value: number(10)})}</small></span></div>
   <div className="timeline">
    {stages.map((st, i) => {
     const done = s.completed.includes(i), active = s.stage === i, open = openedStage === i
     return (
      <div key={st.name} className={`timeline-item ${active ? 'current' : ''} ${done ? 'complete' : ''}`}>
       <button className="stage-row" onClick={() => setOpenedStage(open ? null : i)}>
        <span className="stage-number">{done ? <Check size={14} /> : number(i + 1)}</span>
        <span><strong>{stageName(i, lang)}</strong><small>{done ? t('stage.completed', lang) : active ? t('stage.current', lang) : t('stage.not_started', lang)}</small></span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
       </button>
       {open && (
        <div className="stage-details">
         <p>{stageHint(i, lang)}</p>
         <div className="row"><button onClick={() => {s.select(st.poi); goHome()}}><MapPin size={14} />{t('common.view_location', lang)}</button><button onClick={() => {s.navigate(st.poi); goHome()}}><Navigation size={14} />{t('stage.navigate', lang)}</button></div>
         {active && <>
          <button className="secondary w-full" onClick={() => s.confirmArrival(st.poi)}><Check size={15} />{s.arrived.includes(st.poi) ? t('common.arrival_confirmed', lang) : t('common.confirm_arrival', lang)}</button>
          {i === 3 || i === 7 ? <button className="primary w-full" onClick={() => {s.startRitual(i === 3 ? 'tawaf' : 'sai'); goHome()}}>{t('ritual.start', lang, {type: i === 3 ? t('ritual.type_tawaf', lang) : t('ritual.type_sai', lang)})}</button> : <button className="primary w-full" onClick={s.completeStage}>{i === 4 ? t('stage.prayer_done_next', lang) : t('stage.confirm_complete', lang)}</button>}
         </>}
        </div>
       )}
      </div>
     )
    })}
   </div>
   <div className="ritual-shortcuts">
    <span>{t('shortcuts.title', lang)}</span>
    <button onClick={() => {s.startRitual('tawaf'); goHome()}}><RefreshCw size={17} />{t('ritual.type_tawaf', lang)} <b>{number(s.tawaf)}{t('ritual.of_seven_suffix', lang)}</b></button>
    <button onClick={() => {s.startRitual('sai'); goHome()}}><Footprints size={17} />{t('ritual.type_sai', lang)} <b>{number(s.sai)}{t('ritual.of_seven_suffix', lang)}</b></button>
   </div>
  </section>
 )
}
