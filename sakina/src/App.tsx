import {useEffect, useState} from 'react'
import {CheckCircle2, X} from 'lucide-react'
import {useMap} from './store'
import {dirFor, t} from './i18n/index'
import TabBar from './TabBar'
import Home from './Home'
import Explore from './Explore'
import AskSakina from './AskSakina'
import Settings from './Settings'

export type Screen = 'home' | 'explore'

export default function App() {
 const s = useMap()
 const lang = s.lang
 const [screen, setScreen] = useState<Screen>('home')
 const [askOpen, setAskOpen] = useState(false)
 const [settingsOpen, setSettingsOpen] = useState(false)
 const [picking, setPicking] = useState(false)
 useEffect(() => {
  let last = performance.now()
  const id = setInterval(() => {
   const now = performance.now()
   useMap.getState().tick((now - last) / 1000)
   last = now
  }, 100)
  const pause = () => {if (useMap.getState().running) useMap.getState().pause()}
  window.addEventListener('pagehide', pause)
  return () => {clearInterval(id); window.removeEventListener('pagehide', pause)}
 }, [])
 useEffect(() => {
  if (!s.toast) return
  const id = setTimeout(() => s.setToast(''), 6500)
  return () => clearTimeout(id)
 }, [s.toast])
 useEffect(() => {
  document.documentElement.dir = dirFor(lang)
  document.documentElement.lang = lang
 }, [lang])
 return (
  <div className="app" dir={dirFor(lang)}>
   <main className="workspace">
    {screen === 'home' && <Home picking={picking} setPicking={setPicking} onAsk={() => setAskOpen(true)} />}
    {screen === 'explore' && <Explore onPick={id => {s.select(id); setScreen('home')}} />}
   </main>
   <TabBar screen={screen} setScreen={setScreen} onSettings={() => setSettingsOpen(true)} />
   <AskSakina open={askOpen} onClose={() => setAskOpen(false)} />
   <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} onTapToSet={() => {setSettingsOpen(false); setPicking(true); setScreen('home'); s.setToast(t('toast.tap_map_hint', lang))}} />
   {s.toast && <div className="toast" role="status"><CheckCircle2 size={18} />{s.toast}<button onClick={() => s.setToast('')} aria-label={t('toast.hide_aria', lang)}><X size={14} /></button></div>}
  </div>
 )
}
