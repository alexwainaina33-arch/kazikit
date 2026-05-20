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

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const { signup, loading } = useAuth()
  const navigate = useNavigate()
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handle(e) {
    e.preventDefault()
    try {
      await signup(form.email, form.password, form.name, form.phone)
      toast.success('Welcome to KaziKit!')
      navigate('/dashboard')
    } catch (err) { toast.error(err.message || 'Could not create account') }
  }

  return (
    <Wrap title="Create your account" sub="Free to start — no card needed">
      <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div><label>Full name</label><input className="input-field" value={form.name} onChange={set('name')} placeholder="Jane Wanjiku Kamau" required /></div>
        <div><label>Email address</label><input className="input-field" type="email" value={form.email} onChange={set('email')} placeholder="you@gmail.com" required /></div>
        <div><label>Phone number</label><input className="input-field" type="tel" value={form.phone} onChange={set('phone')} placeholder="+254 7XX XXX XXX" /></div>
        <div><label>Password</label><input className="input-field" type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" minLength={8} required /></div>
        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={loading}>
          {loading ? 'Creating account...' : 'Create free account'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)' }}>
          Have an account? <Link to="/login" style={{ color: 'var(--green)', fontWeight: 500 }}>Log in</Link>
        </p>
      </form>
    </Wrap>
  )
}
