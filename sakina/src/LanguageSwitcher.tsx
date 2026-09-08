// Always-visible, compact language control - writes directly to the
// shared s.lang (src/store.ts). VoiceAssistant.tsx reads/writes the same
// field, so picking a language here or there updates the whole app.
import {Globe} from 'lucide-react'
import {useMap} from './store'
import {LANGS, t} from './i18n/index'

export default function LanguageSwitcher() {
 const s = useMap()
 return (
  <label className="lang-switcher" aria-label={t('lang_switcher.aria', s.lang)}>
   <Globe size={16} />
   <select value={s.lang} onChange={e => s.setLang(e.target.value as typeof s.lang)}>
    {LANGS.map(l => (
     <option key={l.code} value={l.code}>
      {l.label}
     </option>
    ))}
   </select>
  </label>
 )
}
