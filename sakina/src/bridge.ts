import {useMap,getRemainingMeters} from './store'
import {floors,pois,stages} from './navigation'
import type {Category} from './navigation'
export const mapBridge={
 getMapContext:()=>({location:mapBridge.getCurrentLocation(),floor:mapBridge.getCurrentFloor(),ritual:mapBridge.getRitualProgress(),destination:useMap.getState().destination,remainingMeters:getRemainingMeters(),isMock:true}),
 getCurrentLocation:()=>{const s=useMap.getState();return{coordinates:{x:s.position[0],y:s.position[1],z:s.position[2]},nodeId:s.nodeId,floor:s.userFloor,accuracy:'موقع تجريبي'}},
 getCurrentFloor:()=>floors[useMap.getState().floor],
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
