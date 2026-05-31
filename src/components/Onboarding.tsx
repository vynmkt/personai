import { useState } from 'react'
import { AppUser, Profile } from '../App'

const STEPS = [
  {
    id: 'basic',
    q: '👋 Olá! Vamos montar seu perfil',
    hint: 'Essas informações permitem que a IA crie um plano 100% personalizado para você.',
    icon: '📋'
  },
  {
    id: 'goal',
    q: '🎯 Qual é o seu objetivo?',
    hint: 'Escolha o que mais se encaixa agora. Você pode mudar depois.',
    icon: '🎯'
  },
  {
    id: 'level',
    q: '💪 Qual é a sua experiência com treino?',
    hint: 'Seja honesto — isso define a dificuldade do seu plano.',
    icon: '💪'
  },
  {
    id: 'days',
    q: '📅 Quantos dias por semana você pode treinar?',
    hint: 'Coloque um número real — é melhor ser consistente com menos dias do que faltar com muitos.',
    icon: '📅'
  },
  {
    id: 'limit',
    q: '🩺 Tem alguma dor ou limitação física?',
    hint: 'Opcional, mas importante para evitar exercícios que possam te machucar.',
    icon: '🩺'
  },
]

// Progress indicator at top
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Passo {current + 1} de {total}</span>
        <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{Math.round(((current + 1) / total) * 100)}% completo</span>
      </div>
      <div style={{ height: 6, background: 'var(--card2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${((current + 1) / total) * 100}%`,
          background: 'var(--accent)',
          borderRadius: 99,
          transition: 'width 0.4s ease'
        }} />
      </div>
    </div>
  )
}

