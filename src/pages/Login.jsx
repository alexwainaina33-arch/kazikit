import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

function Wrap({ children, title, sub }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: 'var(--green)', textDecoration: 'none' }}>
            Kazi<span style={{ color: 'var(--amber)' }}>Kit</span>
          </Link>
          <h1 style={{ fontSize: 24, marginTop: 20, marginBottom: 6 }}>{title}</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>{sub}</p>
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  async function handle(e) {
    e.preventDefault()
    try { await login(email, password); navigate('/dashboard') }
    catch { toast.error('Wrong email or password') }
  }

  return (
    <Wrap title="Welcome back" sub="Log in to your KaziKit account">
      <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label>Email address</label>
          <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" required />
        </div>
        <div>
          <label>Password</label>
          <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)' }}>
          No account? <Link to="/signup" style={{ color: 'var(--green)', fontWeight: 500 }}>Sign up free</Link>
        </p>
      </form>
    </Wrap>
  )
}
