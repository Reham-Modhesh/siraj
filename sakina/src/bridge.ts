import {floorElevation,buildingFor,levelLabel} from './levels'
import {floorName} from './i18n/index'
import {regionAt} from './geography'
import type {RegionView,RegionId} from './geography'
import {useMap,getRemainingMeters} from './store'
import {floors,pois,stages} from './navigation'
import type {Category} from './navigation'
export const mapBridge={
 getCurrentRegion:()=>({viewed:useMap.getState().region,user:regionAt(useMap.getState().position)}),
 focusOnRegion:(region:RegionView)=>useMap.getState().setRegion(region),
 startRegionSimulation:(region:RegionId)=>useMap.getState().startRegionDemo(region),
 getMapContext:()=>({region:mapBridge.getCurrentRegion(),location:mapBridge.getCurrentLocation(),floor:mapBridge.getCurrentFloor(),ritual:mapBridge.getRitualProgress(),destination:useMap.getState().destination,remainingMeters:getRemainingMeters(),isMock:true}),
 getCurrentLocation:()=>{const s=useMap.getState();return{coordinates:{x:s.position[0],y:s.position[1],z:s.position[2]},nodeId:s.nodeId,floor:s.userFloor,accuracy:'موقع تجريبي'}},
 getCurrentFloor:()=>{const s=useMap.getState(),region=s.region==='overview'?regionAt(s.position):s.region,f=floors.find(f=>f.id===s.floor)!;return{id:f.id,name:region==='haram'?levelLabel(f.id,s.lang):floorName(f.id,s.lang),short:region==='haram'?f.short:f.id===0?'G':String(f.id),y:floorElevation(region,f.id),building:region==='haram'?buildingFor(f.id):region,region}},
 getCurrentRitualStage:()=>({index:useMap.getState().stage,...stages[useMap.getState().stage]}),
 getRitualProgress:()=>{const s=useMap.getState();return{stage:s.stage,completed:s.completed,tawaf:s.tawaf,sai:s.sai,saiDirection:s.sai%2===0?'safa-to-marwa':'marwa-to-safa',routeProgress:s.progress}},
 getNextRitualDestination:()=>pois.find(p=>p.id===stages[useMap.getState().stage].poi)!,
 navigateTo:(destinationId:string)=>useMap.getState().navigate(destinationId),
 focusOnLocation:(locationId:string)=>useMap.getState().select(locationId),
 findNearest:(category:Category)=>useMap.getState().nearest(category),
 pauseJourney:()=>useMap.getState().pause(),
 resumeJourney:()=>useMap.getState().resume(),
 confirmArrival:(locationId:string)=>useMap.getState().confirmArrival(locationId)
}
declare global {interface Window {sakinaMap:typeof mapBridge}}
window.sakinaMap=mapBridge