export default function Onboarding({ user, onSaved, authHeader }: { user: AppUser; onSaved: (p: Profile) => void; authHeader: Record<string, string> }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    age: '', gender: '', weight: '', height: '',
    objective: '', level: '', days_per_week: '', limitation: ''
  })

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setFieldErrors(e => ({ ...e, [k]: '' }))
  }

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {}
    if (step === 0) {
      if (!form.gender) errs.gender = 'Selecione o sexo'
      const age = parseInt(form.age)
      if (!form.age || isNaN(age) || age < 13 || age > 100) errs.age = 'Idade deve ser entre 13 e 100'
      const w = parseFloat(form.weight)
      if (!form.weight || isNaN(w) || w < 30 || w > 300) errs.weight = 'Peso deve ser entre 30 e 300 kg'
      const h = parseInt(form.height)
      if (!form.height || isNaN(h) || h < 100 || h > 250) errs.height = 'Altura deve ser entre 100 e 250 cm'
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const canNext = () => {
    if (step === 0) return form.age && form.gender && form.weight && form.height
    if (step === 1) return !!form.objective
    if (step === 2) return !!form.level
    if (step === 3) return !!form.days_per_week
    return true
  }

  const next = () => {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const body = {
        age: parseInt(form.age),
        gender: form.gender,
        weight: parseFloat(form.weight),
        height: parseInt(form.height),
        objective: form.objective,
        level: form.level,
        days_per_week: parseInt(form.days_per_week),
        limitation: form.limitation || '',
        activity_level: 'moderate',
        personality_mode: 'motivational',
        training_time: '60',
        routine: '',
        sleep: '7',
        current_diet: '',
        financial_condition: 'medium',
        rest_days: '[]'
      }
      const r = await fetch('/api/profile', { method: 'POST', headers: authHeader, body: JSON.stringify(body) })
      if (!r.ok) throw new Error()
      onSaved(body as any)
    } catch {
      setError('Não foi possível salvar. Verifique sua conexão e tente novamente.')
      setSaving(false)
    }
  }

  const objOptions = [
    { v: 'lose', emoji: '🔥', label: 'Emagrecer', desc: 'Perder gordura e definir o corpo' },
    { v: 'gain', emoji: '💪', label: 'Ganhar músculo', desc: 'Aumentar massa e força' },
    { v: 'maintain', emoji: '⚖️', label: 'Manter a forma', desc: 'Saúde e qualidade de vida' },
  ]

  const levelOptions = [
    { v: 'beginner', emoji: '🌱', label: 'Iniciante', desc: 'Menos de 6 meses de treino ou recomeçando' },
    { v: 'intermediate', emoji: '⚡', label: 'Intermediário', desc: 'De 6 meses a 2 anos de treino regular' },
    { v: 'advanced', emoji: '🔥', label: 'Avançado', desc: 'Mais de 2 anos com treino consistente' },
  ]

  const limitPresets = [
    { v: '', label: '✅ Sem limitações' },
    { v: 'dor no joelho', label: '🦵 Dor no joelho' },
    { v: 'dor nas costas', label: '🔙 Dor nas costas' },
    { v: 'ombro lesionado', label: '💪 Ombro lesionado' },
    { v: 'hérnia de disco', label: '🩻 Hérnia de disco' },
  ]

  const inputStyle = (field: string) => ({
    borderColor: fieldErrors[field] ? '#ef4444' : undefined
  })

  return (
    <div className="onboard-screen">
      <StepProgress current={step} total={STEPS.length} />

      <div className="onboard-step">
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>{STEPS[step].q}</div>
          <div className="onboard-hint">{STEPS[step].hint}</div>
        </div>

        {error && (
          <div className="error-msg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Step 0: Basic info */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">Sexo biológico <span style={{ color: 'var(--text2)', fontWeight: 400 }}>(usado para calcular metabolismo)</span></label>
              <div className="option-grid option-grid-3">
                {[['male','♂ Masculino'],['female','♀ Feminino'],['other','⊹ Outro']].map(([v,l]) => (
                  <button key={v} className={`option-btn${form.gender===v?' selected':''}`} onClick={() => set('gender',v)}>{l}</button>
                ))}
              </div>
              {fieldErrors.gender && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {fieldErrors.gender}</div>}
            </div>

            <div>
              <label className="label">Idade</label>
              <input
                className="input"
                type="number"
                placeholder="Ex: 28"
                min={13} max={100}
                value={form.age}
                onChange={e => set('age', e.target.value)}
                style={inputStyle('age')}
              />
              {fieldErrors.age && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {fieldErrors.age}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Peso atual <span style={{ color: 'var(--text2)' }}>(kg)</span></label>
                <input
                  className="input"
                  type="number"
                  placeholder="Ex: 75"
                  min={30} max={300}
                  value={form.weight}
                  onChange={e => set('weight', e.target.value)}
                  style={inputStyle('weight')}
                />
                {fieldErrors.weight && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>⚠ {fieldErrors.weight}</div>}
              </div>
              <div>
                <label className="label">Altura <span style={{ color: 'var(--text2)' }}>(cm)</span></label>
                <input
                  className="input"
                  type="number"
                  placeholder="Ex: 175"
                  min={100} max={250}
                  value={form.height}
                  onChange={e => set('height', e.target.value)}
                  style={inputStyle('height')}
                />
                {fieldErrors.height && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>⚠ {fieldErrors.height}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Objective */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {objOptions.map(({ v, emoji, label, desc }) => (
              <button
                key={v}
                className={`option-btn${form.objective===v?' selected':''}`}
                onClick={() => set('objective', v)}
                style={{ padding: '16px 18px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <span style={{ fontSize: 28 }}>{emoji}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{desc}</div>
                </div>
                {form.objective === v && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Level */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {levelOptions.map(({ v, emoji, label, desc }) => (
              <button
                key={v}
                className={`option-btn${form.level===v?' selected':''}`}
                onClick={() => set('level', v)}
                style={{ padding: '16px 18px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <span style={{ fontSize: 28 }}>{emoji}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{desc}</div>
                </div>
                {form.level === v && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Days */}
        {step === 3 && (
          <div>
            <div className="option-grid option-grid-3" style={{ gap: 10 }}>
              {['2','3','4','5','6','7'].map(d => (
                <button
                  key={d}
                  className={`option-btn${form.days_per_week===d?' selected':''}`}
                  onClick={() => set('days_per_week', d)}
                  style={{ padding: '20px 10px' }}
                >
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{d}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>dias/semana</div>
                </button>
              ))}
            </div>
            {form.days_per_week && (
              <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--card2)', borderRadius: 10, fontSize: 13, color: 'var(--text2)' }}>
                {form.days_per_week === '2' && '💡 2 dias é suficiente para começar. O importante é a consistência!'}
                {form.days_per_week === '3' && '💡 3 dias é o ideal para a maioria das pessoas — ótimo equilíbrio!'}
                {form.days_per_week === '4' && '💡 4 dias permite uma boa divisão de grupos musculares.'}
                {form.days_per_week === '5' && '💡 5 dias é um volume alto — certifique-se de ter recuperação adequada.'}
                {(form.days_per_week === '6' || form.days_per_week === '7') && '⚠️ Muitos dias seguidos pode aumentar o risco de lesões. Garanta sono e alimentação adequados.'}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Limitation */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {limitPresets.map(({ v, label }) => (
                <button
                  key={v}
                  className={`option-btn${form.limitation===v?' selected':''}`}
                  onClick={() => set('limitation', v)}
                  style={{ padding: '10px 14px', fontSize: 13, flex: '0 0 auto' }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Ou descreva em suas palavras <span style={{ color: 'var(--text2)' }}>(opcional)</span></label>
              <textarea
                className="input"
                placeholder="Ex: tendinite no ombro direito, dor na lombar ao agachar..."
                value={form.limitation}
                onChange={e => set('limitation', e.target.value)}
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--card2)', borderRadius: 10, fontSize: 13, color: 'var(--text2)' }}>
              💡 A IA vai adaptar o treino para evitar movimentos que agravem sua condição.
            </div>
          </div>
        )}

        <div className="onboard-nav" style={{ marginTop: 28 }}>
          {step > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => setStep(s => s - 1)}
              style={{ flex: '0 0 auto', width: 'auto', padding: '14px 22px' }}
            >
              ← Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" disabled={!canNext()} onClick={next}>
              Continuar →
            </button>
          ) : (
            <button className="btn btn-primary" disabled={saving} onClick={save}>
              {saving
                ? <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Criando seu plano...</>
                : '🚀 Criar meu plano personalizado!'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
