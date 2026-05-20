import { useState, useEffect } from 'react'
import { pb, PAYSTACK_PUBLIC_KEY } from '../api/pocketbase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', desc: 'Formal, measured, suitable for banks and corporates' },
  { value: 'confident',    label: 'Confident',    desc: 'Direct and assertive — good for sales and marketing' },
  { value: 'warm',         label: 'Warm',         desc: 'Friendly and personable — ideal for NGOs and social sectors' },
  { value: 'concise',      label: 'Concise',      desc: 'Short and punchy — for busy tech and startup companies' },
]

export default function CoverLetter() {
  const { user } = useAuth()
  const [cvData, setCvData]         = useState(null)
  const [jobDesc, setJobDesc]       = useState('')
  const [company, setCompany]       = useState('')
  const [role, setRole]             = useState('')
  const [tone, setTone]             = useState('professional')
  const [letter, setLetter]         = useState('')
  const [generating, setGenerating] = useState(false)
  const [paid, setPaid]             = useState(false)
  const [paying, setPaying]         = useState(false)
  const [copied, setCopied]         = useState(false)
  const [wordCount, setWordCount]   = useState(0)

  // Load CV data
  useEffect(() => {
    pb.collection('kk_cvs').getFirstListItem(`user="${user.id}"`)
      .then(r => setCvData(r))
      .catch(() => {})

    // Check if user has already paid for cover letter or full kit
    pb.collection('kk_subscriptions')
      .getList(1, 50, { filter: `user="${user.id}"` })
      .then(r => {
        const hasPaid = r.items.some(p => ['cover_letter','bundle','full_kit'].includes(p.plan))
        if (hasPaid) setPaid(true)
      }).catch(() => {})
  }, [user.id])

  useEffect(() => {
    if (letter) setWordCount(letter.trim().split(/\s+/).length)
  }, [letter])

  // Generate with Claude API
  const generate = async () => {
    if (!jobDesc.trim()) return toast.error('Paste the job description first')
    if (!cvData?.full_name) return toast.error('Fill in your CV first — we need your details to write the letter')

    setGenerating(true)
    setLetter('')

    // Build CV summary for the prompt
    const cvSummary = [
      `Name: ${cvData.full_name}`,
      cvData.job_title ? `Current/Target Role: ${cvData.job_title}` : '',
      cvData.location ? `Location: ${cvData.location}` : '',
      cvData.summary ? `Profile: ${cvData.summary}` : '',
      cvData.experience?.filter(e=>e.company).map(e =>
        `Experience: ${e.role} at ${e.company} (${e.duration || 'dates not specified'}). ${e.description || ''}`
      ).join('\n') || '',
      cvData.education?.filter(e=>e.school).map(e =>
        `Education: ${e.degree} from ${e.school} (${e.year || ''})`
      ).join('\n') || '',
      cvData.skills?.length ? `Skills: ${cvData.skills.join(', ')}` : '',
      cvData.certifications?.filter(c=>c.title).map(c => `Certification: ${c.title} — ${c.issuer || ''}`).join('\n') || '',
      cvData.languages?.filter(l=>l.language).map(l => `Language: ${l.language} (${l.proficiency})`).join(', ') || '',
    ].filter(Boolean).join('\n')

    const toneGuide = {
      professional: 'formal and professional, suitable for a corporate Kenyan employer, third-person references to the company as appropriate',
      confident: 'confident and direct, assertive about achievements, suitable for a sales or marketing role',
      warm: 'warm, genuine, and personable — the tone of someone who cares about the mission, suitable for NGO or development sector',
      concise: 'short, punchy, and direct — no fluff, suitable for a tech or startup company',
    }[tone]

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are an expert career coach specialising in East African job applications, particularly Kenya. You write highly targeted, authentic cover letters that connect a candidate's specific experience to a specific job. 

Rules:
- Write in the CANDIDATE'S voice, first person
- Reference the COMPANY NAME and ROLE specifically — never use generic placeholders
- Pull at least 2-3 specific details from the candidate's CV that directly match the job requirements
- Reference at least 1 specific thing from the job description that shows you read it properly
- For Kenyan context: mention Kenya, Nairobi, or East Africa where relevant and natural
- Length: 3 paragraphs, 200-280 words total
- Tone: ${toneGuide}
- Opening: Do NOT start with "I am writing to apply for..." — find a stronger opening
- Do NOT include the date, address blocks, or "Dear Hiring Manager" — just the letter body starting from the first paragraph
- End with a call to action and sign-off: "Yours sincerely," then the candidate's name on the next line
- Output ONLY the letter text, nothing else, no preamble, no commentary`,
          messages: [{
            role: 'user',
            content: `Write a cover letter using this information:

CANDIDATE CV:
${cvSummary}

TARGET COMPANY: ${company || 'the company in the job description'}
TARGET ROLE: ${role || 'the role in the job description'}

JOB DESCRIPTION:
${jobDesc}

Write the cover letter now.`
          }]
        })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || 'Generation failed')
      }

      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      setLetter(text)
      toast.success('Cover letter generated!')
    } catch (err) {
      console.error(err)
      toast.error('Generation failed — check your connection and try again')
    } finally {
      setGenerating(false)
    }
  }

  // Pay for download
  const payAndDownload = () => {
    setPaying(true)
    const handler = window.PaystackPop?.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: 5000, // Ksh 50
      currency: 'KES',
      ref: `kk_cover_${user.id}_${Date.now()}`,
      callback: async res => {
        try {
          await pb.collection('kk_subscriptions').create({
            user: user.id, plan: 'cover_letter',
            paystack_reference: res.reference,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            active: true,
          })
          setPaid(true)
          toast.success('Unlocked! You can now copy and download your letter.')
        } catch { toast.error('Payment received but unlock failed. Email hello@kazikit.co.ke') }
        finally { setPaying(false) }
      },
      onClose: () => { toast('Payment cancelled'); setPaying(false) },
    })
    handler?.openIframe()
  }

  const copyLetter = () => {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadLetter = () => {
    const blob = new Blob([letter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover_letter_${company || 'application'}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded!')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="page-title">AI Cover Letter</div>
        <p className="page-sub" style={{ marginBottom: 0 }}>
          Paste a job description. Get a professional cover letter in 30 seconds. Ksh 50 to download.
        </p>
      </div>

      {/* Test mode */}
      <div style={{ background: 'var(--ochre-lite)', border: '1px solid var(--ochre)', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, fontSize: 13 }}>
        <span>🧪</span>
        <div>
          <strong style={{ color: 'var(--ochre)' }}>TEST MODE</strong> · Test card: 4084 0840 8408 4081 · Any future expiry · CVV: 408 · PIN: 0000
        </div>
      </div>

      {/* CV missing warning */}
      {!cvData && (
        <div style={{ background: 'var(--sky-lite)', border: '1.5px solid var(--sky)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sky)', marginBottom: 3 }}>Your CV is empty</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              Fill in your CV first — the AI uses your experience, education, and skills to write a personalised letter.{' '}
              <a href="/cv" style={{ color: 'var(--sky)', fontWeight: 700 }}>Go to CV Builder →</a>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: Input panel ──────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Company + role */}
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Job details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label>Company name</label>
                <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="Safaricom PLC" />
              </div>
              <div>
                <label>Role / Position</label>
                <input className="input-field" value={role} onChange={e => setRole(e.target.value)} placeholder="Marketing Officer" />
              </div>
            </div>
          </div>

          {/* Job description */}
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Job description *
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
              Copy and paste the full job posting. The more detail, the better the letter.
            </div>
            <textarea
              className="input-field"
              rows={10}
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              placeholder={`Paste the full job description here...\n\nExample:\nSafaricom is looking for a Marketing Officer to join our Brand team. The successful candidate will manage digital campaigns, work with agency partners, and report on ROI...\n\nKey requirements:\n• 3+ years in marketing\n• Strong data analysis skills\n• Experience with social media management...`}
              style={{ resize: 'vertical', lineHeight: 1.65 }}
            />
            {jobDesc && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{jobDesc.trim().split(/\s+/).length} words pasted</div>}
          </div>

          {/* Tone */}
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Letter tone</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TONE_OPTIONS.map(t => (
                <button key={t.value} onClick={() => setTone(t.value)} style={{
                  padding: '10px 12px', borderRadius: 'var(--radius)', textAlign: 'left',
                  border: `2px solid ${tone === t.value ? 'var(--forest)' : 'var(--border)'}`,
                  background: tone === t.value ? 'var(--green-light)' : 'var(--surface2)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tone === t.value ? 'var(--forest)' : 'var(--ink)', marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* CV preview chip */}
          {cvData && (
            <div style={{ background: 'var(--green-light)', border: '1px solid #A8D5B8', borderRadius: 'var(--radius)', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>Using CV: {cvData.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {cvData.experience?.filter(e=>e.company).length || 0} jobs · {cvData.skills?.length || 0} skills · {cvData.education?.filter(e=>e.school).length || 0} qualifications
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating || !jobDesc.trim()}
            style={{
              width: '100%', padding: '14px', borderRadius: 'var(--radius)',
              background: generating ? 'var(--border)' : 'var(--forest)',
              color: generating ? 'var(--text3)' : 'white',
              fontSize: 15, fontWeight: 700, border: 'none', cursor: generating ? 'wait' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.02em', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            {generating ? (
              <>
                <span style={{ display: 'inline-block', animation: 'pulse-dot 1s infinite' }}>✦</span>
                Writing your cover letter...
              </>
            ) : (
              '✦ Generate cover letter'
            )}
          </button>

          {generating && (
            <div style={{ background: 'var(--cream-dark)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.65 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Claude is reading:</div>
                <div>📄 Your CV — {cvData?.full_name}</div>
                <div>🎯 The job at {company || 'the company'}</div>
                <div>📝 Connecting your experience to their requirements...</div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Output panel ──────────────────────────── */}
        <div style={{ position: 'sticky', top: 20 }}>
          {!letter && !generating && (
            <div style={{ background: 'var(--surface)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)', padding: '60px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 10 }}>Your cover letter will appear here</h3>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 20px' }}>
                Fill in the job details on the left, then click "Generate cover letter". Claude reads your CV and the job description and writes a targeted letter that connects your exact experience to their requirements.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300, margin: '0 auto', fontSize: 13, color: 'var(--text3)' }}>
                <div>✓ References your actual experience</div>
                <div>✓ Mentions the company by name</div>
                <div>✓ Connects your skills to their requirements</div>
                <div>✓ 200–280 words — professional length</div>
              </div>
            </div>
          )}

          {generating && (
            <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 32 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--forest)', animation: 'pulse-dot 1.2s infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest)' }}>Generating your cover letter...</span>
              </div>
              {[90, 70, 80, 60, 75, 50].map((w, i) => (
                <div key={i} style={{ height: 14, background: 'var(--cream-dark)', borderRadius: 3, marginBottom: 10, width: `${w}%`, animation: `fadeIn 0.3s ${i * 0.2}s both` }} />
              ))}
            </div>
          )}

          {letter && (
            <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {/* Letter toolbar */}
              <div style={{ padding: '12px 16px', background: 'var(--cream-dark)', borderBottom: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--forest)' }}>✓ Letter generated</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{wordCount} words</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={generate} disabled={generating} style={{ fontSize: 12, background: 'var(--cream-dark)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--radius)', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    ↻ Regenerate
                  </button>
                  {paid ? (
                    <>
                      <button onClick={copyLetter} style={{ fontSize: 12, background: 'var(--green-light)', border: '1px solid #A8D5B8', color: 'var(--forest)', borderRadius: 'var(--radius)', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                        {copied ? '✓ Copied!' : '📋 Copy'}
                      </button>
                      <button onClick={downloadLetter} style={{ fontSize: 12, background: 'var(--forest)', border: 'none', color: 'white', borderRadius: 'var(--radius)', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                        ⬇ Download
                      </button>
                    </>
                  ) : (
                    <button onClick={payAndDownload} disabled={paying} style={{ fontSize: 12, background: 'var(--ochre)', border: 'none', color: 'white', borderRadius: 'var(--radius)', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                      {paying ? 'Opening...' : '⚡ Unlock — Ksh 50'}
                    </button>
                  )}
                </div>
              </div>

              {/* Letter body */}
              <div style={{ padding: '28px 32px', position: 'relative' }}>
                {/* Blur overlay for unpaid */}
                {!paid && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(transparent, rgba(245,240,230,0.97))', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24 }}>
                    <div style={{ background: 'var(--ochre)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700, marginBottom: 6, cursor: 'pointer' }} onClick={payAndDownload}>
                      ⚡ Pay Ksh 50 to copy & download →
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>M-PESA & card via Paystack</div>
                  </div>
                )}

                {/* Letter content */}
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.9, color: '#2a2a2a', whiteSpace: 'pre-wrap', filter: !paid ? 'blur(0)' : 'none' }}>
                  <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 2 }}>{cvData?.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{cvData?.email} · {cvData?.phone}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                  {company && <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>Hiring Manager</div>}
                  {company && <div style={{ marginBottom: 16, fontSize: 13 }}>{company}</div>}
                  {role && <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 13 }}>RE: Application for {role}</div>}
                  <div style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }} />
                  {letter}
                </div>
              </div>

              {paid && (
                <div style={{ padding: '12px 16px', background: 'var(--green-light)', borderTop: '1px solid #A8D5B8', fontSize: 12, color: 'var(--forest)', fontWeight: 600, textAlign: 'center' }}>
                  ✓ Unlocked — copy or download your letter above · Regenerate as many times as you like
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 24, background: 'var(--cream-dark)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>How it works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
          {[
            { n: '1', title: 'Fill in your CV', desc: 'The AI uses your real experience, skills, and education.' },
            { n: '2', title: 'Paste the job description', desc: 'Copy the full job ad — more detail = better letter.' },
            { n: '3', title: 'Generate free', desc: 'Claude reads both and writes a targeted letter in 30 seconds.' },
            { n: '4', title: 'Pay Ksh 50 to unlock', desc: 'Copy to clipboard or download. Regenerate unlimited times.' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--forest)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}