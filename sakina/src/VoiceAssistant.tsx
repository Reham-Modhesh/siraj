// Voice/text entry point to Siraj (../siraj/voice_prototype/server.py),
// separate from Sakina's own text search (App.tsx/navigation.ts -
// resolveDestination) which is untouched. Resolves Siraj's answer to a
// map action via resolveSirajNavigation (src/siraj.ts) and drives the
// map through the existing external control surface, window.sakinaMap
// (src/bridge.ts) - the same bridge any outside "brain" would use.
//
// Language is NOT owned locally - it reads/writes the shared s.lang
// (src/store.ts), the same field LanguageSwitcher.tsx writes, so picking
// a language in either place updates the whole app together.
import {useRef,useState} from 'react'
import {Loader2,Mic,Send,Volume2,X} from 'lucide-react'
import {askSiraj,resolveSirajNavigation} from './siraj'
import {useMap} from './store'
import {LANGS, t} from './i18n/index'

// Web Speech API locales - deliberately separate from Siraj's own
// ISO 639-1 language codes (i18n/translate.py::SUPPORTED_LANGUAGES on the
// Siraj side, i18n/types.ts::Lang on this side) and from i18n's own
// localeFor() (used for Intl number formatting) - three distinct
// concerns that are never conflated.
const SPEECH_LOCALE: Record<string, string> = {ar: 'ar-SA', en: 'en-US', ur: 'ur-PK', id: 'id-ID', tr: 'tr-TR', fr: 'fr-FR', fa: 'fa-IR'}

export default function VoiceAssistant() {
 const s = useMap()
 const lang = s.lang
 const [open, setOpen] = useState(false)
 const [listening, setListening] = useState(false)
 const [busy, setBusy] = useState(false)
 const [transcript, setTranscript] = useState('')
 const [questionAr, setQuestionAr] = useState('')
 const [answer, setAnswer] = useState('')
 const [note, setNote] = useState('')
 const [textValue, setTextValue] = useState('')
 const recognitionRef = useRef<any>(null)

 const ask = async (question: string) => {
  if (!question.trim()) return
  setTranscript(question)
  setQuestionAr('')
  setBusy(true)
  setAnswer('')
  setNote('')
  try {
   const result = await askSiraj(question, lang)
   if (lang !== 'ar') setQuestionAr(result.question_ar)
   setAnswer(result.answer)
   // Map navigation is a best-effort side effect on top of an already-
   // correct answer - isolated in its own try/catch so a map failure
   // (e.g. an unexpected bridge/store error) can never wipe out or hide
   // the answer that's already displayed above.
   try {
    const nav = resolveSirajNavigation(result)
    if (nav.type === 'navigate') window.sakinaMap.navigateTo(nav.poiId)
    else if (nav.type === 'nearest') window.sakinaMap.findNearest(nav.category)
    else if (nav.type === 'unmapped') setNote(t('voice.unmapped_note', lang))
   } catch {
    setNote(t('voice.unmapped_note', lang))
   }
  } catch {
   setAnswer(t('voice.error_unreachable', lang))
  } finally {
   setBusy(false)
  }
 }

 const speak = () => {
  // Best-effort add-on only: the translated answer text above always
  // renders regardless of whether the browser/OS has a voice for this
  // locale - availability and quality vary by system and browser.
  if (!answer || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(answer)
  utter.lang = SPEECH_LOCALE[lang] || 'ar-SA'
  window.speechSynthesis.speak(utter)
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

 return (
  <>
   <button className="siraj-toggle" onClick={() => setOpen(!open)} aria-label={t('voice.toggle_aria', lang)} aria-pressed={open}>
    <Mic size={17} />
    <span>سراج</span>
   </button>
   {open && (
    <div className="siraj-panel">
     <div className="row between">
      <strong>{t('voice.panel_title', lang)}</strong>
      <button className="icon-button" onClick={() => setOpen(false)} aria-label={t('voice.close_aria', lang)}>
       <X size={16} />
      </button>
     </div>
     <select aria-label={t('voice.lang_aria', lang)} value={lang} onChange={e => s.setLang(e.target.value as typeof lang)}>
      {LANGS.map(l => (
       <option key={l.code} value={l.code}>
        {l.label}
       </option>
      ))}
     </select>
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
       <p>{answer}</p>
       <button className="text-button small" onClick={speak}>
        <Volume2 size={14} />
        {t('voice.listen_button', lang)}
       </button>
      </div>
     )}
     {note && <small className="siraj-note">{note}</small>}
    </div>
   )}
  </>
 )
}
