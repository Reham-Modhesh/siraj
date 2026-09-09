// Voice/text entry point to Siraj (../siraj/voice_prototype/server.py),
// separate from Sakina's own text search (Home.tsx/navigation.ts -
// resolveDestination) which is untouched. Resolves Siraj's answer to a
// map action via resolveSirajNavigation (src/siraj.ts) and drives the
// map through the existing external control surface, window.sakinaMap
// (src/bridge.ts) - the same bridge any outside "brain" would use.
//
// Renamed from VoiceAssistant.tsx: this is now overlay content controlled
// by App.tsx's mic FAB (open/onClose props) instead of a corner toggle
// with its own local `open` state - the ask/listen/speak logic itself is
// unchanged. Language is still NOT owned locally - it reads/writes the
// shared s.lang (src/store.ts), the same field LanguageSwitcher.tsx writes.
import {useRef, useState} from 'react'
import {Loader2, Mic, Send, Volume2, X} from 'lucide-react'
import {askSiraj, resolveSirajNavigation, SIRAJ_SPEAK_ENDPOINT, truncateForSpeech} from './siraj'
import {useMap} from './store'
import {t, poiName, categoryName} from './i18n/index'

// Web Speech API locales - deliberately separate from Siraj's own
// ISO 639-1 language codes (i18n/translate.py::SUPPORTED_LANGUAGES on the
// Siraj side, i18n/types.ts::Lang on this side) and from i18n's own
// localeFor() (used for Intl number formatting) - three distinct
// concerns that are never conflated.
const SPEECH_LOCALE: Record<string, string> = {ar: 'ar-SA', en: 'en-US', ur: 'ur-PK', id: 'id-ID', tr: 'tr-TR', fr: 'fr-FR', fa: 'fa-IR'}

