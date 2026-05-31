import { Screen } from '../App'

const icons = {
  home: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  training: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
      <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 8.5l2-2 2 2M2 15.5l2 2 2-2M20 8.5l-2-2-2 2M20 15.5l-2 2-2-2"/>
    </svg>
  ),
  diary: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  coach: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
      <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
}

const labels = { home: 'Início', training: 'Treino', diary: 'Diário', coach: 'Coach IA' }

export default function Nav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  return (
    <nav className="nav">
      {(['home', 'training', 'diary', 'coach'] as Screen[]).map(s => (
        <button key={s} className={`nav-btn${screen === s ? ' active' : ''}`} onClick={() => setScreen(s)}>
          {icons[s](screen === s)}
          <span>{labels[s]}</span>
        </button>
      ))}
    </nav>
  )
}
