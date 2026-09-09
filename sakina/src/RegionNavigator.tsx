import {useEffect,useRef,useState} from 'react'
import {Building2,Mountain,Tent,Landmark,Globe,Play,MapPin,ChevronDown,Check} from 'lucide-react'
import {useMap} from './store'
import {regionNames,regionalText,regions,regionConfig} from './geography'
import type {RegionView} from './geography'
import {poiName} from './i18n/index'
const icons={haram:Landmark,towers:Building2,mina:Tent,muzdalifah:Mountain,arafat:Mountain,overview:Globe}
export default function RegionNavigator(){
 const s=useMap()
 const all:RegionView[]=['haram','towers','mina','muzdalifah','arafat','overview']
 const c=s.region==='overview'?null:regionConfig(s.region)
 const Icon=icons[s.region]
 const [open,setOpen]=useState(false)
 const ref=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!open)return
  const onDoc=(e:MouseEvent)=>{
   if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)
  }
  document.addEventListener('mousedown',onDoc)
  return ()=>document.removeEventListener('mousedown',onDoc)
 },[open])
 return <>
  <div className="region-select" ref={ref}>
   <button type="button" className="region-select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={regionalText.label[s.lang]} onClick={()=>setOpen(o=>!o)}>
    <Icon size={16}/>
    <span>{regionNames[s.region][s.lang]}</span>
    <ChevronDown size={14} className={open?'region-select-caret open':'region-select-caret'}/>
   </button>
   {open&&<ul className="region-select-list" role="listbox">
    {all.map(id=>{
     const OptIcon=icons[id]
     return (
      <li key={id} role="option" aria-selected={s.region===id}>
       <button type="button" className={s.region===id?'active':''} onClick={()=>{s.setRegion(id);setOpen(false)}}>
        <OptIcon size={15}/>
        <span>{regionNames[id][s.lang]}</span>
        {s.region===id&&<Check size={14}/>}
       </button>
      </li>
     )
    })}
   </ul>}
  </div>
  <div className="region-disclaimer">{regionalText.mock[s.lang]}</div>
  {!s.running&&!s.selected&&!s.lostLandmark&&s.region!=='haram'&&
   <div className="region-caption">
    <span className="region-eyebrow">{regionalText.explore[s.lang]}</span>
    <strong>{regionNames[s.region][s.lang]}</strong>
    {c?(
     <>
      <p>{poiName(c.destination,s.lang)}</p>
      <div className="row">
       <button className="secondary" onClick={()=>s.select(c.destination)}><MapPin size={15}/>{regionalText.destinations[s.lang]}</button>
       <button className="primary" onClick={()=>s.startRegionDemo(c.id)}><Play size={15}/>{regionalText.simulate[s.lang]}</button>
      </div>
     </>
    ):(
     <div className="overview-legend">
      {regions.map(r=><button key={r.id} onClick={()=>s.setRegion(r.id)}><i style={{background:r.color}}/>{regionNames[r.id][s.lang]}</button>)}
     </div>
    )}
   </div>
  }
 </>
}