export default function AskSakina({open, onClose}: {open: boolean; onClose: () => void}) {
 const s = useMap()
 const lang = s.lang
 const [listening, setListening] = useState(false)
 const [busy, setBusy] = useState(false)
 const [transcript, setTranscript] = useState('')
 const [questionAr, setQuestionAr] = useState('')
 const [answer, setAnswer] = useState('')
 const [navSummary, setNavSummary] = useState('')
 const [detailsOpen, setDetailsOpen] = useState(false)
 const [note, setNote] = useState('')
 const [textValue, setTextValue] = useState('')
 const recognitionRef = useRef<any>(null)

 const ask = async (question: string) => {
  if (!question.trim()) return
  setTranscript(question)
  setQuestionAr('')
  setBusy(true)
  setAnswer('')
  setNavSummary('')
  setDetailsOpen(false)
  setNote('')
  try {
   const result = await askSiraj(question, lang)
   if (lang !== 'ar') setQuestionAr(result.question_ar)
   setAnswer(result.answer)
   // Map navigation is a best-effort side effect on top of an already-
   // correct answer - isolated in its own try/catch so a map failure
   // (e.g. an unexpected bridge/store error) can never wipe out or hide
   // the answer that's already displayed above. When it resolves to an
   // actual map action, that short confirmation becomes the primary
   // thing shown/spoken instead of Siraj's full raw text - the full
   // answer (sources, hours, reliability notes) is still one tap away
   // under "تفاصيل أكثر", never discarded.
   try {
    const nav = resolveSirajNavigation(result)
    if (nav.type === 'navigate') {
     window.sakinaMap.navigateTo(nav.poiId)
     setNavSummary(t('voice.nav_confirm_poi', lang, {name: poiName(nav.poiId, lang)}))
    } else if (nav.type === 'nearest') {
     window.sakinaMap.findNearest(nav.category)
     setNavSummary(t('voice.nav_confirm_category', lang, {category: categoryName(nav.category, lang)}))
    } else if (nav.type === 'unmapped') {
     setNote(t('voice.unmapped_note', lang))
    }
   } catch {
    setNote(t('voice.unmapped_note', lang))
   }
  } catch {
   setAnswer(t('voice.error_unreachable', lang))
  } finally {
   setBusy(false)
  }
 }

 const [speaking, setSpeaking] = useState(false)
 const audioRef = useRef<HTMLAudioElement | null>(null)

 const speak = async () => {
  // Real speech output via Gemini (i18n/tts.py, served through
  // voice_prototype/server.py's /speak route) - deliberately NOT the
  // browser's speechSynthesis/OS voices, which are inconsistent across
  // machines and outright missing for some languages (e.g. Urdu, Persian
  // have zero installed macOS voices). The translated answer text above
  // always renders regardless of whether this succeeds.
  if (!answer || speaking) return
  setNote('')
  setSpeaking(true)
  try {
   // Prefer the short nav confirmation when one exists - it's what a
   // real assistant would say out loud, and it comfortably fits Gemini's
   // TTS length limit on its own, unlike Siraj's full raw answer.
   const speechText = navSummary || truncateForSpeech(answer)
   const res = await fetch(SIRAJ_SPEAK_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({text: speechText, lang}),
   })
   if (!res.ok) {
    setNote(t('voice.tts_unavailable', lang))
    return
   }
   const blob = await res.blob()
   const url = URL.createObjectURL(blob)
   audioRef.current?.pause()
   const audio = new Audio(url)
   audioRef.current = audio
   audio.onended = () => URL.revokeObjectURL(url)
   await audio.play()
   if (!navSummary && speechText.length < answer.length) setNote(t('voice.tts_partial', lang))
  } catch {
   setNote(t('voice.tts_unavailable', lang))
  } finally {
   setSpeaking(false)
  }
 }

 const toggleListen = () => {
  const Impl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!Impl) {
   setNote(t('voice.unsupported', lang))
   return
  }
  if (listening) {
   recognitionRef.current?.stop()
   return
  }
  const recognition = new Impl()
  recognitionRef.current = recognition
  recognition.lang = SPEECH_LOCALE[lang] || 'ar-SA'
  recognition.interimResults = true
  recognition.maxAlternatives = 1
  recognition.onstart = () => {
   setListening(true)
   setNote('')
  }
  recognition.onresult = (event: any) => {
   let final = ''
   for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) final += event.results[i][0].transcript
   if (final) ask(final.trim())
  }
  recognition.onerror = (event: any) => {
   setListening(false)
   setNote(event?.error === 'not-allowed' ? t('voice.mic_denied', lang) : t('voice.mic_error', lang))
  }
  recognition.onend = () => setListening(false)
  recognition.start()
 }

 if (!open) return null
 return (
  <div className="ask-overlay">
   <div className="ask-sheet">
    <div className="row between">
     <div><strong>{t('ask.title', lang)}</strong><small>{t('ask.subtitle', lang)}</small></div>
     <button className="icon-button" onClick={onClose} aria-label={t('ask.close_aria', lang)}>
      <X size={18} />
     </button>
    </div>
    <button className={`primary w-full ${listening ? 'siraj-listening' : ''}`} onClick={toggleListen}>
     <Mic size={16} />
     {listening ? t('voice.listening', lang) : t('voice.press_to_talk', lang)}
    </button>
    <div className="siraj-text-row">
     <input
      className="siraj-text-input"
      aria-label={t('voice.text_aria', lang)}
      placeholder={t('voice.text_placeholder', lang)}
      value={textValue}
      onChange={e => setTextValue(e.target.value)}
      onKeyDown={e => {
       if (e.key === 'Enter') {
        ask(textValue)
        setTextValue('')
       }
      }}
     />
     <button
      className="icon-button"
      aria-label={t('voice.send_aria', lang)}
      onClick={() => {
       ask(textValue)
       setTextValue('')
      }}
     >
      <Send size={16} />
     </button>
    </div>
    {busy && (
     <div className="siraj-status">
      <Loader2 size={14} className="siraj-spin" />
      {t('voice.asking', lang)}
     </div>
    )}
    {transcript && <div className="siraj-transcript">{transcript}</div>}
    {questionAr && (
     <small className="siraj-note">
      {t('voice.translated_to_arabic_prefix', lang)} {questionAr}
     </small>
    )}
    {answer && (
     <div className="siraj-answer">
      {navSummary ? (
       <>
        <p className="siraj-nav-summary">{navSummary}</p>
        <button className="text-button small" onClick={() => setDetailsOpen(!detailsOpen)}>
         {detailsOpen ? t('voice.hide_details', lang) : t('voice.more_details', lang)}
        </button>
        {detailsOpen && <p className="siraj-answer-detail">{answer}</p>}
       </>
      ) : (
       <p>{answer}</p>
      )}
      <button className="text-button small" onClick={speak} disabled={speaking}>
       {speaking ? <Loader2 size={14} className="siraj-spin" /> : <Volume2 size={14} />}
       {t('voice.listen_button', lang)}
      </button>
     </div>
    )}
    {note && <small className="siraj-note">{note}</small>}
   </div>
  </div>
 )
}
