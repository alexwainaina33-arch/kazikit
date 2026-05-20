import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

// ── Animated counter ──────────────────────────────────────────
function Counter({ end, suffix = '' }) {
  const [n, setN] = useState(0)
  const ref = useRef(null)
  const done = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return
      done.current = true
      const t0 = performance.now()
      const dur = 2000
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1)
        setN(Math.floor((1 - Math.pow(1 - p, 3)) * end))
        if (p < 1) requestAnimationFrame(tick); else setN(end)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end])
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>
}

// ── Live ticker ───────────────────────────────────────────────
const TICKER_ITEMS = [
  '📋 Brian Otieno logged application to Safaricom',
  '📄 Jane Kamau downloaded her CV — Ksh 70',
  '🎯 23 people practised interview prep today',
  '✅ Amina Wanjiku got an offer from KCB Group',
  '📋 David Mwenda tracked 12 applications this week',
  '📄 Cynthia Achieng — USAID cover letter downloaded',
  '🎯 "How would you improve M-PESA?" practised 47 times today',
  '✅ 3 job offers recorded this week',
]

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="ticker-wrap">
      <div className="ticker-inner">
        {items.map((item, i) => (
          <span key={i} style={{ padding: '0 40px', fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

const FAQS = [
  {
    q: 'Why pay Ksh 70 when Careergo charges Ksh 30?',
    a: 'Careergo writes your CV for you using AI. 70% of Kenyan HR managers say they can identify AI-generated CVs — and more than half reject them. KaziKit helps you write your own CV properly, with 9 real sections, your own photo, your own words. It looks like you, not like software. The extra Ksh 40 is the difference between a shortlist and a bin.'
  },
  {
    q: 'What is always free?',
    a: 'Building and editing your full CV (all 9 sections), live preview, tracking up to 5 applications, your dashboard, and 3 sample interview questions per category. You pay Ksh 70 only when you download your CV as PDF.'
  },
  {
    q: 'Can I really pay with M-PESA?',
    a: 'Yes. Paystack handles payment — select M-PESA at checkout, enter your number, confirm on your phone. Done. No card needed ever.'
  },
  {
    q: 'Is the AI cover letter actually good?',
    a: 'It reads your CV and the job description you paste in, then writes a cover letter that connects your specific experience to that specific job. It names the company correctly, references the actual role requirements, and writes in your voice based on your CV language. It is not a template — it is a fresh letter for every application.'
  },
  {
    q: 'Once I pay for interview prep, is it forever?',
    a: 'Yes. Ksh 79 is one payment, full access, every category, including all future updates. We add new employer questions regularly.'
  },
]

export default function Landing() {
  const [activeFaq, setActiveFaq] = useState(null)

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV — always solid, never disappears ─────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'var(--cream)',
        borderBottom: '2px solid var(--ink)',
        padding: '0 clamp(20px,5vw,60px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--forest)', letterSpacing: '-0.5px' }}>
          Kazi<span style={{ color: 'var(--ochre)' }}>Kit</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: 6 }}>Nairobi</span>
        </div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {[['Features','#features'],['Pricing','#pricing'],['vs Careergo','#compare'],['FAQ','#faq']].map(([l,h]) => (
            <a key={l} href={h} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', padding: '8px 12px', letterSpacing: '0.02em', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'var(--forest)'}
              onMouseLeave={e => e.target.style.color = 'var(--text2)'}
            >{l}</a>
          ))}
          <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', padding: '8px 12px' }}>Log in</Link>
          <Link to="/signup" style={{
            background: 'var(--forest)', color: 'white', padding: '9px 20px',
            borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700, marginLeft: 6,
            letterSpacing: '0.02em', border: '2px solid var(--forest)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--ink)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--forest)'; e.currentTarget.style.borderColor = 'var(--forest)' }}
          >
            Build CV free
          </Link>
        </div>
      </nav>

      {/* ── ANNOUNCEMENT STRIP ───────────────────────────── */}
      <div style={{ background: 'var(--forest)', padding: '8px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
          ✦ New: AI cover letter generator — paste a job ad, get a professional cover letter in 30 seconds ·{' '}
          <Link to="/signup" style={{ color: 'var(--ochre-lite)', fontWeight: 700, textDecoration: 'underline' }}>Try it free →</Link>
        </span>
      </div>

      {/* ── TICKER ───────────────────────────────────────── */}
      <Ticker />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(48px,6vw,80px) clamp(20px,5vw,60px) 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'end' }}>
          <div className="anim-up">
            <span className="section-kicker">Kenya's job hunt toolkit</span>
            <div style={{ width: 56, height: 4, background: 'var(--forest)', marginBottom: 20 }} />
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px,5.5vw,72px)',
              fontWeight: 900, lineHeight: 1.03,
              letterSpacing: '-2px', color: 'var(--ink)', marginBottom: 24,
            }}>
              The job is out<br />there.
              <em style={{ color: 'var(--forest)', display: 'block', fontStyle: 'italic' }}>Go get it properly.</em>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--text2)', lineHeight: 1.8, maxWidth: 480, marginBottom: 32, fontWeight: 300 }}>
              Build a CV that gets shortlisted. Track every application. Walk into Safaricom knowing exactly what they'll ask. For Kenyan job seekers who are serious.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              <Link to="/signup" style={{
                background: 'var(--forest)', color: 'white',
                padding: '14px 32px', borderRadius: 'var(--radius)',
                fontSize: 15, fontWeight: 700, letterSpacing: '0.02em',
                boxShadow: '4px 4px 0 var(--ink)', border: '2px solid var(--ink)',
                transition: 'transform 0.1s, box-shadow 0.1s', display: 'inline-block',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 var(--ink)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0 var(--ink)' }}
              >
                Build my CV — free →
              </Link>
              <Link to="/login" style={{
                background: 'transparent', color: 'var(--ink)',
                padding: '13px 24px', borderRadius: 'var(--radius)',
                fontSize: 15, fontWeight: 600, border: '2px solid var(--ink)', display: 'inline-block',
              }}>
                I have an account
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
              {[['Build CV','Free'],['Download PDF','Ksh 70'],['Cover Letter AI','Ksh 50'],['Interview Prep','Ksh 79'],['Full Kit','Ksh 149']].map(([l,p],i) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {i > 0 && <span style={{ color: 'var(--border)', marginRight: -8 }}>·</span>}
                  {l}: <strong style={{ color: p === 'Free' ? 'var(--forest)' : 'var(--ink)' }}>{p}</strong>
                </span>
              ))}
            </div>
          </div>

          <div className="anim-up delay-2">
            <div style={{
              background: 'var(--ink)', color: 'var(--cream)',
              borderRadius: 'var(--radius)', padding: '36px 32px',
              border: '2px solid var(--ink)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: 'rgba(29,106,58,0.15)', transform: 'translate(60px,-60px)' }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
                This week in Kenya
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {[
                  { n: 147, label: 'new signups' },
                  { n: 89,  label: 'CVs downloaded' },
                  { n: 312, label: 'apps tracked' },
                  { n: 23,  label: 'interviews logged' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 900, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-2px' }}>
                      <Counter end={s.n} />
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', animation: 'pulse-dot 2s infinite' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Live data updated daily</span>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '20px 22px', background: 'var(--ochre-lite)', border: '1.5px solid var(--ochre)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--ochre)', lineHeight: 1, marginBottom: 8 }}>"</div>
              <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>
                I spent Ksh 70 on my CV download. Three weeks later I had a KCB job offer.
              </p>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ochre)' }}>Amina W. — HR Officer, KCB Group</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 clamp(20px,5vw,60px)' }}>
        <div style={{ borderTop: '3px solid var(--ink)', paddingTop: 24, marginBottom: 48, display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto' }}>
            <span className="section-kicker">The honest picture</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 900, maxWidth: 380, letterSpacing: '-0.5px' }}>
              47 people applied for that Safaricom job. One got it.
            </h2>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ width: 40, height: 3, background: 'var(--ochre)', marginBottom: 16 }} />
            <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.85, marginBottom: 16 }}>
              The graduate who got hired didn't have a better degree. They had a better CV, a tracked pipeline, and they walked in knowing exactly what the interviewer would ask.
            </p>
            <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.85 }}>
              The other 46 applied into the void — no tracking, no follow-up, no preparation. Most of them don't even know they were rejected.
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2 }}>
          {[
            { icon: '😰', voice: '"I applied 3 weeks ago. I genuinely cannot remember what role or even the company\'s name."' },
            { icon: '😤', voice: '"My CV is the same Word template everyone from UoN uses. I never get shortlisted."' },
            { icon: '😶', voice: '"KCB asked my salary expectation. I said Ksh 60K. The range was Ksh 110K. I walked out of that room broken."' },
            { icon: '📱', voice: '"I track everything in a WhatsApp thread called \'Jobs\'. It has 200 messages. I can\'t find anything."' },
          ].map((p, i) => (
            <div key={i} style={{
              background: i % 2 === 0 ? 'var(--surface)' : 'var(--cream-dark)',
              border: '1.5px solid var(--border)',
              borderLeft: `4px solid ${i === 2 ? 'var(--red)' : 'var(--forest)'}`,
              padding: '20px 18px',
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{p.icon}</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, fontStyle: 'italic' }}>{p.voice}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 2, background: 'var(--forest)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 15, color: 'white', fontWeight: 600 }}>KaziKit fixes every one of these. Build free. Pay Ksh 70 for your CV.</span>
          <Link to="/signup" style={{ background: 'var(--ochre)', color: 'white', padding: '10px 22px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700, display: 'inline-block', border: '2px solid var(--ochre)' }}>
            Start now →
          </Link>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 clamp(20px,5vw,60px)' }}>
        <div style={{ borderTop: '3px solid var(--ink)', paddingTop: 24, marginBottom: 48 }}>
          <span className="section-kicker">What you get</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Four tools. One focused mission.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 2, marginBottom: 2 }}>
          <div style={{ background: 'var(--forest)', color: 'white', padding: '36px 32px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>01 — CV Builder</div>
            <div style={{ fontSize: 11, fontWeight: 700, background: 'var(--ochre)', color: 'white', padding: '4px 10px', borderRadius: 3, display: 'inline-block', marginBottom: 16, letterSpacing: '0.06em' }}>
              BUILD FREE · DOWNLOAD Ksh 70
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,2.5vw,30px)', color: 'white', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.3px' }}>
              9 sections. Your photo. Your words. Not AI slop.
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 20 }}>
              Upload your passport photo. Drag sections to reorder them. Pick your accent colour. 4 templates built for East African employers — Modern, Classic, Bold, Executive. Print to perfect A4 PDF.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {['Passport photo upload','Custom accent colour','Drag-to-reorder sections','Referees with full details','Languages & proficiency','Certifications','Achievements & Awards','Live preview'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ color: '#4ADE80', flexShrink: 0, fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <Link to="/signup" style={{ background: 'white', color: 'var(--forest)', padding: '11px 22px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700, display: 'inline-block', border: '2px solid white' }}>
              Build my CV free →
            </Link>
          </div>

          <div style={{ background: 'var(--cream-dark)', border: '1.5px solid var(--border)', padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ background: 'var(--forest)', borderRadius: 3, padding: '20px 22px', color: 'white', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>Jane Wanjiku Kamau</div>
                  <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Marketing Officer · Nairobi</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 9, opacity: 0.65, flexWrap: 'wrap' }}>
                <span>✉ jane@gmail.com</span><span>📞 +254 722 000 000</span><span>🔗 linkedin.com/in/jane</span>
              </div>
            </div>
            {['PROFILE','WORK EXPERIENCE','EDUCATION','SKILLS','CERTIFICATIONS','REFEREES'].map((sec, si) => (
              <div key={sec} style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '1.2px', color: 'var(--text3)', marginBottom: 5 }}>{sec}</div>
                {sec === 'SKILLS' ? (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['Excel','Swahili','Marketing','CRM'].map(sk => (
                      <span key={sk} style={{ background: '#D6EEE0', color: 'var(--forest)', fontSize: 9, padding: '2px 7px', borderRadius: 2, fontWeight: 600 }}>{sk}</span>
                    ))}
                  </div>
                ) : sec === 'REFEREES' ? (
                  <div style={{ fontSize: 9, color: 'var(--text2)', fontStyle: 'italic' }}>Dr. James Mwangi · KCB Group · +254 7XX</div>
                ) : (
                  <>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 2, width: si === 0 ? '92%' : si === 4 ? '70%' : '85%' }} />
                    {si < 4 && <div style={{ height: 5, background: 'var(--cream-dark)', borderRadius: 2, width: '68%', marginTop: 3 }} />}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
          <div style={{ background: 'var(--ink)', color: 'var(--cream)', padding: '28px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>02 — AI Cover Letter</div>
            <div style={{ fontSize: 11, fontWeight: 700, background: 'var(--ochre)', color: 'white', padding: '3px 9px', borderRadius: 2, display: 'inline-block', marginBottom: 14 }}>Ksh 50 · NEW</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'white', marginBottom: 14, lineHeight: 1.2 }}>
              Paste the job ad. Get a letter in 30 seconds.
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 18 }}>
              Claude AI reads your CV and the job description, then writes a targeted cover letter that connects your exact experience to that specific role. Not a template — a real letter.
            </p>
            <Link to="/signup" style={{ fontSize: 13, color: 'var(--ochre)', fontWeight: 700 }}>Try free →</Link>
          </div>
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', padding: '28px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>03 — App Tracker</div>
            <div style={{ fontSize: 11, fontWeight: 700, background: '#D6EEE0', color: 'var(--forest)', padding: '3px 9px', borderRadius: 2, display: 'inline-block', marginBottom: 14 }}>FREE up to 5</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 14, lineHeight: 1.2 }}>
              Know where you stand with every company.
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 18 }}>
              Log company, role, date, contact, notes. 5-stage pipeline. See your response rate on the dashboard. Never miss a follow-up again.
            </p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[['Applied','#D6EEE0','var(--forest)'],['Interview','var(--ochre-lite)','var(--ochre)'],['Offer','#D6EEE0','var(--forest)'],['Rejected','var(--red-lite)','var(--red)'],['Ghosted','var(--cream-dark)','var(--text2)']].map(([l,bg,tc]) => (
                <span key={l} style={{ background: bg, color: tc, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 2 }}>{l}</span>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--ochre)', color: 'white', padding: '28px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>04 — Interview Prep</div>
            <div style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 9px', borderRadius: 2, display: 'inline-block', marginBottom: 14 }}>Ksh 79 · ONE-TIME · FOREVER</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'white', marginBottom: 14, lineHeight: 1.2 }}>
              Walk in knowing what Safaricom will ask.
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, marginBottom: 18 }}>
              Real questions from actual Safaricom, KCB, Equity, USAID, and FAO interviews. Kenya-context answer guides. Salary ranges for 8 job categories.
            </p>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>Safaricom · KCB · Equity · USAID · FAO · Nation Media</div>
            <Link to="/signup" style={{ fontSize: 13, color: 'white', fontWeight: 700, borderBottom: '1.5px solid rgba(255,255,255,0.5)' }}>Start practising →</Link>
          </div>
        </div>
      </section>

      {/* ── VS CAREERGO ──────────────────────────────────── */}
      <section id="compare" style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 clamp(20px,5vw,60px)' }}>
        <div style={{ borderTop: '3px solid var(--ink)', paddingTop: 24, marginBottom: 40 }}>
          <span className="section-kicker">Honest comparison</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Ksh 40 more than Careergo.<br />A completely different product.
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', width: '28%' }}>Feature</th>
                <th>Careergo<br /><span style={{ fontWeight: 400, opacity: 0.6 }}>Ksh 30</span></th>
                <th>CVshaper<br /><span style={{ fontWeight: 400, opacity: 0.6 }}>Free*</span></th>
                <th>MyDreamCV<br /><span style={{ fontWeight: 400, opacity: 0.6 }}>Ksh 1,000+</span></th>
                <th className="us-head">KaziKit<br /><span style={{ fontWeight: 400, opacity: 0.7 }}>from Ksh 70</span></th>
              </tr>
            </thead>
            <tbody>
              {[
                ['CV builder',            '✓','✓','Human writes','✓'],
                ['Photo upload',          '✗','✗','✓','✓'],
                ['Referees section',      '✗','✗','✓','✓'],
                ['Languages / Certs',     '✗','✗','varies','✓'],
                ['Drag section reorder',  '✗','✗','✗','✓'],
                ['Custom accent colour',  '✗','✗','✗','✓'],
                ['PDF download',          'Ksh 30','Ksh 0 (watermark)','Included','Ksh 70'],
                ['AI cover letter',       '✗','✗','Extra','Ksh 50'],
                ['Application tracker',   '✗','✗','✗','✓'],
                ['Interview prep (Kenya)','✗','✗','✗','✓'],
                ['Salary guide',          '✗','✗','✗','✓'],
                ['M-PESA payment',        '✓','N/A','✗','✓'],
              ].map((row, ri) => (
                <tr key={ri}>
                  <td style={{ textAlign: 'left', fontWeight: 600, fontSize: 13 }}>{row[0]}</td>
                  {[1,2,3,4].map(ci => {
                    const v = row[ci]; const isUs = ci === 4
                    return (
                      <td key={ci} className={isUs ? 'us-col' : ''}>
                        {v === '✓' ? <span style={{ color: isUs ? 'var(--forest)' : '#bbb', fontWeight: 800 }}>✓</span>
                         : v === '✗' ? <span style={{ color: '#ddd', fontWeight: 800 }}>✗</span>
                         : <span style={{ fontWeight: isUs ? 700 : 400, color: isUs ? 'var(--forest)' : 'var(--text2)' }}>{v}</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 2, background: 'var(--cream-dark)', border: '1.5px solid var(--border)', borderLeft: '4px solid var(--ochre)', padding: '16px 20px', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
            <strong>The AI CV problem:</strong> Corporate Staffing Kenya — the country's largest recruiter — reports that 70% of Kenyan HR managers can identify AI-generated CVs, and over 50% reject those candidates outright. Careergo's entire model is AI writing your CV for you. KaziKit gives you the tools to write your own, properly.
          </p>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 clamp(20px,5vw,60px)' }}>
        <div style={{ borderTop: '3px solid var(--ink)', paddingTop: 24, marginBottom: 40 }}>
          <span className="section-kicker">Pricing</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Pay for what you need.<br />Nothing else. No subscription.
          </h2>
        </div>
        <div style={{ background: 'var(--cream-dark)', border: '1.5px solid var(--border)', padding: '16px 22px', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontWeight: 700, background: '#D6EEE0', color: 'var(--forest)', padding: '4px 10px', borderRadius: 2, letterSpacing: '0.06em', flexShrink: 0 }}>ALWAYS FREE</div>
          <div style={{ flex: 1, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['Build & edit full CV (all 9 sections)','Live preview','Track 5 applications','Dashboard','Sample interview questions'].map(f => (
              <span key={f} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: 'var(--forest)', fontWeight: 700 }}>✓</span> {f}
              </span>
            ))}
          </div>
          <Link to="/signup" style={{ background: 'var(--forest)', color: 'white', padding: '9px 20px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700 }}>Start free →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 2 }}>
          {[
            { price: 70,  label: 'CV Download',      desc: 'PDF, A4, no watermark. 4 templates.', icon: '📄', note: null },
            { price: 50,  label: 'Cover Letter',      desc: 'AI-written, matched to the job.',     icon: '✉️', note: 'NEW' },
            { price: 99,  label: 'CV + Cover Letter', desc: 'Both together — saves Ksh 21.',       icon: '📦', note: 'SAVE Ksh 21' },
            { price: 79,  label: 'Interview Prep',    desc: 'Full access, forever. All categories.',icon: '🎯', note: 'ONE-TIME' },
            { price: 149, label: 'Full Kit',          desc: 'Everything above. Saves Ksh 50.',     icon: '🚀', note: 'BEST VALUE', featured: true },
          ].map(p => (
            <div key={p.label} style={{ background: p.featured ? 'var(--ink)' : 'var(--surface)', border: `1.5px solid ${p.featured ? 'var(--ink)' : 'var(--border)'}`, padding: '22px 18px', position: 'relative' }}>
              {p.note && (
                <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 800, background: p.featured ? 'var(--ochre)' : 'var(--forest)', color: 'white', padding: '2px 7px', borderRadius: 2, letterSpacing: '0.06em' }}>{p.note}</div>
              )}
              <div style={{ fontSize: 24, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: p.featured ? 'white' : 'var(--forest)', letterSpacing: '-0.5px', marginBottom: 4 }}>Ksh {p.price}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.featured ? 'rgba(255,255,255,0.9)' : 'var(--ink)', marginBottom: 6 }}>{p.label}</div>
              <p style={{ fontSize: 12, color: p.featured ? 'rgba(255,255,255,0.55)' : 'var(--text3)', lineHeight: 1.5, marginBottom: 16 }}>{p.desc}</p>
              <Link to="/signup" style={{ fontSize: 12, color: p.featured ? 'var(--ochre)' : 'var(--forest)', fontWeight: 700 }}>Get this →</Link>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, background: 'var(--cream-dark)', border: '1.5px solid var(--border)', padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', gridColumn: '1/-1' }}>To put Ksh 70 in perspective:</div>
          {[['Photocopy CV at cyber café','Ksh 50–150'],['Careergo AI CV (generic)','Ksh 30'],['KaziKit CV (yours, 9 sections)','Ksh 70'],['Human CV writing service','Ksh 1,000+']].map(([l,c],i) => (
            <div key={l} style={{ fontSize: 12 }}>
              <div style={{ color: 'var(--text3)', marginBottom: 2 }}>{l}</div>
              <div style={{ fontWeight: 800, color: i === 2 ? 'var(--forest)' : 'var(--ink)', fontSize: 14 }}>{c}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 clamp(20px,5vw,60px)' }}>
        <div style={{ borderTop: '3px solid var(--ink)', paddingTop: 24, marginBottom: 40 }}>
          <span className="section-kicker">Questions</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 900, letterSpacing: '-0.5px' }}>Straight answers.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 2 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderTop: '1.5px solid var(--border)', borderLeft: i % 2 === 1 ? '1.5px solid var(--border)' : 'none' }}>
              <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} style={{ width: '100%', textAlign: 'left', padding: '20px 20px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontFamily: 'var(--font-body)', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ fontSize: 20, color: 'var(--text3)', flexShrink: 0, transform: activeFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
              </button>
              {activeFaq === i && (
                <div style={{ padding: '0 20px 20px' }}>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.85 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1.5px solid var(--border)', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>More questions?</span>
          <a href="mailto:hello@kazikit.co.ke" style={{ fontSize: 14, fontWeight: 700, color: 'var(--forest)' }}>Email hello@kazikit.co.ke →</a>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 clamp(20px,5vw,60px) 80px' }}>
        <div style={{ background: 'var(--ink)', padding: 'clamp(40px,5vw,64px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ width: 44, height: 4, background: 'var(--ochre)', marginBottom: 20 }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,52px)', color: 'white', marginBottom: 16, lineHeight: 1.05, letterSpacing: '-1px' }}>
              The job is there.<br /><em style={{ color: 'var(--ochre)' }}>Start today.</em>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 28, lineHeight: 1.75 }}>
              Build your CV free. Pay Ksh 70 when you're ready to download. No subscription. No monthly charge. No credit card.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/signup" style={{ background: 'var(--ochre)', color: 'white', padding: '15px 36px', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 700, boxShadow: '4px 4px 0 var(--ochre-lite)', border: '2px solid var(--ochre)', display: 'inline-block', transition: 'all 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 var(--ochre-lite)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0 var(--ochre-lite)' }}
              >
                Build my CV free →
              </Link>
              <Link to="/login" style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', padding: '14px 22px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, border: '2px solid rgba(255,255,255,0.2)', display: 'inline-block' }}>
                I have an account
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { av: 'AW', name: 'Amina W.', role: 'KCB Group', quote: 'Spent Ksh 70. Got hired.', color: 'var(--forest)' },
              { av: 'BO', name: 'Brian O.', role: 'Safaricom GT', quote: 'Interview prep had the exact question they asked me.', color: 'var(--ochre)' },
              { av: 'CA', name: 'Cynthia A.', role: 'USAID Kenya', quote: 'Recruiter commented on my CV design.', color: 'var(--sky)' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${t.color}` }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0 }}>{t.av}</div>
                <div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, marginBottom: 4, fontStyle: 'italic' }}>"{t.quote}"</p>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{t.name} · {t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ borderTop: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--cream)', padding: '36px clamp(20px,5vw,60px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32, marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 6 }}>Kazi<span style={{ color: 'var(--ochre)' }}>Kit</span></div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>Kenya's job hunt toolkit.<br />No subscription. Pay per use.</p>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Product</div>
            {[['CV Builder — free','/signup'],['CV Download — Ksh 70','/signup'],['AI Cover Letter — Ksh 50','/signup'],['Interview Prep — Ksh 79','/signup'],['Full Kit — Ksh 149','/signup']].map(([l,p]) => (
              <div key={l} style={{ marginBottom: 8 }}><Link to={p} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{l}</Link></div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Navigate</div>
            {[['Sign up free','/signup'],['Log in','/login'],['Features','#features'],['Pricing','#pricing'],['vs Careergo','#compare'],['FAQ','#faq']].map(([l,p]) => (
              <div key={l} style={{ marginBottom: 8 }}><Link to={p} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{l}</Link></div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Contact</div>
            <a href="mailto:hello@kazikit.co.ke" style={{ fontSize: 13, color: 'var(--ochre)', fontWeight: 700 }}>hello@kazikit.co.ke</a>
            <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Nairobi, Kenya 🇰🇪</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2025 KaziKit · No subscription · CV download Ksh 70</span>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['Sign up','/signup'],['Log in','/login'],['Contact','mailto:hello@kazikit.co.ke']].map(([l,p]) => (
              <Link key={l} to={p} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}