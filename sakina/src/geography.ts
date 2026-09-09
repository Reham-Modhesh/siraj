import {haramLevels} from './levels'
import type {Lang} from './i18n/index'
import type {Vec3,Category} from './navigation'
export type RegionId='haram'|'towers'|'mina'|'muzdalifah'|'arafat'
export type RegionView=RegionId|'overview'
export type Names=Record<Lang,string>
export const names=(ar:string,en:string,ur:string,id:string,tr:string,fr:string,fa:string):Names=>({ar,en,ur,id,tr,fr,fa})
export const regionNames:Record<RegionView,Names>={
 overview:names('كل المشاعر','All sites','تمام مشاعر','Semua kawasan','Tüm bölgeler','Tous les sites','همه مشاعر'),
 haram:names('الحرم','Haram','حرم','Haram','Harem','Haram','حرم'),
 towers:names('الأبراج','Clock Towers','کلاک ٹاورز','Menara Jam','Saat Kuleleri','Tours de l’Horloge','برج‌های ساعت'),
 mina:names('منى','Mina','منیٰ','Mina','Mina','Mina','منا'),
 muzdalifah:names('مزدلفة','Muzdalifah','مزدلفہ','Muzdalifah','Müzdelife','Muzdalifah','مزدلفه'),
 arafat:names('عرفات','Arafat','عرفات','Arafah','Arafat','Arafat','عرفات')
}
export const regions:{id:RegionId;center:Vec3;zoom:number;floors:number[];entry:string;destination:string;color:string}[]=[
 {id:'haram',center:[-5,5,-20],zoom:1.2,floors:haramLevels.map(l=>l.id),entry:'f0-south',destination:'mataf',color:'#3a7467'},
 {id:'towers',center:[0,37,-151],zoom:1.5,floors:[0,1],entry:'towers-plaza',destination:'clock-tower',color:'#937344'},
 {id:'mina',center:[365,2,-7],zoom:1.25,floors:[0,1,2],entry:'mina-entry',destination:'mina-camp',color:'#b59258'},
 {id:'muzdalifah',center:[638,1,0],zoom:1.55,floors:[0],entry:'muz-entry',destination:'mashar-mosque',color:'#948575'},
 {id:'arafat',center:[950,4,0],zoom:1.15,floors:[0],entry:'arafat-entry',destination:'jabal-rahmah',color:'#759079'}
]
export const regionConfig=(id:RegionId)=>regions.find(r=>r.id===id)!
export function regionAt(position:Vec3):RegionId{return position[0]>790?'arafat':position[0]>535?'muzdalifah':position[0]>215?'mina':position[2]<=-95&&position[0]<110?'towers':'haram'}
export const regionalText={
 label:names('الحرم والمشاعر','Haram & holy sites','حرم اور مشاعر','Haram & tempat suci','Harem ve kutsal yerler','Haram et lieux saints','حرم و مشاعر'),
 mock:names('مخطط تجريبي · المسافات بين المناطق مختصرة','Demo layout · distances between areas are compressed','فرضی نقشہ · علاقوں کے درمیان فاصلے مختصر ہیں','Peta demo · jarak antarwilayah dipersingkat','Demo harita · bölgeler arası mesafeler kısaltılmıştır','Plan de démonstration · distances entre sites réduites','نقشه آزمایشی · فاصله بین مناطق کوتاه شده است'),
 explore:names('استكشف المنطقة','Explore area','علاقہ دیکھیں','Jelajahi kawasan','Bölgeyi keşfet','Explorer le site','کاوش منطقه'),
 simulate:names('محاكاة من هنا','Simulate from here','یہاں سے نقل حرکت','Simulasi dari sini','Buradan simülasyon','Simuler depuis ici','شبیه‌سازی از اینجا'),
 location:names('موقع افتراضي','Virtual location','فرضی مقام','Lokasi virtual','Sanal konum','Position virtuelle','موقعیت مجازی'),
 here:names('أنت هنا','You are here','آپ یہاں ہیں','Anda di sini','Buradasınız','Vous êtes ici','شما اینجا هستید'),
 transit:names('انتقل عبر الطريق التجريبي','Follow the simulated connection','فرضی رابطے کے راستے پر چلیں','Ikuti jalur penghubung simulasi','Simülasyon bağlantısını izleyin','Suivez la liaison simulée','مسیر ارتباطی شبیه‌سازی‌شده را دنبال کنید'),
 regionalClosure:names('إغلاق الممر الرئيسي في المنطقة','Close area’s main passage','علاقے کا مرکزی راستہ بند کریں','Tutup jalur utama kawasan','Bölgenin ana geçidini kapat','Fermer le passage principal du site','بستن گذرگاه اصلی منطقه'),
 floor:names('مستوى الجسر','Bridge level','پل کی منزل','Tingkat jembatan','Köprü katı','Niveau du pont','طبقه پل'),
 deck:names('الشرفة','Terrace','برآمدہ','Teras','Teras','Terrasse','تراس'),
 destinations:names('معالم المنطقة','Area landmarks','علاقے کی نشانیاں','Landmark kawasan','Bölge simgeleri','Repères du site','نشانه‌های منطقه'),
 next:names('الوجهة التالية','Next destination','اگلی منزل','Tujuan berikutnya','Sonraki hedef','Prochaine destination','مقصد بعدی')
}
export const regionalPOINames:Record<string,Names>={
 'clock-tower':names('برج الساعة','Clock Tower','برج ساعت','Menara Jam','Saat Kulesi','Tour de l’Horloge','برج ساعت'),
 'abraj-plaza':names('ساحة أبراج البيت','Abraj Al Bait Plaza','ابراج البیت کا صحن','Plaza Abraj Al Bait','Ebrac el Beyt Meydanı','Place Abraj Al Bait','میدان ابراج البیت'),
 'tower-terrace':names('شرفة الأبراج','Towers Terrace','ٹاورز کا برآمدہ','Teras Menara','Kule Terası','Terrasse des tours','تراس برج‌ها'),
 'towers-lift':names('مصعد الأبراج','Towers Elevator','ٹاورز کی لفٹ','Lift Menara','Kule Asansörü','Ascenseur des tours','آسانسور برج‌ها'),
 'towers-meeting':names('ملتقى ساحة الأبراج','Plaza Meeting Point','صحن میں ملاقات کی جگہ','Titik Temu Plaza','Meydan Buluşma Noktası','Rendez-vous sur la place','محل ملاقات میدان'),
 'mina-camp':names('مخيم الحجاج · منى','Pilgrim Camp · Mina','حجاج کا کیمپ · منیٰ','Kamp Jemaah · Mina','Hacı Kampı · Mina','Camp des pèlerins · Mina','اردوگاه زائران · منا'),
 'mina-entry-poi':names('مدخل منى','Mina Entrance','منیٰ کا داخلی راستہ','Pintu Masuk Mina','Mina Girişi','Entrée de Mina','ورودی منا'),
 'jamarat':names('جسر الجمرات','Jamarat Bridge','پل جمرات','Jembatan Jamarat','Cemarat Köprüsü','Pont des Jamarat','پل جمرات'),
 'jamrah-small':names('الجمرة الصغرى','Small Jamrah','جمرہ صغریٰ','Jamrah Kecil','Küçük Cemre','Petite Jamrah','جمره صغری'),
 'jamrah-middle':names('الجمرة الوسطى','Middle Jamrah','جمرہ وسطیٰ','Jamrah Tengah','Orta Cemre','Jamrah médiane','جمره وسطی'),
 'jamrah-aqaba':names('جمرة العقبة','Jamrat Al Aqabah','جمرہ عقبہ','Jamrah Aqabah','Akabe Cemresi','Jamrat Al Aqabah','جمره عقبه'),
 'jamarat-upper':names('الجمرات · الدور الأول','Jamarat · First Level','جمرات · پہلی منزل','Jamarat · Lantai Satu','Cemarat · Birinci Kat','Jamarat · Premier niveau','جمرات · طبقه اول'),
 'jamarat-roof':names('الجمرات · المستوى العلوي','Jamarat · Upper Level','جمرات · بالائی منزل','Jamarat · Tingkat Atas','Cemarat · Üst Kat','Jamarat · Niveau supérieur','جمرات · طبقه بالا'),
 'mina-lift':names('مصعد جسر الجمرات','Jamarat Elevator','جمرات کی لفٹ','Lift Jamarat','Cemarat Asansörü','Ascenseur des Jamarat','آسانسور جمرات'),
 'mina-toilets':names('دورات مياه منى','Mina Restrooms','منیٰ کے بیت الخلا','Toilet Mina','Mina Tuvaletleri','Toilettes de Mina','سرویس بهداشتی منا'),
 'mina-medical':names('مركز إسعاف منى','Mina First Aid','منیٰ کا طبی مرکز','Pertolongan Pertama Mina','Mina İlk Yardım','Secours à Mina','امداد منا'),
 'mina-water':names('مياه الشرب · منى','Drinking Water · Mina','پینے کا پانی · منیٰ','Air Minum · Mina','İçme Suyu · Mina','Eau potable · Mina','آب آشامیدنی · منا'),
 'mina-meeting':names('نقطة لقاء منى','Mina Meeting Point','منیٰ میں ملاقات','Titik Temu Mina','Mina Buluşma Noktası','Rendez-vous à Mina','محل ملاقات منا'),
 'muzdalifah-site':names('ساحة مزدلفة','Muzdalifah Plain','مزدلفہ کا میدان','Padang Muzdalifah','Müzdelife Alanı','Plaine de Muzdalifah','دشت مزدلفه'),
 'mashar-mosque':names('مسجد المشعر الحرام','Al Mashar Al Haram Mosque','مسجد مشعر الحرام','Masjid Al Masyar Al Haram','Meşar-i Haram Camii','Mosquée Al Mashar Al Haram','مسجد مشعرالحرام'),
 'muz-services':names('خدمات مزدلفة','Muzdalifah Services','مزدلفہ کی سہولیات','Layanan Muzdalifah','Müzdelife Hizmetleri','Services de Muzdalifah','خدمات مزدلفه'),
 'arafat-site':names('مشعر عرفات','Arafat Plain','میدان عرفات','Padang Arafah','Arafat Alanı','Plaine d’Arafat','صحرای عرفات'),
 'jabal-rahmah':names('جبل الرحمة · السفح','Jabal Al Rahmah · Foot','جبل رحمت · دامن','Jabal Rahmah · Kaki Bukit','Rahmet Tepesi · Etek','Mont de la Miséricorde · Pied','جبل الرحمه · دامنه'),
 'namirah':names('مسجد نمرة','Namirah Mosque','مسجد نمرہ','Masjid Namirah','Nemire Camii','Mosquée Namirah','مسجد نمره'),
 'arafat-camp':names('مخيم عرفات','Arafat Camp','عرفات کیمپ','Kamp Arafah','Arafat Kampı','Camp d’Arafat','اردوگاه عرفات'),
 'arafat-medical':names('إسعافات عرفات','Arafat First Aid','عرفات کی طبی امداد','Pertolongan Pertama Arafah','Arafat İlk Yardım','Secours à Arafat','امداد عرفات'),
 'arafat-water':names('مياه الشرب · عرفات','Drinking Water · Arafat','پینے کا پانی · عرفات','Air Minum · Arafah','İçme Suyu · Arafat','Eau potable · Arafat','آب آشامیدنی · عرفات'),
 'arafat-toilets':names('دورات مياه عرفات','Arafat Restrooms','عرفات کے بیت الخلا','Toilet Arafah','Arafat Tuvaletleri','Toilettes d’Arafat','سرویس بهداشتی عرفات'),
 'arafat-meeting':names('نقطة لقاء عرفات','Arafat Meeting Point','عرفات میں ملاقات','Titik Temu Arafah','Arafat Buluşma Noktası','Rendez-vous à Arafat','محل ملاقات عرفات')
}
export const regionalNodes:{id:string;position:Vec3;floor:number;name:string;region:RegionId}[]=[]
export const regionalEdges:{from:string;to:string;kind:'walk'|'stairs'|'elevator'|'ramp'|'transfer';accessible:boolean;id:string}[]=[]
export const regionalPOIs:{id:string;nodeId:string;category:Category;position?:Vec3}[]=[]
function n(id:string,p:Vec3,r:RegionId,f=0){regionalNodes.push({id,position:p,floor:f,name:regionalPOINames[id]?.ar||regionNames[r].ar,region:r})}
function e(a:string,b:string,kind:'walk'|'stairs'|'elevator'|'ramp'|'transfer'='walk',id=`${a}:${b}`){regionalEdges.push({from:a,to:b,kind,accessible:kind!=='stairs',id})}
function p(id:string,nodeId:string,category:Category='ritual',position?:Vec3){regionalPOIs.push({id,nodeId,category,position})}
// Clock towers: a walkable forecourt and a first-floor terrace.
n('towers-plaza',[0,0,-100],'towers');n('clock-entry',[0,0,-122],'towers');n('towers-meeting',[35,0,-100],'towers');n('tower-lift-0',[-35,0,-122],'towers');n('tower-lift-1',[-35,16,-122],'towers',1);n('tower-terrace',[0,16,-122],'towers',1)
e('f0-north','towers-plaza');e('towers-plaza','clock-entry');e('towers-plaza','towers-meeting');e('clock-entry','tower-lift-0');e('tower-lift-0','tower-lift-1','elevator');e('tower-lift-1','tower-terrace')
p('clock-tower','clock-entry','ritual',[0,85,-155]);p('abraj-plaza','towers-plaza','gate');p('tower-terrace','tower-terrace');p('towers-lift','tower-lift-0','elevator');p('towers-meeting','towers-meeting','meeting')
// Clear external circulation, separate from the indoor Haram graph.
n('haram-link',[105,0,-90],'haram');n('makkah-link',[180,0,-110],'haram');n('mina-entry',[250,0,-45],'mina')
e('f0-north','haram-link');e('haram-link','makkah-link','transfer');e('makkah-link','mina-entry','transfer')
for(const [id,pos] of [['mina-west',[280,0,55]],['mina-junction',[345,0,55]],['mina-south',[395,0,55]],['mina-east',[445,0,55]],['mina-north-east',[445,0,-65]],['mina-north',[395,0,-65]],['mina-north-west',[345,0,-65]],['mina-middle-west',[345,0,0]],['mina-middle',[395,0,0]],['mina-middle-east',[445,0,0]],['mina-camp',[395,0,25]]] as [string,Vec3][])n(id,pos,'mina')
e('mina-entry','mina-west');e('mina-west','mina-junction');e('mina-junction','mina-south');e('mina-south','mina-east');e('mina-east','mina-middle-east');e('mina-middle-east','mina-north-east');e('mina-north-east','mina-north');e('mina-north','mina-north-west');e('mina-north-west','mina-middle-west');e('mina-middle-west','mina-junction');e('mina-middle-west','mina-middle');e('mina-middle','mina-middle-east');e('mina-south','mina-camp');e('mina-camp','mina-middle','walk','mina-main-passage');n('mina-perimeter-west',[250,0,-86],'mina');n('mina-perimeter-north',[345,0,-86],'mina');e('mina-entry','mina-perimeter-west');e('mina-perimeter-west','mina-perimeter-north');e('mina-perimeter-north','mina-north-west')
for(let f=0;f<3;f++){n(`mina-lift-${f}`,[317,f*9,52],'mina',f);n(`mina-stairs-${f}`,[288,f*9,50],'mina',f);for(const [id,z] of [['small',22],['middle',-15],['aqaba',-52]] as [string,number][])n(`jamrah-${id}-${f}`,[309,f*9,z],'mina',f);e(`mina-lift-${f}`,`jamrah-small-${f}`);n(`mina-landing-${f}`,[309,f*9,50],'mina',f);e(`mina-stairs-${f}`,`mina-landing-${f}`);e(`mina-landing-${f}`,`jamrah-small-${f}`);e(`jamrah-small-${f}`,`jamrah-middle-${f}`);e(`jamrah-middle-${f}`,`jamrah-aqaba-${f}`);if(f){e(`mina-lift-${f-1}`,`mina-lift-${f}`,'elevator');e(`mina-stairs-${f-1}`,`mina-stairs-${f}`,'stairs')}}
e('mina-west','mina-stairs-0');e('mina-junction','mina-lift-0')
p('mina-entry-poi','mina-entry','gate');p('mina-camp','mina-camp');p('jamarat','mina-lift-0');p('jamrah-small','jamrah-small-0');p('jamrah-middle','jamrah-middle-0');p('jamrah-aqaba','jamrah-aqaba-0');p('jamarat-upper','jamrah-middle-1');p('jamarat-roof','jamrah-middle-2');p('mina-lift','mina-lift-0','elevator');p('mina-toilets','mina-east','toilet');p('mina-medical','mina-north-east','medical');p('mina-water','mina-middle-east','water');p('mina-meeting','mina-junction','meeting')
// A linking plain keeps the pilgrimage places in their logical sequence.
n('muz-entry',[555,0,55],'muzdalifah');n('muz-junction',[640,0,55],'muzdalifah');n('muzdalifah-site',[640,0,0],'muzdalifah');n('mashar-mosque',[620,0,-25],'muzdalifah');n('muz-north',[580,0,-25],'muzdalifah');n('muz-exit',[715,0,35],'muzdalifah');
e('mina-east','muz-entry','transfer');e('muz-entry','muz-junction');e('muz-junction','muzdalifah-site');e('muzdalifah-site','mashar-mosque');n('muz-perimeter',[550,0,-25],'muzdalifah');e('muz-entry','muz-perimeter');e('muz-perimeter','muz-north');e('muz-north','mashar-mosque');e('muz-junction','muz-exit')
p('muzdalifah-site','muzdalifah-site');p('mashar-mosque','mashar-mosque');p('muz-services','muz-junction','toilet')
for(const [id,pos] of [['arafat-entry',[815,0,45]],['arafat-west',[870,0,42]],['namirah',[895,0,25]],['arafat-center',[940,0,30]],['arafat-site',[940,0,-10]],['jabal-rahmah',[975,0,-20]],['arafat-north',[1005,0,-65]],['arafat-east',[1020,0,30]],['arafat-camp',[970,0,65]],['arafat-south',[940,0,65]]] as [string,Vec3][])n(id,pos,'arafat')
e('muz-exit','arafat-entry','transfer');e('arafat-entry','arafat-west');e('arafat-west','namirah');e('namirah','arafat-center');e('arafat-center','arafat-site','walk','arafat-main-passage');e('arafat-site','jabal-rahmah');e('arafat-center','arafat-east');e('arafat-east','arafat-north');n('arafat-hill-east',[1030,0,-24],'arafat');n('arafat-hill-front',[1005,0,-10],'arafat');e('arafat-north','arafat-hill-east');e('arafat-hill-east','arafat-hill-front');e('arafat-hill-front','jabal-rahmah');e('arafat-center','arafat-south');e('arafat-south','arafat-camp');e('arafat-camp','arafat-east')
p('arafat-site','arafat-site');p('jabal-rahmah','jabal-rahmah');p('namirah','namirah');p('arafat-camp','arafat-camp');p('arafat-medical','arafat-east','medical');p('arafat-water','arafat-center','water');p('arafat-toilets','arafat-south','toilet');p('arafat-meeting','arafat-west','meeting')
export const closureByRegion:Partial<Record<RegionId,string>>={haram:'main-passage',mina:'mina-main-passage',arafat:'arafat-main-passage'}
