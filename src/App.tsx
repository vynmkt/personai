import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import Onboarding from './components/Onboarding'
import Home from './components/Home'
import TrainingNew from './components/TrainingNew'
import Diary from './components/Diary'
import Coach from './components/Coach'
import Nav from './components/Nav'

export type Screen = 'home' | 'training' | 'diary' | 'coach'

export interface AppUser {
  id: number
  name: string
  email: string
  role: string
}

export interface Profile {
  age: number
  gender: string
  weight: number
  height: number
  objective: string
  level: string
  days_per_week: number
  limitation: string
  completed?: boolean
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [screen, setScreen] = useState<Screen>('home')
  const [loading, setLoading] = useState(true)

  const getToken = () => localStorage.getItem('token') || ''
  const authHeader = () => ({ 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' })

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (!stored) { setLoading(false); return }
    fetch('/api/profile', { headers: { 'Authorization': `Bearer ${stored}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.name) {
          setUser({ id: data.user_id, name: data.name, email: data.email || '', role: data.role || 'user' })
          if (data.age && data.weight && data.objective) {
            setProfile({ ...data, completed: true })
          }
        } else {
          localStorage.removeItem('token')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleLogin = (u: AppUser, t: string) => {
    localStorage.setItem('token', t)
    setUser(u)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setProfile(null)
    setScreen('home')
  }

  const handleProfileSaved = (p: Profile) => {
    setProfile({ ...p, completed: true })
  }

  const refreshProfile = async () => {
    const r = await fetch('/api/profile', { headers: authHeader() })
    if (r.ok) {
      const data = await r.json()
      setProfile({ ...data, completed: true })
    }
  }

  if (loading) return (
    <div className="splash">
      <div className="splash-logo">💪</div>
      <div className="splash-name">PERSONAI</div>
    </div>
  )

  if (!user) return <Auth onLogin={handleLogin} />
  if (!profile?.completed) return <Onboarding user={user} onSaved={handleProfileSaved} authHeader={authHeader()} />

  return (
    <div className="app-shell">
      <div className="screen-content">
        {screen === 'home' && <Home user={user} profile={profile} authHeader={authHeader()} onLogout={handleLogout} refreshProfile={refreshProfile} />}
        {screen === 'training' && <TrainingNew user={user} profile={profile} authHeader={authHeader()} />}
        {screen === 'diary' && <Diary user={user} profile={profile} authHeader={authHeader()} />}
        {screen === 'coach' && <Coach user={user} profile={profile} authHeader={authHeader()} />}
      </div>
      <Nav screen={screen} setScreen={setScreen} />
    </div>
  )
}
