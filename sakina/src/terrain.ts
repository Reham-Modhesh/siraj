import type {Vec3} from './navigation'
export const regionalTents={
 mina:[359,371,383,407,419,431,463,475,487].flatMap(x=>[-53,-41,-29,-17,13,25,37].map(z=>({p:[x,0,z] as Vec3,s:[8.5,1,8.5] as Vec3}))),
 muzdalifah:[575,589,603,666,680,694].flatMap(x=>[-2,13,28].map(z=>({p:[x,0,z] as Vec3,s:[8,1,8] as Vec3}))),
 arafat:[930,946,978,994,1010].flatMap(x=>[79,93].map(z=>({p:[x,0,z] as Vec3,s:[11,1,10] as Vec3}))),
}
export const regionalObstacles=[...Object.values(regionalTents).flat().map(t=>({x:t.p[0],z:t.p[2],w:t.s[0]+1,d:t.s[2]+1,name:'tent'})),{x:890,z:62,w:58,d:32,name:'Namirah building'},{x:620,z:-48,w:40.6,d:22.4,name:'Mashar building'}]
