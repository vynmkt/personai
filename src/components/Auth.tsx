import { useState } from 'react'
import { AppUser } from '../App'

export default function Auth({ onLogin }: { onLogin: (u: AppUser, t: string) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getErrorMessage = (serverError: string, status: number) => {
    if (status === 409 || serverError?.toLowerCase().includes('exist')) return 'Este e-mail já está cadastrado. Tente fazer login.'
    if (status === 401 || serverError?.toLowerCase().includes('invalid') || serverError?.toLowerCase().includes('incorrect')) return 'E-mail ou senha incorretos. Verifique e tente novamente.'
    if (status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    if (status >= 500) return 'Servidor temporariamente indisponível. Tente novamente em instantes.'
    return serverError || 'Algo deu errado. Tente novamente.'
  }

  const submit = async () => {
    setError('')
    if (mode === 'signup' && !name.trim()) { setError('Digite seu nome'); return }
    if (!email.trim()) { setError('Digite seu e-mail'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('E-mail inválido — verifique o formato'); return }
    if (!password) { setError('Digite sua senha'); return }
    if (password.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres'); return }

    setLoading(true)
    try {
      const r = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, name: name.trim() })
      })
      const data = await r.json()
      if (!r.ok) { setError(getErrorMessage(data.error, r.status)); return }
      onLogin({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role || 'user' }, data.token)
    } catch {
      setError('Sem conexão com o servidor. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setError('')
    setPassword('')
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="icon">💪</div>
        <h1>PERSONAI</h1>
        <p>Seu coach de fitness com Inteligência Artificial</p>
      </div>

      <div className="auth-form">
        {/* Mode toggle tabs */}
        <div style={{ display: 'flex', background: 'var(--card2)', borderRadius: 12, padding: 4, marginBottom: 4 }}>
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 10,
                border: 'none',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text2)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {m === 'login' ? '🔑 Entrar' : '✨ Criar conta'}
            </button>
          ))}
        </div>

        {error && (
          <div className="error-msg" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label className="label">Como você quer ser chamado?</label>
            <input
              className="input"
              placeholder="Seu nome ou apelido"
              value={name}
              autoComplete="name"
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>
        )}

        <div>
          <label className="label">E-mail</label>
          <input
            className="input"
            type="email"
            placeholder="seu@email.com"
            value={email}
            autoComplete="email"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>

        <div>
          <label className="label">Senha {mode === 'signup' && <span style={{ color: 'var(--text2)', fontWeight: 400 }}>(mínimo 6 caracteres)</span>}</label>
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type={showPass ? 'text' : 'password'}
              placeholder={mode === 'signup' ? 'Crie uma senha segura' : 'Sua senha'}
              value={password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
                color: 'var(--text2)', padding: 4
              }}
              title={showPass ? 'Esconder senha' : 'Mostrar senha'}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ marginTop: 4 }}>
          {loading
            ? <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> {mode === 'login' ? 'Entrando...' : 'Criando conta...'}</>
            : mode === 'login' ? '→ Entrar' : '✨ Criar minha conta grátis'}
        </button>

        {mode === 'login' && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            Não tem conta?{' '}
            <button onClick={switchMode} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              Cadastre-se grátis →
            </button>
          </p>
        )}
        {mode === 'signup' && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            Já tem conta?{' '}
            <button onClick={switchMode} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              Fazer login
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
