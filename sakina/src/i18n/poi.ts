import {levelPOINames,levelLabel,haramLevels} from '../levels'
import {regionalPOINames,regionNames} from '../geography'
// Display-name/description tables keyed by the EXISTING ids from
// navigation.ts (pois/stages/floors/categories/node names are never
// modified - only looked up here for translation).
//
// Deliberately no runtime import of navigation.ts here (only `import
// type`, which TypeScript erases): navigation.ts itself imports from
// this module (poiName/nodeName, for localized instructions and
// search) - a runtime import back to navigation.ts would create an
// import cycle. Completeness against the live pois/stages/floors/
// categories arrays is instead verified in src/i18n.test.ts, which is
// free to depend on both.
import type {Category} from '../navigation'
import type {Lang} from './types'

type LangMap = Record<Lang, string>

const POI_NAMES: Record<string, LangMap> = {
 ...regionalPOINames,
 ...levelPOINames,
 kaaba: {ar: 'الكعبة المشرفة', en: 'The Holy Kaaba', ur: 'خانہ کعبہ', id: 'Kakbah yang Mulia', tr: 'Kutsal Kâbe', fr: 'La Sainte Kaaba', fa: 'کعبه معظمه'},
 mataf: {ar: 'صحن المطاف', en: 'Mataf Courtyard', ur: 'صحنِ مطاف', id: 'Halaman Mataf', tr: 'Mataf Avlusu', fr: 'Cour du Mataf', fa: 'صحن مطاف'},
 'tawaf-start': {ar: 'بداية الطواف', en: 'Tawaf Starting Point', ur: 'طواف کا آغاز', id: 'Titik Awal Tawaf', tr: 'Tavaf Başlangıcı', fr: 'Point de départ du Tawaf', fa: 'نقطه شروع طواف'},
 prayer: {ar: 'ركعتا الطواف · خلف المقام', en: 'Tawaf Prayer · Behind the Maqam', ur: 'طواف کی نماز · مقام کے پیچھے', id: 'Salat Tawaf · Belakang Maqam', tr: 'Tavaf Namazı · Makam Arkası', fr: 'Prière du Tawaf · derrière la Station', fa: 'نماز طواف · پشت مقام'},
 maqam: {ar: 'مقام إبراهيم', en: 'Maqam Ibrahim', ur: 'مقامِ ابراہیم', id: 'Maqam Ibrahim', tr: 'İbrahim Makamı', fr: "Station d'Abraham", fa: 'مقام ابراهیم'},
 safa: {ar: 'الصفا', en: 'Safa', ur: 'صفا', id: 'Safa', tr: 'Safa', fr: 'Safa', fa: 'صفا'},
 marwa: {ar: 'المروة', en: 'Marwah', ur: 'مروہ', id: 'Marwah', tr: 'Merve', fr: 'Marwah', fa: 'مروه'},
 'gate-fahd': {ar: 'باب الملك فهد · 79', en: 'King Fahd Gate · 79', ur: 'شاہ فہد گیٹ · 79', id: 'Gerbang Raja Fahd · 79', tr: 'Kral Fahd Kapısı · 79', fr: 'Porte du Roi Fahd · 79', fa: 'دروازه ملک فهد · 79'},
 exit: {ar: 'باب المروة · مخرج', en: 'Marwah Gate · Exit', ur: 'باب مروہ · خروجی', id: 'Gerbang Marwah · Keluar', tr: 'Merve Kapısı · Çıkış', fr: 'Porte de Marwah · Sortie', fa: 'دروازه مروه · خروجی'},
 'mataf-exit': {ar: 'مخرج المطاف', en: 'Mataf Exit', ur: 'مطاف کا خروجی راستہ', id: 'Keluar Mataf', tr: 'Mataf Çıkışı', fr: 'Sortie du Mataf', fa: 'خروجی مطاف'},
 zamzam: {ar: 'ماء زمزم', en: 'Zamzam Water', ur: 'آبِ زمزم', id: 'Air Zamzam', tr: 'Zemzem Suyu', fr: 'Eau de Zamzam', fa: 'آب زمزم'},
 'zamzam-upper': {ar: 'زمزم · الأول', en: 'Zamzam · First Floor', ur: 'زمزم · پہلی منزل', id: 'Zamzam · Lantai 1', tr: 'Zemzem · 1. Kat', fr: 'Zamzam · 1er étage', fa: 'زمزم · طبقه اول'},
 toilet: {ar: 'دورات المياه', en: 'Restrooms', ur: 'بیت الخلاء', id: 'Toilet', tr: 'Tuvaletler', fr: 'Toilettes', fa: 'سرویس بهداشتی'},
 medical: {ar: 'الإسعافات الأولية', en: 'First Aid', ur: 'ابتدائی طبی امداد', id: 'Pertolongan Pertama', tr: 'İlk Yardım', fr: 'Premiers secours', fa: 'کمک‌های اولیه'},
 cart: {ar: 'مركز العربات', en: 'Cart Center', ur: 'گاڑی مرکز', id: 'Pusat Kereta', tr: 'Araç Merkezi', fr: 'Centre de chariots', fa: 'مرکز ویلچرهای برقی'},
 family: {ar: 'ملتقى العائلة', en: 'Family Meeting Point', ur: 'خاندانی ملاقات کا مقام', id: 'Titik Temu Keluarga', tr: 'Aile Buluşma Noktası', fr: 'Point de rencontre familial', fa: 'محل ملاقات خانواده'},
 'lift-0': {ar: 'المصعد الغربي', en: 'West Elevator', ur: 'مغربی لفٹ', id: 'Lift Barat', tr: 'Batı Asansörü', fr: 'Ascenseur ouest', fa: 'آسانسور غربی'},
 'lift-1': {ar: 'المصعد الغربي', en: 'West Elevator', ur: 'مغربی لفٹ', id: 'Lift Barat', tr: 'Batı Asansörü', fr: 'Ascenseur ouest', fa: 'آسانسور غربی'},
 'lift-2': {ar: 'المصعد الغربي', en: 'West Elevator', ur: 'مغربی لفٹ', id: 'Lift Barat', tr: 'Batı Asansörü', fr: 'Ascenseur ouest', fa: 'آسانسور غربی'},
 'escalator-0': {ar: 'السلم الكهربائي', en: 'Escalator', ur: 'برقی سیڑھی', id: 'Eskalator', tr: 'Yürüyen Merdiven', fr: 'Escalator', fa: 'پله برقی'},
 'escalator-1': {ar: 'السلم الكهربائي', en: 'Escalator', ur: 'برقی سیڑھی', id: 'Eskalator', tr: 'Yürüyen Merdiven', fr: 'Escalator', fa: 'پله برقی'},
 'escalator-2': {ar: 'السلم الكهربائي', en: 'Escalator', ur: 'برقی سیڑھی', id: 'Eskalator', tr: 'Yürüyen Merdiven', fr: 'Escalator', fa: 'پله برقی'},
 'accessible-0': {ar: 'مصلى ذوي الإعاقة', en: 'Accessible Prayer Area', ur: 'معذورین کے لیے مصلیٰ', id: 'Area Salat Difabel', tr: 'Engelli Namaz Alanı', fr: 'Espace de prière accessible', fa: 'مصلای معلولان'},
 'accessible-1': {ar: 'مصلى ذوي الإعاقة', en: 'Accessible Prayer Area', ur: 'معذورین کے لیے مصلیٰ', id: 'Area Salat Difabel', tr: 'Engelli Namaz Alanı', fr: 'Espace de prière accessible', fa: 'مصلای معلولان'},
 'accessible-2': {ar: 'مصلى ذوي الإعاقة', en: 'Accessible Prayer Area', ur: 'معذورین کے لیے مصلیٰ', id: 'Area Salat Difabel', tr: 'Engelli Namaz Alanı', fr: 'Espace de prière accessible', fa: 'مصلای معلولان'},
 roof: {ar: 'مصلى السطح', en: 'Roof Prayer Area', ur: 'چھت کا مصلیٰ', id: 'Area Salat Atap', tr: 'Çatı Namaz Alanı', fr: 'Espace de prière du toit', fa: 'مصلای پشت‌بام'},
 'upper-prayer': {ar: 'مصلى الدور الأول', en: 'First Floor Prayer Area', ur: 'پہلی منزل کا مصلیٰ', id: 'Area Salat Lantai 1', tr: '1. Kat Namaz Alanı', fr: 'Espace de prière du 1er étage', fa: 'مصلای طبقه اول'},
 'masaa-water': {ar: 'زمزم · المسعى', en: "Zamzam · Sa'i Area", ur: 'زمزم · سعی کا علاقہ', id: "Zamzam · Area Sa'i", tr: "Zemzem · Sa'y Alanı", fr: "Zamzam · Zone du Sa'i", fa: 'زمزم · محوطه سعی'},
}

