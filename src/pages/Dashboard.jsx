import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pb } from '../api/pocketbase'
import { useAuth } from '../context/AuthContext'
import { format, differenceInDays, isToday, isThisWeek } from 'date-fns'

const SC = {
  applied:   { label: 'Applied',   bg: '#E8F0FB', tc: '#1A4F8A' },
  interview: { label: 'Interview', bg: '#FEF3E2', tc: '#C17B2A' },
  offer:     { label: 'Offer',     bg: '#E8F5ED', tc: '#1D6A3A' },
  rejected:  { label: 'Rejected',  bg: '#FDEAEA', tc: '#B83232' },
  ghosted:   { label: 'Ghosted',   bg: '#F0EDE6', tc: '#6B6560' },
}

// Rotating Kenya-specific tips — 14 so each day of the fortnight is unique
const TIPS = [
  { icon: '📅', tip: 'Follow up exactly 5 working days after applying. Email is better than calling the first time.' },
  { icon: '🎯', tip: 'Tailor your CV summary for every application. A one-line change doubles your callback rate.' },
  { icon: '💼', tip: 'LinkedIn is the #1 hiring tool in Kenya right now. Update your headline to match the job you want — not the job you have.' },
  { icon: '👥', tip: 'Referrals get hired 4× faster in Kenya. Tell every contact you\'re job hunting. Shame is the enemy of employment.' },
  { icon: '⏰', tip: 'Apply before 9am on the day a job posts. Early applicants get read first — most jobs are decided in the first 48 hours.' },
  { icon: '📧', tip: 'Use firstname.lastname@gmail.com as your email. HR managers in Kenya have quietly rejected applications for unprofessional email addresses.' },
  { icon: '💰', tip: 'Research salary before every interview. Safaricom, KCB, and Equity salaries are on KaziKit\'s interview prep page.' },
  { icon: '📝', tip: 'Write a cover letter even when it\'s optional. Less than 20% of Kenyan applicants do — it\'s your biggest edge.' },
  { icon: '🏢', tip: 'Corporate Staffing Kenya and Summit Recruitment post hundreds of jobs weekly. Check them every Monday morning.' },
  { icon: '🤝', tip: 'After an interview, send a thank-you email within 24 hours. Almost no Kenyan candidate does this. It will be remembered.' },
  { icon: '📊', tip: 'Your response rate tells you if your CV is working. Below 10%? Rewrite your summary. Above 25%? Your CV is strong.' },
  { icon: '🌐', tip: 'Internationalised roles at USAID, UN, FAO pay 3–5× local market rates. Apply even if you think you\'re underqualified.' },
  { icon: '📱', tip: 'Most Kenyan job postings are filled within 2 weeks. If you haven\'t heard back in 3 weeks, move on and apply for similar roles.' },
  { icon: '✍️', tip: 'Use bullet points starting with action verbs on your CV: "Grew", "Managed", "Built", "Led", "Reduced". Recruiter attention spans are 6 seconds.' },
]

// What a healthy job hunt looks like — based on activity in the last 7 days
function getHealthScore(apps) {
  const recent = apps.filter(a => {
    try { return differenceInDays(new Date(), new Date(a.created)) <= 7 } catch { return false }
  })
  if (recent.length >= 5) return { score: 'Strong', color: 'var(--green)', bg: 'var(--green-light)', msg: 'You\'re applying consistently. Keep the momentum going.' }
  if (recent.length >= 2) return { score: 'Active', color: 'var(--amber)', bg: 'var(--amber-light)', msg: 'Good start. Try to log 5+ applications per week.' }
  return { score: 'Getting started', color: '#1A4F8A', bg: '#E8F0FB', msg: 'Log your applications here so you can track your progress.' }
}

