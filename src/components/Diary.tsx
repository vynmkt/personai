import { useState, useEffect } from 'react'
import { AppUser, Profile } from '../App'

export default function Diary({ user, profile, authHeader }: { user: AppUser; profile: Profile; authHeader: Record<string, string> }) {
  const [tab, setTab] = useState<'meals'|'water'|'weight'>('meals')
  const [meals, setMeals] = useState<any[]>([])
  const [mealInput, setMealInput] = useState('')
  const [addingMeal, setAddingMeal] = useState(false)
  const [water, setWater] = useState(0)
  const [weightHistory, setWeightHistory] = useState<any[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)

  useEffect(() => { loadAll() }, [])
  const loadAll = async () => { loadMeals(); loadWater(); loadWeight() }

  const loadMeals = async () => {
    const r = await fetch('/api/nutrition/daily', { headers: authHeader })
    if (r.ok) setMeals(await r.json())
  }
  const loadWater = async () => {
    const r = await fetch('/api/water/daily', { headers: authHeader })
    if (r.ok) { const d = await r.json(); setWater(d.glasses || 0) }
  }
  const loadWeight = async () => {
    const r = await fetch('/api/weight/history', { headers: authHeader })
    if (r.ok) { const d = await r.json(); setWeightHistory(d.slice(-7).reverse()) }
  }

  const addMeal = async () => {
    if (!mealInput.trim()) return
    setAddingMeal(true)
    try {
      const r = await fetch('/api/ai/meal-parse', {
        method: 'POST', headers: authHeader,
        body: JSON.stringify({ description: mealInput })
      })
      const data = await r.json()
      await fetch('/api/nutrition/meal', {
        method: 'POST', headers: authHeader,
        body: JSON.stringify(data)
      })
      setMealInput('')
      await loadMeals()
    } catch { /* silent */ } finally { setAddingMeal(false) }
  }

  const setWaterCups = async (n: number) => {
    const next = Math.max(0, Math.min(8, n))
    setWater(next)
    await fetch('/api/water', { method: 'POST', headers: authHeader, body: JSON.stringify({ glasses: next }) })
  }

  const logWeight = async () => {
    if (!newWeight) return
    setSavingWeight(true)
    await fetch('/api/weight', { method: 'POST', headers: authHeader, body: JSON.stringify({ weight: parseFloat(newWeight) }) })
    setNewWeight('')
    await loadWeight()
    setSavingWeight(false)
  }

  const totalKcal = meals.reduce((s, m) => s + (m.calories || 0), 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0)

  return (
    <div style={{ paddingBottom: 16 }}>
      <div className="page-header">
        <div>
          <div className="page-title">📋 Diário</div>
          <div className="page-sub">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
      </div>

      <div className="section">
        <div className="tabs">
          <button className={`tab${tab==='meals'?' active':''}`} onClick={() => setTab('meals')}>🍽️ Refeições</button>
          <button className={`tab${tab==='water'?' active':''}`} onClick={() => setTab('water')}>💧 Água</button>
          <button className={`tab${tab==='weight'?' active':''}`} onClick={() => setTab('weight')}>⚖️ Peso</button>
        </div>

        {/* MEALS */}
        {tab === 'meals' && (
          <>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="card-sm" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Syne' }}>{Math.round(totalKcal)}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700, marginTop: 4 }}>CALORIAS HOJE</div>
              </div>
              <div className="card-sm" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Syne' }}>{Math.round(totalProtein)}g</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700, marginTop: 4 }}>PROTEÍNA HOJE</div>
              </div>
            </div>

            {/* Add meal */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Adicionar refeição</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                Escreva o que você comeu. Ex: "2 ovos mexidos com 2 fatias de pão integral"
              </div>
              <input className="input" placeholder="O que você comeu?" value={mealInput} onChange={e => setMealInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMeal()} />
              <button className="btn btn-primary" onClick={addMeal} disabled={addingMeal || !mealInput.trim()}>
                {addingMeal ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> A IA está calculando...</> : '+ Adicionar'}
              </button>
            </div>

            {/* Meal list */}
            {meals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text2)', fontSize: 14 }}>
                Nenhuma refeição registrada hoje
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {meals.map((m, i) => (
                  <div key={i} className="meal-item">
                    <div>
                      <div className="meal-name">{m.name}</div>
                      <div className="meal-macros">P: {Math.round(m.protein)}g · C: {Math.round(m.carbs)}g · G: {Math.round(m.fat)}g</div>
                    </div>
                    <div className="meal-cal">{Math.round(m.calories)} kcal</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* WATER */}
        {tab === 'water' && (
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: 48, fontWeight: 800 }}>{water}</div>
              <div style={{ color: 'var(--text2)', fontSize: 15 }}>de 8 copos hoje</div>
            </div>
            <div className="progress-wrap" style={{ height: 12 }}>
              <div className="progress-fill" style={{ width: `${(water / 8) * 100}%`, background: '#3b82f6' }} />
            </div>
            <div className="water-cups" style={{ justifyContent: 'center' }}>
              {[...Array(8)].map((_, i) => (
                <button key={i} className={`water-cup${i < water ? ' filled' : ''}`} onClick={() => setWaterCups(i + 1)}>💧</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setWaterCups(water - 1)}>− Remover</button>
              <button className="btn btn-primary" onClick={() => setWaterCups(water + 1)}>+ Adicionar</button>
            </div>
            {water >= 8 && <div className="badge badge-green" style={{ alignSelf: 'center', fontSize: 14 }}>🎉 Meta atingida!</div>}
          </div>
        )}

        {/* WEIGHT */}
        {tab === 'weight' && (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Registrar peso de hoje</div>
              <div className="weight-input-row">
                <input className="input" type="number" placeholder="Ex: 74.5 kg" value={newWeight} onChange={e => setNewWeight(e.target.value)} onKeyDown={e => e.key === 'Enter' && logWeight()} style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={logWeight} disabled={savingWeight || !newWeight} style={{ width: 'auto', padding: '14px 18px' }}>
                  {savingWeight ? '...' : 'Salvar'}
                </button>
              </div>
            </div>

            {weightHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text2)', fontSize: 14 }}>
                Nenhum peso registrado ainda
              </div>
            ) : (
              <div className="weight-history">
                <div className="section-title">Histórico</div>
                {weightHistory.map((w, i) => {
                  const prev = weightHistory[i + 1]
                  const diff = prev ? (w.weight - prev.weight).toFixed(1) : null
                  return (
                    <div key={i} className="weight-entry">
                      <div>
                        <span className="weight-val">{w.weight} kg</span>
                        {diff && (
                          <span style={{ fontSize: 13, marginLeft: 8, color: parseFloat(diff) < 0 ? 'var(--green)' : parseFloat(diff) > 0 ? 'var(--accent)' : 'var(--text2)' }}>
                            {parseFloat(diff) > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                      </div>
                      <span className="weight-date">{new Date(w.timestamp).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
