import { useState, useEffect } from 'react'
import { AppUser, Profile } from '../App'

const OBJ_LABEL: Record<string, string> = { lose: 'Emagrecer', gain: 'Ganhar músculo', maintain: 'Manter forma' }
const LEVEL_LABEL: Record<string, string> = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' }

export default function Home({ user, profile, authHeader, onLogout, refreshProfile }: {
  user: AppUser; profile: Profile; authHeader: Record<string, string>; onLogout: () => void; refreshProfile: () => void
}) {
  const [waterCups, setWaterCups] = useState(0)
  const [todayKcal, setTodayKcal] = useState(0)
  const [weightHistory, setWeightHistory] = useState<{ weight: number; timestamp: string }[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)
  const [todayPlan, setTodayPlan] = useState<{ muscle_group: string; exercises: any[] } | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [editWeight, setEditWeight] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const dayNames = ['domingo','segunda','terça','quarta','quinta','sexta','sábado']
  const todayKey = dayNames[new Date().getDay()]

  useEffect(() => {
    loadWater()
    loadMeals()
    loadWeight()
    loadPlan()
  }, [])

  const loadWater = async () => {
    const r = await fetch('/api/water/daily', { headers: authHeader })
    if (r.ok) { const d = await r.json(); setWaterCups(d.glasses || 0) }
  }
  const loadMeals = async () => {
    const r = await fetch('/api/nutrition/daily', { headers: authHeader })
    if (r.ok) { const d = await r.json(); setTodayKcal(d.reduce((s: number, m: any) => s + (m.calories || 0), 0)) }
  }
  const loadWeight = async () => {
    const r = await fetch('/api/weight/history', { headers: authHeader })
    if (r.ok) { const d = await r.json(); setWeightHistory(d.slice(-5).reverse()) }
  }
  const loadPlan = async () => {
    const r = await fetch('/api/plans', { headers: authHeader })
    if (r.ok) {
      const d = await r.json()
      if (d.training_schedule) {
        try {
          const sched = typeof d.training_schedule === 'string' ? JSON.parse(d.training_schedule) : d.training_schedule
          setTodayPlan(sched[todayKey] || null)
        } catch {}
      }
    }
  }

  const addWater = async () => {
    const next = Math.min(waterCups + 1, 8)
    setWaterCups(next)
    await fetch('/api/water', { method: 'POST', headers: authHeader, body: JSON.stringify({ glasses: next }) })
  }
  const removeWater = async () => {
    const next = Math.max(waterCups - 1, 0)
    setWaterCups(next)
    await fetch('/api/water', { method: 'POST', headers: authHeader, body: JSON.stringify({ glasses: next }) })
  }

  const logWeight = async () => {
    if (!newWeight) return
    setSavingWeight(true)
    await fetch('/api/weight', { method: 'POST', headers: authHeader, body: JSON.stringify({ weight: parseFloat(newWeight) }) })
    setNewWeight('')
    await loadWeight()
    await refreshProfile()
    setSavingWeight(false)
  }

  const saveProfileUpdate = async () => {
    setSavingProfile(true)
    const body: any = {}
    if (editWeight) body.weight = parseFloat(editWeight)
    if (editHeight) body.height = parseInt(editHeight)
    await fetch('/api/profile', { method: 'POST', headers: authHeader, body: JSON.stringify({ ...profile, ...body }) })
    await refreshProfile()
    setShowProfile(false)
    setSavingProfile(false)
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const isRestDay = todayPlan?.muscle_group === 'Descanso' || (todayPlan?.exercises?.length === 0 && todayPlan?.muscle_group)
  const hasNoPlan = !todayPlan

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div className="home-hero">
        <div className="flex items-center justify-between">
          <div>
            <div className="home-greeting">{greeting()},</div>
            <div className="home-name">{user.name.split(' ')[0]} 👋</div>
          </div>
          <button onClick={() => setShowProfile(true)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            ⚙️ Perfil
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <span className="badge badge-orange">{OBJ_LABEL[profile.objective] || profile.objective}</span>
          <span className="badge badge-blue">{LEVEL_LABEL[profile.level] || profile.level}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="section">
        <div className="home-stats">
          <div className="stat-card">
            <div className="stat-icon">⚖️</div>
            <div className="stat-value">{weightHistory[0]?.weight || profile.weight}<span style={{ fontSize: 14 }}>kg</span></div>
            <div className="stat-label">Peso atual</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{Math.round(todayKcal)}<span style={{ fontSize: 14 }}>kcal</span></div>
            <div className="stat-label">Hoje</div>
          </div>
        </div>

        {/* Water */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>💧 Água</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{waterCups} de 8 copos hoje</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={removeWater} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>−</button>
              <button onClick={addWater} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>+</button>
            </div>
          </div>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${(waterCups / 8) * 100}%`, background: '#3b82f6' }} />
          </div>
        </div>

        {/* Today's training */}
        {hasNoPlan ? (
          <div className="gen-banner">
            <h3>Sem plano ainda 🤖</h3>
            <p>Vá na aba <strong>Coach IA</strong> e gere seu plano de treino e dieta personalizado. Leva menos de 1 minuto!</p>
          </div>
        ) : isRestDay ? (
          <div className="card">
            <div className="rest-day" style={{ padding: '20px 0' }}>
              <div className="icon">😴</div>
              <h3>Dia de descanso!</h3>
              <p>Recuperação é parte do treino. Descanse bem hoje.</p>
            </div>
          </div>
        ) : (
          <div className="today-workout">
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Treino de hoje</div>
            <h3 style={{ marginTop: 4 }}>{todayPlan?.muscle_group}</h3>
            <p>{todayPlan?.exercises?.length || 0} exercícios</p>
          </div>
        )}

        {/* Weight log */}
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>⚖️ Registrar peso</div>
          <div className="weight-input-row">
            <input className="input" type="number" placeholder="Ex: 74.5 kg" value={newWeight} onChange={e => setNewWeight(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={logWeight} disabled={savingWeight || !newWeight} style={{ width: 'auto', padding: '14px 18px' }}>
              {savingWeight ? '...' : 'Salvar'}
            </button>
          </div>
          {weightHistory.length > 0 && (
            <div className="weight-history" style={{ marginTop: 12 }}>
              {weightHistory.slice(0, 3).map((w, i) => (
                <div key={i} className="weight-entry">
                  <span className="weight-val">{w.weight} kg</span>
                  <span className="weight-date">{new Date(w.timestamp).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ background: 'var(--bg2)', borderRadius: '24px 24px 0 0', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex items-center justify-between">
              <div style={{ fontWeight: 800, fontSize: 18 }}>Meu Perfil</div>
              <button onClick={() => setShowProfile(false)} style={{ background: 'var(--bg3)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'var(--text)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Peso atual (kg)</label>
                <input className="input" type="number" placeholder={String(profile.weight)} value={editWeight} onChange={e => setEditWeight(e.target.value)} />
              </div>
              <div>
                <label className="label">Altura (cm)</label>
                <input className="input" type="number" placeholder={String(profile.height)} value={editHeight} onChange={e => setEditHeight(e.target.value)} />
              </div>
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 12, fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Objetivo:</strong> {OBJ_LABEL[profile.objective]}<br />
              <strong style={{ color: 'var(--text)' }}>Nível:</strong> {LEVEL_LABEL[profile.level]}<br />
              <strong style={{ color: 'var(--text)' }}>Dias de treino:</strong> {profile.days_per_week}x por semana
            </div>
            <button className="btn btn-primary" onClick={saveProfileUpdate} disabled={savingProfile}>
              {savingProfile ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button className="btn btn-secondary" onClick={onLogout} style={{ color: 'var(--accent)' }}>Sair da conta</button>
          </div>
        </div>
      )}
    </div>
  )
}