const STAGE_NAMES: LangMap[] = [
 {ar: 'الدخول إلى المسجد الحرام', en: 'Entering Al-Masjid Al-Haram', ur: 'مسجد الحرام میں داخلہ', id: 'Memasuki Masjidil Haram', tr: "Mescid-i Haram'a Giriş", fr: 'Entrée dans Al-Masjid Al-Haram', fa: 'ورود به مسجدالحرام'},
 {ar: 'التوجه إلى المطاف', en: 'Heading to the Mataf', ur: 'مطاف کی طرف روانگی', id: 'Menuju Mataf', tr: "Mataf'a Yöneliş", fr: 'En route vers le Mataf', fa: 'حرکت به سمت مطاف'},
 {ar: 'الوصول إلى بداية الطواف', en: 'Reaching the Tawaf Starting Point', ur: 'طواف کے آغاز تک پہنچنا', id: 'Tiba di Titik Awal Tawaf', tr: 'Tavaf Başlangıcına Varış', fr: 'Arrivée au point de départ du Tawaf', fa: 'رسیدن به نقطه شروع طواف'},
 {ar: 'الطواف سبعة أشواط', en: 'Tawaf: Seven Laps', ur: 'طواف: سات چکر', id: 'Tawaf: Tujuh Putaran', tr: 'Tavaf: Yedi Tur', fr: 'Tawaf : sept tours', fa: 'طواف: هفت دور'},
 {ar: 'ركعتا الطواف خلف المقام', en: 'Tawaf Prayer Behind the Maqam', ur: 'مقام کے پیچھے طواف کی نماز', id: 'Salat Tawaf di Belakang Maqam', tr: 'Makam Arkasında Tavaf Namazı', fr: 'Prière du Tawaf derrière la Station', fa: 'نماز طواف پشت مقام'},
 {ar: 'ماء زمزم', en: 'Zamzam Water', ur: 'آبِ زمزم', id: 'Air Zamzam', tr: 'Zemzem Suyu', fr: 'Eau de Zamzam', fa: 'آب زمزم'},
 {ar: 'التوجه إلى الصفا', en: 'Heading to Safa', ur: 'صفا کی طرف روانگی', id: 'Menuju Safa', tr: "Safa'ya Yöneliş", fr: 'En route vers Safa', fa: 'حرکت به سمت صفا'},
 {ar: 'السعي سبعة أشواط', en: "Sa'i: Seven Laps", ur: 'سعی: سات چکر', id: "Sa'i: Tujuh Putaran", tr: "Sa'y: Yedi Tur", fr: "Sa'i : sept tours", fa: 'سعی: هفت دور'},
 {ar: 'الخروج للحلق أو التقصير', en: 'Exiting for Shaving/Trimming', ur: 'حلق یا تقصیر کے لیے روانگی', id: 'Keluar untuk Mencukur/Memotong Rambut', tr: 'Tıraş/Kısaltma İçin Çıkış', fr: 'Sortie pour le rasage/la coupe', fa: 'خروج برای حلق یا تقصیر'},
 {ar: 'اكتمال رحلة العمرة', en: 'Umrah Journey Complete', ur: 'عمرہ کا سفر مکمل', id: 'Perjalanan Umrah Selesai', tr: 'Umre Yolculuğu Tamamlandı', fr: 'Parcours de la Omra terminé', fa: 'سفر عمره تکمیل شد'},
]

