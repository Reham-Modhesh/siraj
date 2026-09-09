import type {Lang} from './i18n/types'
export type BuildingId='riwaq'|'masaa'
type Names=Record<Lang,string>
const names=(ar:string,en:string,ur:string,id:string,tr:string,fr:string,fa:string):Names=>({ar,en,ur,id,tr,fr,fa})
export const buildingNames:Record<BuildingId,Names>={riwaq:names('الرواق السعودي','Saudi Riwaq','سعودی رواق','Riwaq Saudi','Suudi Revakı','Riwaq saoudien','رواق سعودی'),masaa:names('المسعى',"Sa’i building",'مسعی','Bangunan Sa’i','Sa’y binası','Bâtiment du Sa’i','مسعی')}
const ground=names('الأرضي','Ground','گراؤنڈ','Dasar','Zemin','Rez-de-chaussée','همکف'),first=names('الأول','First','پہلی','1','1','Premier','اول'),roof=names('السطح','Roof','چھت','Atap','Çatı','Toit','بام'),basement=names('القبو','Basement','تہہ خانہ','Bawah tanah','Bodrum','Sous-sol','زیرزمین'),second=names('الثاني','Second','دوسری','2','2','Deuxième','دوم')
const mezz=(n:number)=>names(`ميزان ${n}`,`Mezzanine ${n}`,`میزان ${n}`,`Mezanin ${n}`,`Asma kat ${n}`,`Mezzanine ${n}`,`نیم‌طبقه ${n}`)
export type Level={id:number;building:BuildingId;names:Names;short:string;y:number}
// Stable internal IDs; heights are schematic, not surveyed elevations.
// The official directory assigns Mataf courtyard to Riwaq basement. ID 0
// retains the existing courtyard datum; its ID is not a displayed floor number.
export const haramLevels:Level[]=[
 {id:0,building:'riwaq',names:basement,short:'B',y:0},
 {id:4,building:'riwaq',names:ground,short:'G',y:3},
 {id:5,building:'riwaq',names:mezz(1),short:'M1',y:4.5},
 {id:1,building:'riwaq',names:first,short:'1',y:9},
 {id:6,building:'riwaq',names:mezz(2),short:'M2',y:13.5},
 {id:2,building:'riwaq',names:roof,short:'R',y:18},
 {id:7,building:'masaa',names:basement,short:'B',y:-4.5},
 {id:3,building:'masaa',names:ground,short:'G',y:4.5},
 {id:10,building:'masaa',names:mezz(1),short:'M1',y:9},
 {id:8,building:'masaa',names:first,short:'1',y:13.5},
 {id:11,building:'masaa',names:mezz(2),short:'M2',y:18},
 {id:9,building:'masaa',names:second,short:'2',y:22.5},
 {id:12,building:'masaa',names:roof,short:'R',y:27},
]
export const levelById=(id:number)=>haramLevels.find(l=>l.id===id)!
export const floorElevation=(region:string,id:number)=>region==='towers'&&id===1?16:region==='haram'?levelById(id)?.y??0:id*9
export const buildingFor=(id:number):BuildingId=>levelById(id)?.building??'riwaq'
export const levelLabel=(id:number,lang:Lang)=>{const l=levelById(id);return l?`${buildingNames[l.building][lang]} · ${l.names[lang]}`:''}
export const levelPOINames:Record<string,Names>=Object.fromEntries(haramLevels.filter(l=>l.id!==0&&l.id!==3).map(l=>[`level-${l.id}`,Object.fromEntries(Object.keys(l.names).map(lang=>[lang,levelLabel(l.id,lang as Lang)])) as Names]))
export const levelUI={building:names('المبنى','Building','عمارت','Bangunan','Bina','Bâtiment','ساختمان'),next:names('الخطوة التالية','Next step','اگلا مرحلہ','Langkah berikutnya','Sonraki adım','Étape suivante','گام بعدی'),previous:names('الخطوة السابقة','Previous step','پچھلا مرحلہ','Langkah sebelumnya','Önceki adım','Étape précédente','گام قبلی'),preview:names('معاينة الخطوات','Preview directions','ہدایات کا پیش نظارہ','Pratinjau petunjuk','Yol tarifini önizle','Aperçu des étapes','پیش‌نمایش مسیر'),source:names('المصدر الرسمي','Official source','سرکاری ماخذ','Sumber resmi','Resmî kaynak','Source officielle','منبع رسمی')}
export const OFFICIAL_MAP='https://maps.alharamain.gov.sa/navQ/default-kiosk/3?lang=ar'
