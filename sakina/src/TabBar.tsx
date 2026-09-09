// Bottom navigation shell. Four persistent destinations (Home/Explore/
// Rituals switch `screen`; Settings opens as an overlay, not a screen) plus
// a floating mic FAB that opens Ask Sakina as an overlay over whichever
// screen is active - tapping it never changes `screen`.
import {Settings2, Search, LayoutGrid, Home, Mic} from 'lucide-react'
import {useMap} from './store'
import {t} from './i18n/index'
import type {Screen} from './App'

export default function TabBar({screen, setScreen, onSettings, onAsk}: {screen: Screen; setScreen: (s: Screen) => void; onSettings: () => void; onAsk: () => void}) {
 const lang = useMap().lang
 return (
  <nav className="tab-bar" aria-label={t('tabbar.home', lang)}>
   <button aria-label={t('tabbar.settings', lang)} onClick={onSettings}>
    <Settings2 size={20} />
    <small>{t('tabbar.settings', lang)}</small>
   </button>
   <button className={screen === 'explore' ? 'active' : ''} aria-label={t('tabbar.explore', lang)} aria-pressed={screen === 'explore'} onClick={() => setScreen('explore')}>
    <Search size={20} />
    <small>{t('tabbar.explore', lang)}</small>
   </button>
   <button className={screen === 'rituals' ? 'active' : ''} aria-label={t('tabbar.rituals', lang)} aria-pressed={screen === 'rituals'} onClick={() => setScreen('rituals')}>
    <LayoutGrid size={20} />
    <small>{t('tabbar.rituals', lang)}</small>
   </button>
   <button className={screen === 'home' ? 'active' : ''} aria-label={t('tabbar.home', lang)} aria-pressed={screen === 'home'} onClick={() => setScreen('home')}>
    <Home size={20} />
    <small>{t('tabbar.home', lang)}</small>
   </button>
   <button className="ask-fab" aria-label={t('tabbar.ask_fab_aria', lang)} onClick={onAsk}>
    <Mic size={20} />
   </button>
  </nav>
 )
}
