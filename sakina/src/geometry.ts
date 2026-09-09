export const RIWAQ_INNER_RADIUS=41
export const RIWAQ_OUTER_RADIUS=61
export const RIWAQ_UPPER_ROUTE_RADIUS=48
export const ROUTE_HALF_WIDTH=2.6
/** Point-to-segment distance in the local horizontal plane. */
export function segmentDistance(x:number,z:number,a:readonly number[],b:readonly number[]){const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz)}
/** Independent floor footprint, including the open courtyard void. */
export function onRiwaqDeck(x:number,z:number,clearance=0){if(Math.hypot(x,z)<RIWAQ_INNER_RADIUS+clearance)return false;const apothem=RIWAQ_OUTER_RADIUS*Math.cos(Math.PI/8);return Array.from({length:8},(_,i)=>x*Math.cos(i*Math.PI/4)+z*Math.sin(i*Math.PI/4)).every(d=>d<=apothem-clearance)}
