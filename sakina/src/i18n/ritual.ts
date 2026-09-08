// Ritual guide content. Sacred Arabic text (the `dhikr` field) is stored
// ONCE per ritual and shown in Arabic script regardless of UI language -
// it is never machine-translated or replaced. `dhikrMeaning` is a
// separate, translated gloss shown alongside it. Explanatory prose
// (title/explanation/story/dhikrNote/source) is ordinary text and is
// localized normally. `source` keeps the underlying hadith/book
// reference (name + number) accurate across languages - only the
// wrapper words are translated.
//
// AI-authored translations - see I18N_REVIEW.md: ritual content
// specifically needs native/religiously literate review before any
// production use.
import type {Lang} from './types'

type LangMap = Record<Lang, string>

export interface RitualEntry {
 dhikr: string
 dhikrMeaning: LangMap
 title: LangMap
 explanation: LangMap
 story: LangMap
 dhikrNote: LangMap
 source: LangMap
 url: string
 storyUrl?: string
}

export const ritual: Record<'tawaf' | 'prayer' | 'sai', RitualEntry> = {
 tawaf: {
  dhikr: 'الله أكبر',
  dhikrMeaning: {ar: 'الله أكبر', en: 'Allah is the Greatest', ur: 'اللہ سب سے بڑا ہے', id: 'Allah Mahabesar', tr: 'Allah en büyüktür', fr: 'Allah est le plus Grand', fa: 'الله بزرگ‌تر است'},
  title: {ar: 'الطواف حول البيت', en: 'Tawaf Around the House', ur: 'بیت اللہ کے گرد طواف', id: 'Tawaf Mengelilingi Baitullah', tr: 'Beytullah Etrafında Tavaf', fr: 'Le Tawaf autour de la Maison', fa: 'طواف دور خانه خدا'},
  explanation: {
   ar: 'سبعة أشواط تبدأ من محاذاة الحجر الأسود، وتكون الكعبة عن يسارك. أكّد نهاية كل شوط في العداد.',
   en: 'Seven laps starting level with the Black Stone, keeping the Kaaba on your left. Confirm the end of each lap in the counter.',
   ur: 'حجرِ اسود کے مقابل سے شروع ہونے والے سات چکر، جبکہ کعبہ آپ کی بائیں طرف رہتا ہے۔ ہر چکر کے اختتام کی تصدیق شمار میں کریں۔',
   id: 'Tujuh putaran dimulai sejajar Hajar Aswad, dengan Kakbah di sebelah kiri Anda. Konfirmasi akhir setiap putaran di penghitung.',
   tr: "Hacerü'l-Esved hizasından başlayan yedi tur; Kâbe solunuzda olur. Her turun bitişini sayaçta onaylayın.",
   fr: 'Sept tours en commençant au niveau de la Pierre Noire, la Kaaba à votre gauche. Confirmez la fin de chaque tour dans le compteur.',
   fa: 'هفت دور که از مقابل حجرالأسود آغاز می‌شود، در حالی که کعبه سمت چپ شماست. پایان هر دور را در شمارشگر تأیید کنید.',
  },
  story: {
   ar: 'الطواف عبادة حول البيت الحرام، في رحلة يغلب عليها الذكر والدعاء والخشوع.',
   en: 'Tawaf is an act of worship circling the Sacred House, in a journey filled mostly with remembrance, supplication, and humility.',
   ur: 'طواف بیت اللہ کے گرد ایک عبادت ہے، ایسا سفر جس میں ذکر، دعا اور خشوع غالب رہتا ہے۔',
   id: 'Tawaf adalah ibadah mengelilingi Baitullah, sebuah perjalanan yang dipenuhi dzikir, doa, dan kekhusyukan.',
   tr: 'Tavaf, Kutsal Ev\'in etrafında dönmekten oluşan bir ibadettir; bu yolculuğa ağırlıklı olarak zikir, dua ve huşû eşlik eder.',
   fr: "Le Tawaf est un acte d'adoration consistant à circuler autour de la Maison sacrée, un parcours empreint d'invocation, de supplication et d'humilité.",
   fa: 'طواف عبادتی است که با چرخیدن دور خانه خدا انجام می‌شود، سفری که بیشتر آن را ذکر، دعا و خشوع فرا گرفته است.',
  },
  dhikrNote: {
   ar: 'عند محاذاة الحجر الأسود؛ وادعُ الله أثناء الطواف.',
   en: 'At the level of the Black Stone; and supplicate to Allah throughout the Tawaf.',
   ur: 'حجرِ اسود کے مقابل؛ اور طواف کے دوران اللہ سے دعا کریں۔',
   id: 'Saat sejajar Hajar Aswad; dan berdoalah kepada Allah sepanjang Tawaf.',
   tr: "Hacerü'l-Esved hizasında; tavaf boyunca Allah'a dua edin.",
   fr: 'Au niveau de la Pierre Noire ; invoquez Allah tout au long du Tawaf.',
   fa: 'در مقابل حجرالأسود؛ و در طول طواف از خدا دعا کنید.',
  },
  source: {ar: 'نسك · رحلة العمرة', en: 'Nusuk · Umrah Journey', ur: 'نسک · عمرہ کا سفر', id: 'Nusuk · Perjalanan Umrah', tr: 'Nusuk · Umre Yolculuğu', fr: 'Nusuk · Parcours de la Omra', fa: 'نسک · سفر عمره'},
  url: 'https://umrah.nusuk.sa/Journey',
 },
 prayer: {
  dhikr: 'ذكر ودعاء وطمأنينة',
  dhikrMeaning: {ar: 'ذكر ودعاء وطمأنينة', en: 'Remembrance, supplication, and tranquility', ur: 'ذکر، دعا اور اطمینان', id: 'Zikir, doa, dan ketenangan', tr: 'Zikir, dua ve huzur', fr: 'Invocation, supplication et sérénité', fa: 'ذکر، دعا و آرامش'},
  title: {ar: 'ركعتا الطواف', en: "The Two Rak'ahs of Tawaf", ur: 'طواف کی دو رکعتیں', id: 'Dua Rakaat Salat Tawaf', tr: 'Tavaf Namazının İki Rekatı', fr: "Les deux rak'ahs du Tawaf", fa: 'دو رکعت نماز طواف'},
  explanation: {
   ar: 'بعد إكمال الطواف، صلّ ركعتين خلف مقام إبراهيم عند التيسّر. يشير النموذج إلى موضع خلف المقام، ولا يحدد مكانًا ميدانيًا ملزمًا.',
   en: "After completing Tawaf, pray two rak'ahs behind Maqam Ibrahim when convenient. The model points to a spot behind the Maqam and does not mark a mandatory physical location.",
   ur: 'طواف مکمل کرنے کے بعد، موقع ملنے پر مقامِ ابراہیم کے پیچھے دو رکعت نماز پڑھیں۔ یہ ماڈل مقام کے پیچھے ایک تخمینی جگہ ظاہر کرتا ہے اور کسی لازمی میدانی مقام کا تعین نہیں کرتا۔',
   id: 'Setelah menyelesaikan Tawaf, salatlah dua rakaat di belakang Maqam Ibrahim saat memungkinkan. Model ini menunjukkan posisi di belakang Maqam dan tidak menetapkan lokasi fisik yang mengikat.',
   tr: 'Tavafı tamamladıktan sonra, uygun olduğunda İbrahim Makamı arkasında iki rekat namaz kılın. Model, Makam arkasındaki bir noktayı gösterir ve zorunlu bir fiziksel konum belirtmez.',
   fr: "Après avoir terminé le Tawaf, priez deux rak'ahs derrière la Station d'Abraham dès que possible. Le modèle indique un emplacement approximatif derrière la Station, sans marquer un lieu physique contraignant.",
   fa: 'پس از پایان طواف، هنگام امکان، دو رکعت نماز پشت مقام ابراهیم بخوانید. این مدل موقعیتی تقریبی پشت مقام را نشان می‌دهد و مکان فیزیکی الزام‌آوری تعیین نمی‌کند.',
  },
  story: {
   ar: 'ورد في حديث جابر وصف صلاة النبي ﷺ بعد الطواف، وجعل المقام بينه وبين البيت.',
   en: "Jabir's hadith describes the Prophet's ﷺ prayer after Tawaf, placing the Maqam between himself and the House.",
   ur: 'حدیثِ جابر میں نبی ﷺ کی طواف کے بعد کی نماز بیان ہوئی ہے، جس میں مقام آپ ﷺ اور بیت اللہ کے درمیان تھا۔',
   id: 'Hadis Jabir menggambarkan salat Nabi ﷺ setelah Tawaf, dengan menjadikan Maqam berada di antara beliau dan Baitullah.',
   tr: 'Câbir hadisinde, Peygamber ﷺ\'in tavaftan sonraki namazı anlatılır; Makam kendisiyle Ev arasında kalacak şekilde durmuştur.',
   fr: "Le hadith de Jabir décrit la prière du Prophète ﷺ après le Tawaf, plaçant la Station entre lui et la Maison.",
   fa: 'در حدیث جابر، نماز پیامبر ﷺ پس از طواف توصیف شده که مقام را بین خود و خانه خدا قرار دادند.',
  },
  dhikrNote: {
   ar: 'التطبيق لا يخصص دعاءً ثابتًا لكل شوط أو مرحلة.',
   en: 'The app does not assign a fixed supplication for each lap or stage.',
   ur: 'ایپ ہر چکر یا مرحلے کے لیے کوئی مقررہ دعا مختص نہیں کرتی۔',
   id: 'Aplikasi tidak menetapkan doa tetap untuk setiap putaran atau tahap.',
   tr: 'Uygulama her tur veya aşama için sabit bir dua atamaz.',
   fr: "L'application n'attribue pas d'invocation fixe pour chaque tour ou étape.",
   fa: 'برنامه برای هر دور یا مرحله دعای ثابتی تعیین نمی‌کند.',
  },
  source: {ar: 'صحيح مسلم · حديث جابر ١٢١٨', en: 'Sahih Muslim · Hadith of Jabir 1218', ur: 'صحیح مسلم · حدیثِ جابر ١٢١٨', id: 'Sahih Muslim · Hadis Jabir 1218', tr: 'Sahih-i Müslim · Câbir Hadisi 1218', fr: 'Sahih Muslim · Hadith de Jabir 1218', fa: 'صحیح مسلم · حدیث جابر ۱۲۱۸'},
  url: 'https://sunnah.com/muslim/15/159',
 },
 sai: {
  dhikr: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.',
  dhikrMeaning: {
   ar: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.',
   en: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is capable of all things.',
   ur: 'اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں؛ اسی کی بادشاہت ہے اور اسی کی تعریف ہے، اور وہ ہر چیز پر قادر ہے۔',
   id: 'Tiada tuhan selain Allah, Yang Esa, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan milik-Nya segala puji, dan Dia Mahakuasa atas segala sesuatu.',
   tr: "Allah'tan başka ilah yoktur, tektir, ortağı yoktur. Mülk O'nundur, hamd O'na mahsustur ve O her şeye gücü yetendir.",
   fr: "Il n'y a de divinité qu'Allah, Seul, sans associé. À Lui la royauté, à Lui la louange, et Il est capable de toute chose.",
   fa: 'هیچ معبودی جز الله نیست، یکتاست و شریکی ندارد؛ فرمانروایی از آنِ اوست و ستایش از آنِ اوست و او بر هر چیزی تواناست.',
  },
  title: {ar: 'السعي بين الصفا والمروة', en: "Sa'i Between Safa and Marwah", ur: 'صفا اور مروہ کے درمیان سعی', id: "Sa'i Antara Safa dan Marwah", tr: "Safa ile Merve Arasında Sa'y", fr: "Le Sa'i entre Safa et Marwah", fa: 'سعی بین صفا و مروه'},
  explanation: {
   ar: 'ابدأ من الصفا إلى المروة؛ هذا شوط واحد. العودة شوط ثانٍ. أكمل سبعة أشواط، ويكون الختام عند المروة.',
   en: 'Start from Safa to Marwah - this is one lap. The return is a second lap. Complete seven laps, ending at Marwah.',
   ur: 'صفا سے مروہ تک جانا ایک چکر ہے۔ واپسی دوسرا چکر ہے۔ سات چکر مکمل کریں، اختتام مروہ پر ہوگا۔',
   id: 'Mulai dari Safa ke Marwah; ini satu putaran. Kembali adalah putaran kedua. Selesaikan tujuh putaran, berakhir di Marwah.',
   tr: "Safa'dan Merve'ye gidiş bir turdur. Dönüş ikinci turdur. Yedi turu tamamlayın, bitiş Merve'de olur.",
   fr: "Commencez de Safa vers Marwah : c'est un tour. Le retour est un deuxième tour. Complétez sept tours, en terminant à Marwah.",
   fa: 'شروع از صفا به سمت مروه یک دور است. بازگشت دور دوم است. هفت دور را کامل کنید که پایان آن در مروه است.',
  },
  story: {
   ar: 'يروي حديث ابن عباس سعي أم إسماعيل بين الصفا والمروة سبع مرات بحثًا عمّن يعينها في طلب الماء؛ وتُذكر قصتها مع هذه الشعيرة.',
   en: "Ibn Abbas's hadith narrates Hajar's (Umm Isma'il's) running between Safa and Marwah seven times searching for someone to help her find water; her story is remembered with this ritual.",
   ur: 'حدیثِ ابن عباس میں ہاجرہ (ام اسماعیل) کا صفا اور مروہ کے درمیان سات بار دوڑنا بیان ہوا ہے، پانی کی تلاش میں مدد کے متلاشی؛ ان کی کہانی اس عبادت کے ساتھ یاد کی جاتی ہے۔',
   id: 'Hadis Ibnu Abbas menceritakan Hajar (Ummu Ismail) berlari-lari antara Safa dan Marwah tujuh kali mencari seseorang yang membantunya menemukan air; kisahnya dikenang bersama ibadah ini.',
   tr: "İbn Abbas hadisi, Hacer'in (İsmail'in annesi) su bulmak için yardım arayarak Safa ile Merve arasında yedi kez koştuğunu anlatır; onun hikâyesi bu ibadetle birlikte anılır.",
   fr: "Le hadith d'Ibn Abbas relate la course de Hajar (Umm Isma'il) entre Safa et Marwah, sept fois, à la recherche de quelqu'un pour l'aider à trouver de l'eau ; son histoire est associée à ce rite.",
   fa: 'حدیث ابن عباس، دویدن هاجر (ام اسماعیل) بین صفا و مروه را هفت بار، در جستجوی کمک برای یافتن آب، روایت می‌کند؛ داستان او همراه با این مناسک یاد می‌شود.',
  },
  dhikrNote: {
   ar: 'من الذكر الوارد على الصفا والمروة، مع الدعاء. هذا مقتطف؛ اقرأ الحديث للمزيد.',
   en: 'From the remembrance narrated at Safa and Marwah, along with supplication. This is an excerpt; read the hadith for more.',
   ur: 'صفا اور مروہ پر مروی ذکر سے، دعا کے ساتھ۔ یہ ایک اقتباس ہے؛ مزید کے لیے حدیث پڑھیں۔',
   id: 'Dari dzikir yang diriwayatkan di Safa dan Marwah, beserta doa. Ini kutipan; bacalah hadisnya untuk lebih lengkap.',
   tr: "Safa ve Merve'de rivayet edilen zikirden, dua ile birlikte. Bu bir alıntıdır; daha fazlası için hadise bakın.",
   fr: "Extrait de l'invocation rapportée à Safa et Marwah, avec la supplication. Ceci est un extrait ; lisez le hadith pour en savoir plus.",
   fa: 'از ذکر روایت‌شده در صفا و مروه، همراه با دعا. این گزیده‌ای است؛ برای اطلاعات بیشتر حدیث را بخوانید.',
  },
  source: {ar: 'صحيح مسلم ١٢١٨ · صحيح البخاري ٣٣٦٤', en: 'Sahih Muslim 1218 · Sahih al-Bukhari 3364', ur: 'صحیح مسلم ١٢١٨ · صحیح بخاری ٣٣٦٤', id: 'Sahih Muslim 1218 · Sahih al-Bukhari 3364', tr: 'Sahih-i Müslim 1218 · Sahih-i Buhari 3364', fr: 'Sahih Muslim 1218 · Sahih al-Boukhari 3364', fa: 'صحیح مسلم ۱۲۱۸ · صحیح بخاری ۳۳۶۴'},
  url: 'https://sunnah.com/muslim/15/159',
  storyUrl: 'https://sunnah.com/bukhari/60/38',
 },
}

export function ritualField<F extends keyof Omit<RitualEntry, 'dhikr' | 'url' | 'storyUrl'>>(
 entry: RitualEntry,
 field: F,
 lang: Lang,
): string {
 return entry[field][lang] ?? entry[field].ar
}