const STAGE_HINTS: LangMap[] = [
 {ar: 'ابدأ رحلتك من الباب الرئيسي', en: 'Start your journey from the main gate', ur: 'اپنا سفر مرکزی دروازے سے شروع کریں', id: 'Mulai perjalanan Anda dari gerbang utama', tr: 'Yolculuğunuza ana kapıdan başlayın', fr: 'Commencez votre parcours depuis la porte principale', fa: 'سفر خود را از دروازه اصلی آغاز کنید'},
 {ar: 'اتبع المسار إلى صحن المطاف', en: 'Follow the path to the Mataf courtyard', ur: 'صحنِ مطاف تک راستے پر چلیں', id: 'Ikuti jalur menuju halaman Mataf', tr: 'Mataf avlusuna giden yolu izleyin', fr: 'Suivez le chemin vers la cour du Mataf', fa: 'مسیر رسیدن به صحن مطاف را دنبال کنید'},
 {ar: 'توجّه إلى نقطة بداية الطواف', en: 'Head to the Tawaf starting point', ur: 'طواف کے آغاز کی جگہ کی طرف بڑھیں', id: 'Menuju titik awal Tawaf', tr: 'Tavaf başlangıç noktasına yönelin', fr: 'Dirigez-vous vers le point de départ du Tawaf', fa: 'به سمت نقطه شروع طواف بروید'},
 {ar: 'أكد إكمال كل شوط بنفسك', en: 'Confirm each lap yourself as you complete it', ur: 'ہر چکر مکمل ہونے پر خود تصدیق کریں', id: 'Konfirmasi setiap putaran sendiri saat menyelesaikannya', tr: 'Her turu tamamladıkça kendiniz onaylayın', fr: 'Confirmez chaque tour vous-même en le terminant', fa: 'با تکمیل هر دور، خودتان آن را تأیید کنید'},
 {ar: 'المقام أمامك والكعبة خلفه · صلّ ركعتين عند التيسّر', en: "The Maqam is ahead of you with the Kaaba behind it · pray two rak'ahs when convenient", ur: 'مقام آپ کے سامنے اور کعبہ اس کے پیچھے ہے · موقع ملنے پر دو رکعت نماز پڑھیں', id: 'Maqam di depan Anda, Kakbah di belakangnya · salat dua rakaat saat memungkinkan', tr: 'Makam önünüzde, Kâbe arkasında · uygun olduğunda iki rekat namaz kılın', fr: "La Station est devant vous, la Kaaba derrière · priez deux rak'ahs dès que possible", fa: 'مقام روبروی شماست و کعبه پشت آن · هنگام امکان، دو رکعت نماز بخوانید'},
 {ar: 'موقع زمزم القريب من المطاف', en: 'The Zamzam location near the Mataf', ur: 'مطاف کے قریب زمزم کا مقام', id: 'Lokasi Zamzam dekat Mataf', tr: "Mataf'a yakın Zemzem noktası", fr: 'Le point Zamzam près du Mataf', fa: 'محل زمزم نزدیک مطاف'},
 {ar: 'بداية مسارك إلى المسعى', en: "The start of your path to the Sa'i area", ur: 'سعی کے علاقے کی طرف آپ کے راستے کا آغاز', id: "Awal jalur Anda menuju area Sa'i", tr: "Sa'y alanına giden yolunuzun başlangıcı", fr: "Le début de votre chemin vers la zone du Sa'i", fa: 'آغاز مسیر شما به سمت محوطه سعی'},
 {ar: 'من الصفا إلى المروة، ثم العودة', en: 'From Safa to Marwah, then back', ur: 'صفا سے مروہ تک، پھر واپسی', id: 'Dari Safa ke Marwah, lalu kembali', tr: "Safa'dan Merve'ye, sonra geri", fr: 'De Safa à Marwah, puis retour', fa: 'از صفا تا مروه، سپس بازگشت'},
 {ar: 'توجه إلى المخرج لإتمام النسك', en: 'Head to the exit to complete the ritual', ur: 'نسک مکمل کرنے کے لیے خروجی کی طرف جائیں', id: 'Menuju pintu keluar untuk menyelesaikan ibadah', tr: 'İbadeti tamamlamak için çıkışa yönelin', fr: 'Dirigez-vous vers la sortie pour terminer le rite', fa: 'برای تکمیل مناسک به سمت خروجی بروید'},
 {ar: 'أكد إتمام رحلتك', en: 'Confirm your journey is complete', ur: 'اپنے سفر کی تکمیل کی تصدیق کریں', id: 'Konfirmasi perjalanan Anda telah selesai', tr: 'Yolculuğunuzun tamamlandığını onaylayın', fr: 'Confirmez que votre parcours est terminé', fa: 'تکمیل سفر خود را تأیید کنید'},
]

