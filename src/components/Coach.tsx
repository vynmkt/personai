import { useState, useEffect, useRef } from 'react'
import { AppUser, Profile } from '../App'

const QUICK_QUESTIONS = [
  'Qual músculo devo priorizar?',
  'Estou sentindo dor, o que faço?',
  'Posso treinar em jejum?',
  'Quanto tempo descansando entre séries?',
]

interface Message { role: 'user' | 'ai'; text: string }

const OBJ_MAP: Record<string, string> = { lose: 'emagrecer', gain: 'ganhar músculo', maintain: 'manter a forma' }
const LEVEL_MAP: Record<string, string> = { beginner: 'iniciante', intermediate: 'intermediário', advanced: 'avançado' }

export default function Coach({ user, profile, authHeader }: { user: AppUser; profile: Profile; authHeader: Record<string, string> }) {
  const [tab, setTab] = useState<'plan'|'chat'|'compare'>('plan')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `Oi ${user.name.split(' ')[0]}! 👋 Sou seu coach de IA. Pode me perguntar qualquer coisa sobre treino e alimentação — vou responder de forma simples e direta!` }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [hasPlan, setHasPlan] = useState(false)
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null)
  const [comparing, setComparing] = useState(false)
  const [compareResult, setCompareResult] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => { checkPlan() }, [])
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight) }, [messages])

  const checkPlan = async () => {
    const r = await fetch('/api/plans', { headers: authHeader })
    if (r.ok) { const d = await r.json(); setHasPlan(!!d.training_plan) }
  }

  const generatePlan = async () => {
    setGenerating(true)
    try {
      const tdee = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + (profile.gender === 'male' ? 5 : -161)) * 1.55
      const r = await fetch('/api/ai/analyze', {
        method: 'POST', headers: authHeader,
        body: JSON.stringify({ profile, lang: 'pt', isRaiz: false, tdee })
      })
      if (!r.ok) throw new Error()
      const result = await r.json()
      // Save plans
      await fetch('/api/plans', {
        method: 'POST', headers: authHeader,
        body: JSON.stringify({
          training_plan: result.training_plan,
          nutrition_plan: result.nutrition_plan,
          last_analysis: result.analysis,
          target_calories: result.targets?.calories,
          target_protein: result.targets?.protein,
          target_carbs: result.targets?.carbs,
          target_fat: result.targets?.fat,
          training_schedule: JSON.stringify(result.training_schedule),
          nutrition_schedule: JSON.stringify(result.nutrition_schedule)
        })
      })
      setHasPlan(true)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `🎉 Plano criado! Seu foco é ${OBJ_MAP[profile.objective]} e vou te guiar como ${LEVEL_MAP[profile.level]}.\n\n${result.analysis?.substring(0, 300)}...\n\nVeja o treino completo na aba 💪 Treino!`
      }])
      setTab('chat')
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Ops, deu um erro. Tente novamente em alguns segundos.' }])
    } finally {
      setGenerating(false)
    }
  }

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || sending) return
    setInput('')
    setSending(true)
    setMessages(prev => [...prev, { role: 'user', text: msg }])

    try {
      // Use server endpoint (OpenAI via backend)
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ message: msg, history: messages, profile })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro desconhecido')
      setMessages(prev => [...prev, { role: 'ai', text: d.text || 'Não entendi, tente de novo.' }])
    } catch (e: any) {
      const msg = e.message?.includes('configurada') 
        ? 'IA indisponível no momento. Contate o suporte.' 
        : 'Tive um problema de conexão. Tente novamente!'
      setMessages(prev => [...prev, { role: 'ai', text: msg }])
    } finally { setSending(false) }
  }

  const handlePhoto = (type: 'before' | 'after', file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'before') setBeforePhoto(reader.result as string)
      else setAfterPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const comparePhotos = async () => {
    if (!beforePhoto || !afterPhoto) return
    setComparing(true)
    setCompareResult(null)
    try {
      const r = await fetch('/api/ai/compare-photos', {
        method: 'POST', headers: authHeader,
        body: JSON.stringify({ beforeImage: beforePhoto, afterImage: afterPhoto, profile })
      })
      const d = await r.json()
      setCompareResult(d.text)
    } catch {
      setCompareResult('Erro ao analisar. Tente novamente.')
    } finally { setComparing(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--nav-h))' }}>
      <div className="page-header" style={{ paddingBottom: 0 }}>
        <div>
          <div className="page-title">🤖 Coach IA</div>
          <div className="page-sub">Seu personal trainer inteligente</div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div className="tabs">
          <button className={`tab${tab==='plan'?' active':''}`} onClick={() => setTab('plan')}>Plano</button>
          <button className={`tab${tab==='chat'?' active':''}`} onClick={() => setTab('chat')}>Chat</button>
          <button className={`tab${tab==='compare'?' active':''}`} onClick={() => setTab('compare')}>Antes/Depois</button>
        </div>
      </div>

      {/* PLAN TAB */}
      {tab === 'plan' && (
        <div className="section" style={{ flex: 1, overflowY: 'auto' }}>
          {generating ? (
            <div className="gen-banner">
              <div style={{ fontSize: 48, marginBottom: 8 }}>⚙️</div>
              <h3>Criando seu plano personalizado...</h3>
              <div style={{ color: 'var(--text2)', fontSize: 14, margin: '8px 0 20px' }}>
                A IA está analisando seu perfil e montando treino + dieta. Isso leva cerca de 30 segundos.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280 }}>
                {['📊 Analisando seu perfil...', '🏋️ Montando plano de treino...', '🥗 Calculando plano nutricional...'].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text2)' }}>
                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, flexShrink: 0 }} />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          ) : !hasPlan ? (
            <div className="gen-banner">
              <div style={{ fontSize: 48, marginBottom: 8 }}>🚀</div>
              <h3>Vamos criar seu plano!</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, margin: '8px 0 20px', lineHeight: 1.6 }}>
                A IA vai montar um <strong>treino completo</strong> e uma <strong>dieta personalizada</strong> baseados no seu perfil. Leva menos de 1 minuto!
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, width: '100%', maxWidth: 280 }}>
                {['✅ Treino semanal detalhado', '✅ Plano alimentar com macros', '✅ Links de exercícios no YouTube', '✅ Dicas personalizadas para seu objetivo'].map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'left' }}>{item}</div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={generatePlan}>
                ✨ Gerar meu plano agora
              </button>
            </div>
          ) : (
            <>
              <div className="card" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Plano ativo!</div>
                <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Confira o treino do dia na aba 💪 Treino</div>
              </div>
              <button className="btn btn-secondary" onClick={generatePlan}>
                🔄 Refazer meu plano
              </button>
              <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>
                ⚠️ Isso vai substituir o plano atual com um novo
              </div>
            </>
          )}
        </div>
      )}

      {/* CHAT TAB */}
      {tab === 'chat' && (
        <>
          <div ref={chatRef} className="section chat-messages" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} className={`msg msg-${m.role}`} style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            ))}
            {sending && (
              <div className="msg msg-ai">
                <div className="dot-loader"><span /><span /><span /></div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {QUICK_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} disabled={sending} style={{
                padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border)',
                background: 'var(--bg2)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'Nunito',
                fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0
              }}>{q}</button>
            ))}
          </div>

          <div className="chat-input-row">
            <input className="input" placeholder="Me pergunte algo sobre treino..." value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} />
            <button className="chat-send" onClick={() => sendMessage()} disabled={sending || !input.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </>
      )}

      {/* COMPARE TAB */}
      {tab === 'compare' && (
        <div className="section" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="card" style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
            📸 Envie duas fotos — uma de antes e uma de agora. A IA analisa sua evolução e te dá um feedback honesto. <strong style={{ color: 'var(--text)' }}>As fotos não ficam salvas</strong> — são analisadas e descartadas.
          </div>

          <div className="photo-compare">
            {/* Before */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>ANTES</div>
              <label className="photo-slot" style={{ cursor: 'pointer' }}>
                {beforePhoto ? <img src={beforePhoto} alt="antes" /> : <>
                  <div className="photo-slot-icon">📷</div>
                  <div className="photo-slot-label">Selecionar</div>
                </>}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handlePhoto('before', e.target.files[0])} />
              </label>
            </div>

            {/* After */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>AGORA</div>
              <label className="photo-slot" style={{ cursor: 'pointer' }}>
                {afterPhoto ? <img src={afterPhoto} alt="depois" /> : <>
                  <div className="photo-slot-icon">📷</div>
                  <div className="photo-slot-label">Selecionar</div>
                </>}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handlePhoto('after', e.target.files[0])} />
              </label>
            </div>
          </div>

          <button className="btn btn-primary" onClick={comparePhotos} disabled={!beforePhoto || !afterPhoto || comparing}>
            {comparing ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analisando...</> : '🔍 Analisar evolução'}
          </button>

          {compareResult && (
            <div className="card" style={{ lineHeight: 1.7, fontSize: 15, whiteSpace: 'pre-wrap' }}>
              {compareResult}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
