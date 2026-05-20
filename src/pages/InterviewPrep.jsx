import { useState } from 'react'

const CATS = [
  { name: 'Common EA', icon: '🇰🇪', questions: [
    { q: 'Tell me about yourself', tip: 'Structure: 1 min education, 1 min experience, 30 sec on why this role.' },
    { q: 'Why do you want to work here?', tip: 'Research the company. Mention a specific product or value. Never say "for the salary."' },
    { q: 'What is your greatest weakness?', tip: 'Pick a real weakness but show you are working on it.' },
    { q: 'Where do you see yourself in 5 years?', tip: 'Show ambition but loyalty. "I want to grow within this company and lead a team."' },
    { q: 'Why should we hire you?', tip: 'Name 3 specific skills matching the job description. Be confident.' },
  ]},
  { name: 'Safaricom / Telco', icon: '📡', questions: [
    { q: 'How would you improve M-PESA for rural customers?', tip: 'Think about offline capability, USSD simplicity, agent network gaps.' },
    { q: 'Describe a time you handled a difficult customer', tip: 'Use STAR: Situation, Task, Action, Result. End with what you learned.' },
    { q: 'How do you stay updated with technology trends?', tip: 'Name specific sources: TechCrunch Africa, Disrupt Africa, LinkedIn Learning.' },
  ]},
  { name: 'NGO / Development', icon: '🌍', questions: [
    { q: 'What motivates you to work in development?', tip: 'Be genuine. Share a personal story. Avoid generic "I want to help people."' },
    { q: 'How do you work in resource-constrained environments?', tip: 'Give a real example. NGOs love people who do more with less.' },
    { q: 'How would you handle conflict between community needs and donor requirements?', tip: 'Show you understand both sides. Emphasise communication and escalation.' },
  ]},
  { name: 'Banking (KCB, Equity)', icon: '🏦', questions: [
    { q: 'How do you manage risk in financial transactions?', tip: 'Talk about verification processes, double-checking, escalation.' },
    { q: 'How would you grow our customer base?', tip: 'Think about mobile banking outreach, community events, referrals.' },
    { q: 'Describe a time you met a difficult sales target', tip: 'Banks love numbers. "I exceeded my target by X% by doing Y."' },
  ]},
  { name: 'General', icon: '💼', questions: [
    { q: 'How do you prioritise multiple deadlines?', tip: 'Mention a system — to-do lists, calendar blocking, communicating early.' },
    { q: 'Tell me about a time your team disagreed', tip: 'Show how you listened, found common ground, and moved forward.' },
    { q: 'What is your salary expectation?', tip: 'Research first. Give a range: "Based on my research I expect Ksh X–Y, open to discussing the full package."' },
  ]},
]

export default function InterviewPrep() {
  const [cat, setCat] = useState(0)
  const [open, setOpen] = useState(null)
  const [practicing, setPracticing] = useState(null)
  const [answer, setAnswer] = useState('')

  return (
    <div>
      <div className="page-title">Interview Prep</div>
      <p className="page-sub">Real questions from East African employers — with tips on exactly what to say.</p>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:24 }}>
        {CATS.map((c,i) => (
          <button key={c.name} onClick={() => { setCat(i); setOpen(null) }} style={{ padding:'7px 14px', borderRadius:20, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${cat===i?'var(--green)':'var(--border)'}`, background:cat===i?'var(--green-light)':'var(--surface)', color:cat===i?'var(--green)':'var(--text2)' }}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {CATS[cat].questions.map((item, i) => (
          <div key={i} className="card" style={{ padding:0, overflow:'hidden' }}>
            <button onClick={() => setOpen(open===i?null:i)} style={{ width:'100%', textAlign:'left', padding:'16px 18px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, fontFamily:'inherit' }}>
              <span style={{ fontWeight:500, fontSize:15 }}>{i+1}. {item.q}</span>
              <span style={{ fontSize:18, color:'var(--text3)', transform:open===i?'rotate(90deg)':'none', transition:'transform .2s', flexShrink:0 }}>›</span>
            </button>
            {open===i && (
              <div style={{ padding:'0 18px 18px', borderTop:'1px solid var(--border)' }}>
                <div style={{ background:'var(--green-light)', border:'1px solid #A8D5B8', borderRadius:8, padding:'12px 14px', margin:'14px 0' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--green)', marginBottom:4 }}>💡 HOW TO ANSWER THIS</div>
                  <p style={{ fontSize:14, color:'#1D4A2B', lineHeight:1.6 }}>{item.tip}</p>
                </div>
                {practicing===i ? (
                  <div>
                    <textarea style={{ width:'100%', padding:'8px 11px', border:'0.5px solid var(--border)', borderRadius:7, fontSize:13, fontFamily:'inherit', resize:'vertical', marginBottom:8 }} rows={4} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Write your practice answer here..." />
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn-primary" style={{ fontSize:13, padding:'7px 14px' }} onClick={() => { setPracticing(null); setAnswer('') }}>✅ Done</button>
                      <button className="btn-outline" style={{ fontSize:13, padding:'7px 14px' }} onClick={() => setAnswer('')}>Clear</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-outline" style={{ fontSize:13, padding:'7px 16px' }} onClick={() => { setPracticing(i); setAnswer('') }}>✍️ Practice my answer</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop:28, background:'var(--amber-light)', border:'1px solid #E8C080' }}>
        <h3 style={{ fontFamily:'Fraunces,serif', fontSize:18, color:'var(--amber)', marginBottom:14 }}>Kenya salary ranges 2025</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
          {[['Graduate trainee','Ksh 25,000–50,000'],['Sales / Marketing','Ksh 40,000–80,000'],['Software developer','Ksh 60,000–200,000'],['NGO program officer','Ksh 60,000–120,000'],['Bank relationship manager','Ksh 70,000–150,000'],['HR officer','Ksh 50,000–90,000'],['Accountant / Finance','Ksh 50,000–120,000'],['Customer service','Ksh 30,000–60,000']].map(([role,range]) => (
            <div key={role} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #E8C080', fontSize:13 }}>
              <span>{role}</span><span style={{ fontWeight:600, color:'var(--amber)' }}>{range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