const FLOOR_NAMES: Record<number, LangMap> = {
 ...Object.fromEntries(haramLevels.map(l=>[l.id,l.names])),
 0: {ar: 'الدور الأرضي', en: 'Ground Floor', ur: 'گراؤنڈ فلور', id: 'Lantai Dasar', tr: 'Zemin Kat', fr: 'Rez-de-chaussée', fa: 'طبقه همکف'},
 1: {ar: 'الدور الأول', en: 'First Floor', ur: 'پہلی منزل', id: 'Lantai 1', tr: '1. Kat', fr: 'Premier étage', fa: 'طبقه اول'},
 2: {ar: 'السطح', en: 'Roof', ur: 'چھت', id: 'Atap', tr: 'Çatı', fr: 'Toit', fa: 'پشت‌بام'},
 3: {ar: 'المسعى · الأرضي', en: "Sa’i · Ground", ur: 'مسعی · گراؤنڈ', id: 'Sa’i · Dasar', tr: 'Sa’y · Zemin', fr: 'Sa’i · Rez-de-chaussée', fa: 'مسعی · همکف'},
}

const CATEGORY_NAMES: Record<Category, LangMap> = {
 ritual: {ar: 'المناسك', en: 'Rituals', ur: 'عبادات', id: 'Ibadah', tr: 'İbadetler', fr: 'Rites', fa: 'مناسک'},
 gate: {ar: 'الأبواب', en: 'Gates', ur: 'دروازے', id: 'Gerbang', tr: 'Kapılar', fr: 'Portes', fa: 'دروازه‌ها'},
 water: {ar: 'زمزم', en: 'Zamzam', ur: 'زمزم', id: 'Zamzam', tr: 'Zemzem', fr: 'Zamzam', fa: 'زمزم'},
 toilet: {ar: 'دورات المياه', en: 'Restrooms', ur: 'بیت الخلاء', id: 'Toilet', tr: 'Tuvaletler', fr: 'Toilettes', fa: 'سرویس بهداشتی'},
 medical: {ar: 'الإسعافات', en: 'First Aid', ur: 'طبی امداد', id: 'P3K', tr: 'İlk Yardım', fr: 'Premiers secours', fa: 'کمک‌های اولیه'},
 cart: {ar: 'العربات', en: 'Carts', ur: 'گاڑیاں', id: 'Kereta', tr: 'Araçlar', fr: 'Chariots', fa: 'ویلچرهای برقی'},
 elevator: {ar: 'المصاعد', en: 'Elevators', ur: 'لفٹیں', id: 'Lift', tr: 'Asansörler', fr: 'Ascenseurs', fa: 'آسانسورها'},
 escalator: {ar: 'السلالم الكهربائية', en: 'Escalators', ur: 'برقی سیڑھیاں', id: 'Eskalator', tr: 'Yürüyen Merdivenler', fr: 'Escalators', fa: 'پله‌های برقی'},
 meeting: {ar: 'نقاط اللقاء', en: 'Meeting Points', ur: 'ملاقات کے مقامات', id: 'Titik Temu', tr: 'Buluşma Noktaları', fr: 'Points de rencontre', fa: 'نقاط ملاقات'},
 accessible: {ar: 'ذوو الإعاقة', en: 'Accessibility', ur: 'معذورین کی سہولت', id: 'Aksesibilitas', tr: 'Erişilebilirlik', fr: 'Accessibilité', fa: 'دسترسی معلولان'},
}

