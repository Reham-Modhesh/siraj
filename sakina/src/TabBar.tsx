// Bottom navigation shell. Two persistent destinations (Home/Explore switch
// `screen`; Settings opens as an overlay, not a screen). The mic moved into
// Home's search bar (one input for both search and Ask Sakina) instead of
// a separate floating FAB here, so the bar is three plain, evenly-spaced
// buttons now. The Rituals screen was folded into Home's current-stage
// card (per user request) rather than kept separate.
import {Settings2, Search, Home} from 'lucide-react'
import {useMap} from './store'
import {t} from './i18n/index'
import type {Screen} from './App'

export default function TabBar({screen, setScreen, onSettings}: {screen: Screen; setScreen: (s: Screen) => void; onSettings: () => void}) {
 const lang = useMap().lang
 return (
  <nav className="tab-bar" aria-label={t('tabbar.home', lang)}>
   <button className={screen === 'home' ? 'active' : ''} aria-label={t('tabbar.home', lang)} aria-pressed={screen === 'home'} onClick={() => setScreen('home')}>
    <Home size={20} />
    <small>{t('tabbar.home', lang)}</small>
   </button>
   <button className={screen === 'explore' ? 'active' : ''} aria-label={t('tabbar.explore', lang)} aria-pressed={screen === 'explore'} onClick={() => setScreen('explore')}>
    <Search size={20} />
    <small>{t('tabbar.explore', lang)}</small>
   </button>
   <button aria-label={t('tabbar.settings', lang)} onClick={onSettings}>
    <Settings2 size={20} />
    <small>{t('tabbar.settings', lang)}</small>
   </button>
  </nav>
 )
}