function getNextAction(apps) {
  // Find the oldest "applied" with no follow-up in 5+ days
  const needsFollowUp = apps.filter(a => {
    if (a.status !== 'applied') return false
    try { return differenceInDays(new Date(), new Date(a.applied_date || a.created)) >= 5 } catch { return false }
  })
  if (needsFollowUp.length > 0) {
    return { type: 'followup', count: needsFollowUp.length, app: needsFollowUp[0] }
  }
  const interviews = apps.filter(a => a.status === 'interview')
  if (interviews.length > 0) {
    return { type: 'interview', count: interviews.length }
  }
  return null
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState([])

  const tipIdx = new Date().getDate() % TIPS.length
  const tip = TIPS[tipIdx]

  const firstName = user?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    Promise.all([
      pb.collection('kk_applications').getList(1, 200, { filter: `user = "${user.id}"`, sort: '-created' }),
      pb.collection('kk_subscriptions').getList(1, 50, { filter: `user = "${user.id}"`, sort: '-created' }).catch(() => ({ items: [] })),
    ]).then(([appsRes, subsRes]) => {
      setApps(appsRes.items)
      setPurchases(subsRes.items)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user.id])

  const counts = {
    total:      apps.length,
    thisWeek:   apps.filter(a => { try { return isThisWeek(new Date(a.created)) } catch { return false } }).length,
    interviews: apps.filter(a => a.status === 'interview').length,
    offers:     apps.filter(a => a.status === 'offer').length,
    rejected:   apps.filter(a => a.status === 'rejected').length,
    ghosted:    apps.filter(a => a.status === 'ghosted').length,
    rate:       apps.length ? Math.round(apps.filter(a => !['applied','ghosted'].includes(a.status)).length / apps.length * 100) : 0,
  }

  const health = getHealthScore(apps)
  const nextAction = getNextAction(apps)
  const hasPurchasedCV = purchases.some(p => ['cv_download','bundle','full_kit'].includes(p.plan))
  const hasInterviewPrep = purchases.some(p => ['interview_prep','full_kit'].includes(p.plan))

  // Stage funnel data
  const funnelData = [
    { label: 'Applied', count: apps.filter(a => a.status === 'applied').length, ...SC.applied },
    { label: 'Interview', count: counts.interviews, ...SC.interview },
    { label: 'Offer', count: counts.offers, ...SC.offer },
  ]
  const funnelMax = Math.max(...funnelData.map(f => f.count), 1)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text2)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14 }}>Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div className="page-title">{greeting}, {firstName} 👋</div>
        <p className="page-sub" style={{ marginBottom: 0 }}>Here's where your job hunt stands today.</p>
      </div>

      {/* ── NEXT ACTION ALERT ──────────────────────────────── */}
      {nextAction && (
        <div style={{ background: nextAction.type === 'followup' ? 'var(--amber-light)' : 'var(--green-light)', border: `1px solid ${nextAction.type === 'followup' ? '#E8C080' : '#A8D5B8'}`, borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{nextAction.type === 'followup' ? '⚡' : '🎯'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: nextAction.type === 'followup' ? 'var(--amber)' : 'var(--green)', marginBottom: 2 }}>
              {nextAction.type === 'followup'
                ? `${nextAction.count} application${nextAction.count > 1 ? 's' : ''} need${nextAction.count === 1 ? 's' : ''} a follow-up`
                : `You have ${nextAction.count} active interview${nextAction.count > 1 ? 's' : ''}`}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              {nextAction.type === 'followup'
                ? `${nextAction.app?.company} was applied to 5+ days ago. Send a follow-up email today.`
                : 'Use interview prep to practise before your next interview.'}
            </div>
          </div>
          <Link to={nextAction.type === 'followup' ? '/applications' : '/interview'} style={{ background: nextAction.type === 'followup' ? 'var(--amber)' : 'var(--green)', color: 'white', padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            {nextAction.type === 'followup' ? 'View applications →' : 'Go to prep →'}
          </Link>
        </div>
      )}

      {/* ── STAT CARDS ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total applied', value: counts.total,        color: '#1A4F8A', bg: '#E8F0FB', icon: '📋', to: '/applications' },
          { label: 'Interviews',    value: counts.interviews,   color: 'var(--amber)', bg: 'var(--amber-light)', icon: '🎤', to: '/applications' },
          { label: 'Offers',        value: counts.offers,       color: 'var(--green)', bg: 'var(--green-light)', icon: '🎉', to: '/applications' },
          { label: 'Response rate', value: counts.rate + '%',   color: 'var(--text)', bg: 'var(--surface2)', icon: '📊', to: '/applications' },
        ].map(s => (
          <Link key={s.label} to={s.to} style={{ background: s.bg, borderRadius: 'var(--radius)', padding: '18px 16px', textDecoration: 'none', display: 'block', transition: 'transform 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* ── TIP + HEALTH ROW ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {/* Daily tip */}
        <div style={{ background: 'var(--green-light)', border: '1px solid #A8D5B8', borderRadius: 'var(--radius)', padding: '14px 18px', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{tip.icon}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Tip of the day</div>
            <div style={{ fontSize: 13, color: '#1D4A2B', lineHeight: 1.65 }}>{tip.tip}</div>
          </div>
        </div>
        {/* Job hunt health */}
        <div style={{ background: health.bg, border: `1px solid ${health.color}40`, borderRadius: 'var(--radius)', padding: '14px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: health.color, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Job hunt health</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 22, fontWeight: 700, color: health.color }}>{health.score}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{counts.thisWeek} apps this week</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{health.msg}</div>
        </div>
      </div>

      {/* ── MAIN CONTENT: funnel + quick actions + recent ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Application funnel */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>📊 Your application pipeline</div>
          {funnelData.map(f => (
            <div key={f.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{f.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: f.tc }}>{f.count}</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: f.bg, borderRadius: 4, width: `${(f.count / funnelMax) * 100}%`, border: `1px solid ${f.tc}40`, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
          {/* Status breakdown */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(SC).map(([key, s]) => {
                const c = apps.filter(a => a.status === key).length
                return c > 0 ? (
                  <span key={key} style={{ background: s.bg, color: s.tc, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>
                    {s.label} {c}
                  </span>
                ) : null
              })}
            </div>
          </div>
          <Link to="/applications" style={{ display: 'block', marginTop: 14, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>View all applications →</Link>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>⚡ Quick actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('/applications')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 9, background: 'var(--green-light)', border: '1px solid #A8D5B8', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>➕</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>Log a new application</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Track a company you just applied to</div>
              </div>
            </button>
            <button onClick={() => navigate('/cv')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 9, background: '#E8F0FB', border: '1px solid #B8CBF0', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>📄</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A4F8A' }}>Update my CV</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Edit sections, reorder, download PDF</div>
              </div>
            </button>
            <button onClick={() => navigate('/interview')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 9, background: 'var(--amber-light)', border: '1px solid #E8C080', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🎯</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>Practise interview questions</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Safaricom, KCB, NGO — real questions</div>
              </div>
            </button>
            {!hasPurchasedCV && apps.length > 0 && (
              <button onClick={() => navigate('/upgrade')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 9, background: 'var(--green)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🖨️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Download CV as PDF — Ksh 70</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>A4, no watermarks, print-ready</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── RECENT APPLICATIONS ────────────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: 14, fontWeight: 700 }}>Recent applications</h3>
          <Link to="/applications" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>View all {counts.total > 5 ? `(${counts.total})` : ''} →</Link>
        </div>

        {apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No applications yet</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Log your first application to start tracking your job hunt.</p>
            <Link to="/applications" className="btn-primary" style={{ display: 'inline-flex', fontSize: 13, padding: '9px 20px' }}>
              Log first application →
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Company', 'Role', 'Applied', 'Status', 'Days ago'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.slice(0, 6).map(a => {
                const sc = SC[a.status] || SC.applied
                let daysAgo = '—'
                try { daysAgo = differenceInDays(new Date(), new Date(a.applied_date || a.created)) } catch {}
                const needsFollowUp = a.status === 'applied' && typeof daysAgo === 'number' && daysAgo >= 5
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 0', fontSize: 14, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, fontFamily: 'Fraunces,serif', flexShrink: 0 }}>
                          {a.company?.charAt(0)?.toUpperCase()}
                        </div>
                        {a.company}
                      </div>
                    </td>
                    <td style={{ padding: '11px 0 11px 8px', fontSize: 13, color: 'var(--text2)' }}>{a.role}</td>
                    <td style={{ padding: '11px 0 11px 8px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {a.applied_date ? format(new Date(a.applied_date), 'dd MMM') : '—'}
                    </td>
                    <td style={{ padding: '11px 0 11px 8px' }}>
                      <span style={{ background: sc.bg, color: sc.tc, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: '11px 0 11px 8px', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {typeof daysAgo === 'number' ? (
                        <span style={{ color: needsFollowUp ? 'var(--amber)' : 'var(--text3)', fontWeight: needsFollowUp ? 700 : 400 }}>
                          {daysAgo === 0 ? 'Today' : `${daysAgo}d`}
                          {needsFollowUp && ' ⚡'}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── UPSELL STRIP (only if not purchased) ───────────── */}
      {!hasInterviewPrep && apps.length >= 3 && (
        <div style={{ marginTop: 16, background: 'var(--amber-light)', border: '1px solid #E8C080', borderRadius: 'var(--radius)', padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🎯</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>You have {counts.interviews} interview{counts.interviews !== 1 ? 's' : ''} — are you prepared?</div>
            <div style={{ fontSize: 13, color: '#7A5020' }}>Unlock full interview prep with real Safaricom, KCB, and NGO questions. One-time Ksh 79.</div>
          </div>
          <Link to="/upgrade" style={{ background: 'var(--amber)', color: 'white', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            Unlock for Ksh 79 →
          </Link>
        </div>
      )}
    </div>
  )
}