// Small number of generic graph-node display names that can surface as
// turn-by-turn landmark text (see navigation.ts::navigationSteps) when a
// route passes through a node not already special-cased by id.
const NODE_NAMES: Record<string, LangMap> = {
 'رواق المطاف': {ar: 'رواق المطاف', en: 'Mataf Arcade', ur: 'مطاف کا برآمدہ', id: 'Serambi Mataf', tr: 'Mataf Revağı', fr: 'Arcade du Mataf', fa: 'رواق مطاف'},
 'السلالم الشرقية': {ar: 'السلالم الشرقية', en: 'East Stairs', ur: 'مشرقی سیڑھیاں', id: 'Tangga Timur', tr: 'Doğu Merdiveni', fr: 'Escalier est', fa: 'پله‌های شرقی'},
 الرواق: {ar: 'الرواق', en: 'The Arcade', ur: 'برآمدہ', id: 'Serambi', tr: 'Revak', fr: "L'arcade", fa: 'رواق'},
}

function fallbackWarn(kind: string, id: string | number, lang: Lang) {
 if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) console.warn(`[i18n] missing ${kind} translation for "${id}" / "${lang}", falling back to ar`)
}

// Note: these look up static tables only (no live navigation.ts data),
// so an id with no table entry falls back to the id itself rather than
// the live Arabic source string - navigation.ts's own callers already
// have the Arabic string directly available (e.g. `poi.name`) when that
// matters. src/i18n.test.ts cross-checks every real id has a table entry.
export function poiName(id: string, lang: Lang): string {
 const entry = POI_NAMES[id]
 if (!entry) return id
 if (!entry[lang]) fallbackWarn('poi', id, lang)
 return entry[lang] ?? entry.ar
}

