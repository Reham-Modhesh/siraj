import test from 'node:test'
import assert from 'node:assert/strict'
import {nodes,edges,shortestPath,pois,resolveDestination} from './navigation'
import {haramLevels,buildingFor,floorElevation} from './levels'
import {onRiwaqDeck,ROUTE_HALF_WIDTH} from './geometry'
import {regionalObstacles} from './terrain'

function samples(a:readonly number[],b:readonly number[]){return Array.from({length:101},(_,i)=>a.map((v,j)=>v+(b[j]-v)*i/100))}
test('raised Riwaq walkways stay on the octagonal floor outside the courtyard void',()=>{
 for(const e of edges){const a=nodes.find(n=>n.id===e.from)!,b=nodes.find(n=>n.id===e.to)!;
 if(a.region!=='haram'||a.floor===0||a.floor!==b.floor||buildingFor(a.floor)!=='riwaq'||e.kind!=='walk')continue;
 for(const p of samples(a.position,b.position))assert.ok(onRiwaqDeck(p[0],p[2],ROUTE_HALF_WIDTH),`${e.id}: unsupported walkway at ${p}`)
 }
})
test('every Haram graph level agrees with its building deck elevation',()=>{for(const n of nodes.filter(n=>n.region==='haram'&&!n.id.startsWith('flight-')&&!['passage','north-passage'].includes(n.id)))assert.equal(n.position[1],floorElevation('haram',n.floor),n.id)})
test('Masaa horizontal routes remain inside the deck on each independent level',()=>{for(const e of edges){const a=nodes.find(n=>n.id===e.from)!,b=nodes.find(n=>n.id===e.to)!;if(a.region!=='haram'||buildingFor(a.floor)!=='masaa'||a.floor!==b.floor||e.kind!=='walk')continue;for(const p of samples(a.position,b.position))assert.ok(p[0]>=61+ROUTE_HALF_WIDTH&&p[0]<=81-ROUTE_HALF_WIDTH&&Math.abs(p[2])<=75.5-ROUTE_HALF_WIDTH,e.id)}})
test('all documented building levels have an accessible modeled destination and lift connection',()=>{assert.equal(haramLevels.filter(l=>l.building==='riwaq').length,6);assert.equal(haramLevels.filter(l=>l.building==='masaa').length,7);for(const l of haramLevels.filter(l=>l.id!==0&&l.id!==3)){const p=pois.find(p=>p.id===`level-${l.id}`)!;assert.ok(p);const route=shortestPath('f0-south',p.nodeId,true)!;assert.ok(route);assert.equal(route.points.at(-1)![1],l.y);assert.ok(route.ids.some(id=>id.includes('lift')))}})
test('regional ground walking paths clear tent roofs and mosque buildings',()=>{for(const e of edges){const a=nodes.find(n=>n.id===e.from)!,b=nodes.find(n=>n.id===e.to)!;if(!['mina','muzdalifah','arafat'].includes(a.region)||a.floor!==0||b.floor!==0||e.kind!=='walk')continue;for(const p of samples(a.position,b.position))for(const box of regionalObstacles){const dx=Math.max(Math.abs(p[0]-box.x)-box.w/2,0),dz=Math.max(Math.abs(p[2]-box.z)-box.d/2,0);assert.ok(Math.hypot(dx,dz)>ROUTE_HALF_WIDTH,`${e.id} intersects ${box.name} at ${box.x},${box.z}`)}}})
test('Arafat alternate route goes around the hill instead of across its rocks',()=>{for(const e of edges){const a=nodes.find(n=>n.id===e.from)!,b=nodes.find(n=>n.id===e.to)!;if(a.region!=='arafat'||e.kind!=='walk')continue;for(const p of samples(a.position,b.position))assert.ok(Math.hypot(p[0]-975,p[2]+49)>26.6,`${e.id} crosses Jabal Al Rahmah`)}})
test('Mina walking routes avoid the three Jamarat basins',()=>{for(const e of edges){const a=nodes.find(n=>n.id===e.from)!,b=nodes.find(n=>n.id===e.to)!;if(a.region!=='mina'||e.kind!=='walk')continue;for(const p of samples(a.position,b.position))for(const z of [-52,-15,22])assert.ok(((p[0]-300)/(5.95+ROUTE_HALF_WIDTH))**2+((p[2]-z)/(10.5+ROUTE_HALF_WIDTH))**2>1,`${e.id} crosses basin ${z}`)}})

test("specific building-level search takes precedence over the general Safa shortcut",()=>{assert.equal(resolveDestination("المسعى الثاني").id,"level-9");assert.equal(resolveDestination("المسعى · الثاني").id,"level-9");assert.equal(resolveDestination("المسعى").id,"safa");assert.equal(resolveDestination("باب الملك فهد").id,"gate-fahd")})
