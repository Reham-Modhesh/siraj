import { pointAlong, pathLength } from './navigation'
import type { Vec3 } from './navigation'
export interface LocationSample { position:Vec3;direction:number;progress:number;accuracy:'mock' }
/** Replace with an indoor-positioning adapter. All coordinates use the local map frame. */
export interface LocationProvider { readonly kind:string; advance(points:Vec3[],progress:number,deltaSeconds:number,speed:number):LocationSample }
export class MockLocationProvider implements LocationProvider {
 readonly kind='mock'
 advance(points:Vec3[],progress:number,deltaSeconds:number,speed=4):LocationSample {const length=pathLength(points);const next=Math.min(1,progress+(length?deltaSeconds*speed/length:1));return{...pointAlong(points,next),progress:next,accuracy:'mock'}}
}