export function stageName(i: number, lang: Lang): string {
 const entry = STAGE_NAMES[i]
 if (!entry) return ''
 if (!entry[lang]) fallbackWarn('stage name', i, lang)
 return entry[lang] ?? entry.ar
}

export function stageHint(i: number, lang: Lang): string {
 const entry = STAGE_HINTS[i]
 if (!entry) return ''
 if (!entry[lang]) fallbackWarn('stage hint', i, lang)
 return entry[lang] ?? entry.ar
}

export function floorName(id: number, lang: Lang): string {
 if (id>=3) return levelLabel(id,lang)
 const entry = FLOOR_NAMES[id]
 if (!entry) return ''
 if (!entry[lang]) fallbackWarn('floor', id, lang)
 return entry[lang] ?? entry.ar
}

export function categoryName(id: Category, lang: Lang): string {
 const entry = CATEGORY_NAMES[id]
 if (!entry) return ''
 if (!entry[lang]) fallbackWarn('category', id, lang)
 return entry[lang] ?? entry.ar
}

export function nodeName(arabicName: string, lang: Lang): string {
 const entry = NODE_NAMES[arabicName] ?? Object.values(regionalPOINames).find(n=>n.ar===arabicName) ?? Object.values(regionNames).find(n=>n.ar===arabicName)
 if (!entry) return arabicName
 return entry[lang] ?? entry.ar
}

export {POI_NAMES, STAGE_NAMES, STAGE_HINTS, FLOOR_NAMES, CATEGORY_NAMES, NODE_NAMES}
