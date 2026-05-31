import { useState, useEffect } from 'react'
import { AppUser, Profile } from '../App'

const DAY_LABELS: Record<string, string> = {
  segunda: 'Segunda', 'terça': 'Terça', quarta: 'Quarta',
  quinta: 'Quinta', sexta: 'Sexta', 'sábado': 'Sábado', domingo: 'Domingo'
}
const DAYS = ['segunda','terça','quarta','quinta','sexta','sábado','domingo']
const TODAY_IDX = [0,1,2,3,4,5,6][(new Date().getDay() + 6) % 7]

export default function TrainingNew({ user, profile, authHeader }: { user: AppUser; profile: Profile; authHeader: Record<string, string> }) {
  const [schedule, setSchedule] = useState<Record<string, any> | null>(null)
  const [selectedDay, setSelectedDay] = useState(DAYS[TODAY_IDX])
  const [loads, setLoads] = useState<Record<string, { weight: string; reps: string; sets: string }>>({})
  const [savedLoads, setSavedLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPlan(); loadLoads() }, [])

  const loadPlan = async () => {
    const r = await fetch('/api/plans', { headers: authHeader })
    if (r.ok) {
      const d = await r.json()
      if (d.training_schedule) {
        try {
          const s = typeof d.training_schedule === 'string' ? JSON.parse(d.training_schedule) : d.training_schedule
          setSchedule(s)
        } catch {}
      }
    }
    setLoading(false)
  }

  const loadLoads = async () => {
    const r = await fetch('/api/training/loads', { headers: authHeader })
    if (r.ok) setSavedLoads(await r.json())
  }

  const saveLoad = async (exerciseName: string) => {
    const l = loads[exerciseName]
    if (!l?.weight) return
    await fetch('/api/training/load', {
      method: 'POST', headers: authHeader,
      body: JSON.stringify({ exercise_name: exerciseName, weight: parseFloat(l.weight), reps: parseInt(l.reps || '0'), sets: parseInt(l.sets || '0') })
    })
    await loadLoads()
    setLoads(prev => ({ ...prev, [exerciseName]: { weight: '', reps: '', sets: '' } }))
  }

  const getLastLoad = (name: string) => savedLoads.find(l => l.exercise_name === name)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>

  if (!schedule) return (
    <div className="section">
      <div className="gen-banner">
        <h3>Sem plano de treino 🤖</h3>
        <p>Vá até o <strong>Coach IA</strong> e gere seu plano personalizado. É rápido e grátis!</p>
      </div>
    </div>
  )

  const dayData = schedule[selectedDay]
  const isRest = !dayData || dayData.muscle_group === 'Descanso' || dayData.exercises?.length === 0

  return (
    <div style={{ paddingBottom: 16 }}>
      <div className="page-header">
        <div>
          <div className="page-title">💪 Treino</div>
          <div className="page-sub">Selecione o dia da semana</div>
        </div>
      </div>

      {/* Day selector */}
      <div style={{ padding: '16px 20px 0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 'max-content', paddingBottom: 4 }}>
          {DAYS.map((d, i) => {
            const data = schedule[d]
            const isToday = i === TODAY_IDX
            const isRestD = !data || data.muscle_group === 'Descanso' || data.exercises?.length === 0
            return (
              <button key={d} onClick={() => setSelectedDay(d)} style={{
                padding: '10px 16px', borderRadius: 12, border: '2px solid',
                borderColor: selectedDay === d ? 'var(--accent)' : 'var(--border)',
                background: selectedDay === d ? 'rgba(255,77,28,0.12)' : 'var(--bg2)',
                color: selectedDay === d ? 'var(--accent)' : 'var(--text2)',
                cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap'
              }}>
                {DAY_LABELS[d]}{isToday && ' •'}
                <div style={{ fontSize: 11, marginTop: 2, color: isRestD ? 'var(--text2)' : 'inherit' }}>
                  {isRestD ? 'Descanso' : data?.muscle_group?.substring(0, 8)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="section">
        {isRest ? (
          <div className="card">
            <div className="rest-day">
              <div className="icon">😴</div>
              <h3>Dia de descanso</h3>
              <p>Recuperação é parte essencial do treino. Aproveite!</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,77,28,0.15), rgba(255,77,28,0.05))', borderColor: 'rgba(255,77,28,0.3)' }}>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Grupo muscular</div>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, marginTop: 4 }}>{dayData?.muscle_group}</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>{dayData?.exercises?.length} exercícios</div>
            </div>

            {dayData?.exercises?.map((ex: any, i: number) => {
              const last = getLastLoad(ex.name)
              return (
                <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex items-center gap-2" style={{ justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-2">
                      <div className="exercise-num">{i + 1}</div>
                      <div>
                        <div className="exercise-name">{ex.name}</div>
                        <div className="exercise-meta">{ex.sets} séries · {ex.reps} reps · {ex.rest} descanso</div>
                      </div>
                    </div>
                    {ex.gif_url && (
                      <a href={ex.gif_url} target="_blank" rel="noreferrer" className="exercise-link">▶ Ver</a>
                    )}
                  </div>

                  {last && (
                    <div style={{ padding: '8px 10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--green)' }}>
                      ✅ Último registro: {last.weight}kg · {last.reps} reps · {last.sets} séries
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[['weight','Peso (kg)'],['sets','Séries'],['reps','Reps']].map(([k,l]) => (
                      <div key={k}>
                        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, marginBottom: 4 }}>{l}</div>
                        <input className="input load-input" type="number" placeholder="0"
                          value={loads[ex.name]?.[k as 'weight'|'sets'|'reps'] || ''}
                          onChange={e => setLoads(prev => ({ ...prev, [ex.name]: { ...prev[ex.name], [k]: e.target.value } }))}
                          style={{ textAlign: 'center', padding: '10px 8px' }} />
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-secondary" onClick={() => saveLoad(ex.name)} style={{ padding: '10px' }}>
                    💾 Salvar carga
                  </button>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
