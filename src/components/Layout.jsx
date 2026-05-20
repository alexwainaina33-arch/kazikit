import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard',    icon: '🏠', label: 'Dashboard'       },
  { to: '/cv',           icon: '📄', label: 'CV Builder'       },
  { to: '/cover-letter', icon: '✉️', label: 'Cover Letter AI',  badge: 'NEW' },
  { to: '/applications', icon: '📋', label: 'Applications'     },
  { to: '/interview',    icon: '🎯', label: 'Interview Prep'   },
  { to: '/upgrade',      icon: '⚡', label: 'Buy / Upgrade'    },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    navigate('/', { replace: true })
    setTimeout(() => logout(), 50)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>

      {/* ── SIDEBAR ──────────────────────────────────── */}
      <aside style={{
        width: 228, flexShrink: 0,
        background: 'var(--ink)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
            Kazi<span style={{ color: 'var(--ochre)' }}>Kit</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Kenya job toolkit
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {NAV.map(({ to, icon, label, badge }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius)',
              fontSize: 13, fontWeight: isActive ? 700 : 500,
              color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--ochre)' : '3px solid transparent',
              marginBottom: 2, textDecoration: 'none',
              transition: 'all 0.15s',
            })}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{ fontSize: 9, fontWeight: 800, background: 'var(--ochre)', color: 'white', padding: '2px 6px', borderRadius: 2, letterSpacing: '0.06em' }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 800, flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px 10px', borderRadius: 'var(--radius)',
            fontSize: 12, color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          >
            <span>🚪</span> Log out
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <main style={{ flex: 1, padding: 'clamp(24px,3vw,40px)', overflowY: 'auto', maxWidth: 1000 }}>
        {children}
      </main>
    </div>
  )
}