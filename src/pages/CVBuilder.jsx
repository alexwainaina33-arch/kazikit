import { useState, useEffect, useRef, useCallback } from 'react'
import { pb } from '../api/pocketbase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// ── Templates ────────────────────────────────────────────────────
const TEMPLATES = {
  modern:  { label: 'Modern',  accent: '#1D6A3A', hbg: '#1D6A3A', dark: false },
  classic: { label: 'Classic', accent: '#1A4F8A', hbg: '#ffffff', dark: false },
  bold:    { label: 'Bold',    accent: '#C17B2A', hbg: '#1A1814', dark: true  },
  executive:{ label: 'Executive', accent: '#2C2C2C', hbg: '#2C2C2C', dark: true },
}

// ── Section definitions ───────────────────────────────────────────
const SECTION_DEFS = {
  summary:        { label: 'Profile Summary',      icon: '👤', color: '#E8F5ED', tc: '#1D6A3A' },
  experience:     { label: 'Work Experience',      icon: '💼', color: '#E8F0FB', tc: '#1A4F8A' },
  education:      { label: 'Education',            icon: '🎓', color: '#FEF3E2', tc: '#C17B2A' },
  skills:         { label: 'Skills',               icon: '⚡', color: '#E8F5ED', tc: '#1D6A3A' },
  certifications: { label: 'Certifications',       icon: '📜', color: '#E8F0FB', tc: '#1A4F8A' },
  languages:      { label: 'Languages',            icon: '🌐', color: '#FEF3E2', tc: '#C17B2A' },
  achievements:   { label: 'Achievements & Awards',icon: '🏆', color: '#FEF3E2', tc: '#C17B2A' },
  referees:       { label: 'Referees',             icon: '👥', color: '#E8F5ED', tc: '#1D6A3A' },
}

const DEFAULT_ORDER   = ['summary','experience','education','skills','certifications','languages','achievements','referees']
const DEFAULT_VISIBLE = new Set(['summary','experience','education','skills','referees'])

const EMPTY = {
  full_name: '', job_title: '', email: '', phone: '',
  location: 'Nairobi, Kenya', linkedin: '', website: '',
  photo: null, // base64 string
  summary: '',
  experience:     [{ company:'', role:'', duration:'', description:'' }],
  education:      [{ school:'', degree:'', year:'', grade:'' }],
  skills:         [],
  certifications: [{ title:'', issuer:'', year:'', link:'' }],
  languages:      [{ language:'', proficiency:'Fluent' }],
  achievements:   [{ text:'' }],
  referees:       [{ name:'', title:'', company:'', phone:'', email:'' }],
  refereesOnRequest: false,
  template:       'modern',
  sectionOrder:   [...DEFAULT_ORDER],
  hiddenSections: [],
  accentColor:    null, // custom override
}

// ── Tiny helpers ─────────────────────────────────────────────────
const inp = { width:'100%', padding:'7px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', outline:'none' }
const Lbl = ({children, style}) => <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:6,marginTop:14,...style}}>{children}</div>
const Fld = ({label, children, half}) => <div style={{marginBottom:8,flex:half?'1':'unset'}}><label style={{fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:3,display:'block'}}>{label}</label>{children}</div>
const Blk = ({children, dragging}) => <div style={{border:`1.5px solid ${dragging?'var(--green)':'var(--border)'}`,borderRadius:8,padding:10,marginBottom:8,background:'var(--surface2)',transition:'border-color .15s'}}>{children}</div>
const Abtn = ({onClick,label='+ Add entry'}) => <button onClick={onClick} style={{fontSize:12,color:'var(--green)',background:'var(--green-light)',border:'1px solid #A8D5B8',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>{label}</button>
const Rbtn = ({onClick}) => <div style={{display:'flex',justifyContent:'flex-end',marginBottom:4}}><button onClick={onClick} style={{fontSize:11,color:'var(--red)',background:'#FDEAEA',border:'none',borderRadius:5,padding:'3px 8px',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>✕ Remove</button></div>

// ── Drag-to-reorder hook ─────────────────────────────────────────
function useDragSort(items, onReorder) {
  const dragIdx = useRef(null)
  const [overIdx, setOverIdx] = useState(null)

  const onDragStart = (i) => { dragIdx.current = i }
  const onDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i) }
  const onDrop      = (e, i) => {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === i) { dragIdx.current = null; setOverIdx(null); return }
    const arr = [...items]
    const [moved] = arr.splice(dragIdx.current, 1)
    arr.splice(i, 0, moved)
    onReorder(arr)
    dragIdx.current = null
    setOverIdx(null)
  }
  const onDragEnd = () => { dragIdx.current = null; setOverIdx(null) }

  return { onDragStart, onDragOver, onDrop, onDragEnd, overIdx }
}

export default function CVBuilder() {
  const { user } = useAuth()
  const [cv, setCv]         = useState(EMPTY)
  const [cvId, setCvId]     = useState(null)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('summary')
  const [ski, setSki]       = useState('')
  const fileRef             = useRef(null)

  // Load saved CV
  useEffect(() => {
    pb.collection('kk_cvs').getFirstListItem(`user="${user.id}"`).then(r => {
      setCvId(r.id)
      setCv({
        ...EMPTY, ...r,
        experience:     r.experience?.length     ? r.experience     : EMPTY.experience,
        education:      r.education?.length      ? r.education      : EMPTY.education,
        skills:         r.skills?.length         ? r.skills         : [],
        certifications: r.certifications?.length ? r.certifications : EMPTY.certifications,
        languages:      r.languages?.length      ? r.languages      : EMPTY.languages,
        achievements:   r.achievements?.length   ? r.achievements   : EMPTY.achievements,
        referees:       r.referees?.length       ? r.referees       : EMPTY.referees,
        sectionOrder:   r.sectionOrder?.length   ? r.sectionOrder   : [...DEFAULT_ORDER],
        hiddenSections: r.hiddenSections         ? r.hiddenSections : [],
      })
    }).catch(() => {})
  }, [user.id])

  // Helpers
  const s   = (k, v) => setCv(c => ({...c, [k]: v}))
  const u   = (key, i, f, v) => setCv(c => { const a=[...c[key]]; a[i]={...a[i],[f]:v}; return {...c,[key]:a} })
  const add = (key, blank) => setCv(c => ({...c, [key]: [...c[key], blank]}))
  const rem = (key, i)     => setCv(c => ({...c, [key]: c[key].filter((_,j)=>j!==i)}))
  const addSkill = () => { const v=ski.trim(); if(v&&!cv.skills.includes(v)) setCv(c=>({...c,skills:[...c.skills,v]})); setSki('') }

  const isHidden  = id => (cv.hiddenSections||[]).includes(id)
  const toggleHide = id => setCv(c => ({
    ...c, hiddenSections: isHidden(id)
      ? (c.hiddenSections||[]).filter(x=>x!==id)
      : [...(c.hiddenSections||[]), id]
  }))

  // Photo upload — convert to base64
  const handlePhoto = e => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500000) return toast.error('Photo must be under 500KB')
    const reader = new FileReader()
    reader.onload = ev => s('photo', ev.target.result)
    reader.readAsDataURL(file)
  }

  // Section drag reorder
  const { onDragStart, onDragOver, onDrop, onDragEnd, overIdx } = useDragSort(
    cv.sectionOrder || DEFAULT_ORDER,
    (newOrder) => s('sectionOrder', newOrder)
  )

  // Save
  const save = async () => {
    if (!cv.full_name) return toast.error('Enter your full name first')
    setSaving(true)
    try {
      const d = {...cv, user: user.id}
      if (cvId) await pb.collection('kk_cvs').update(cvId, d)
      else { const r = await pb.collection('kk_cvs').create(d); setCvId(r.id) }
      toast.success('CV saved!')
    } catch { toast.error('Could not save') } finally { setSaving(false) }
  }

  const sectionOrder = cv.sectionOrder || DEFAULT_ORDER

  return (
    <div>
      <style>{`
        @media print {
          body > * { display: none !important }
          #cvprint { display: block !important; position: fixed; inset: 0; z-index: 9999; background: white; overflow: auto; }
        }
        .drag-item { cursor: grab; }
        .drag-item:active { cursor: grabbing; }
        .sec-btn:hover { background: var(--green-light) !important; }
      `}</style>

      {/* ── TOOLBAR ──────────────────────────────────────── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <div className="page-title">CV Builder</div>
          <p className="page-sub" style={{marginBottom:0}}>
            {preview ? 'Previewing your CV' : 'Click a section → edit → drag to reorder → download PDF'}
          </p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={()=>setPreview(p=>!p)} className="btn-outline" style={{fontSize:13,padding:'8px 14px'}}>
            {preview ? '✏️ Back to editor' : '👁 Full preview'}
          </button>
          <button onClick={save} className="btn-primary" style={{fontSize:13,padding:'8px 14px'}} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save CV'}
          </button>
          <button onClick={()=>{setPreview(true);setTimeout(()=>window.print(),400)}} className="btn-amber" style={{fontSize:13,padding:'8px 14px'}}>
            🖨️ Print / PDF  <span style={{fontSize:11,opacity:.7,marginLeft:4}}>Ksh 70</span>
          </button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns: preview ? '1fr' : '1fr 1.2fr', gap:16, alignItems:'start'}}>

        {/* ── LEFT PANEL ───────────────────────────────── */}
        {!preview && (
          <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:'calc(100vh - 160px)',overflowY:'auto',paddingRight:4}}>

            {/* Template + colour */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:14}}>
              <Lbl style={{marginTop:0}}>Template</Lbl>
              <div style={{display:'flex',gap:6,marginBottom:10}}>
                {Object.entries(TEMPLATES).map(([k,t]) => (
                  <button key={k} onClick={()=>s('template',k)} style={{
                    flex:1, padding:'8px 4px', borderRadius:8, fontSize:11, fontWeight:700,
                    cursor:'pointer', fontFamily:'inherit',
                    border:`2px solid ${cv.template===k ? t.accent : 'var(--border)'}`,
                    background: cv.template===k ? `${t.accent}18` : 'var(--surface2)',
                    color: cv.template===k ? t.accent : 'var(--text3)',
                  }}>
                    {k==='modern'?'🎨':k==='classic'?'📋':k==='bold'?'💪':'👔'}<br/>{t.label}
                  </button>
                ))}
              </div>
              <Lbl style={{marginTop:4}}>Custom accent colour</Lbl>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {['#1D6A3A','#1A4F8A','#C17B2A','#B83232','#6B4EBF','#0D7A8A','#2C2C2C'].map(col=>(
                  <div key={col} onClick={()=>s('accentColor',col)} style={{
                    width:24,height:24,borderRadius:'50%',background:col,cursor:'pointer',
                    border:`3px solid ${cv.accentColor===col?'white':'transparent'}`,
                    outline:`2px solid ${cv.accentColor===col?col:'transparent'}`,
                    transition:'all .15s',
                  }} />
                ))}
                <input type="color" value={cv.accentColor || TEMPLATES[cv.template]?.accent} onChange={e=>s('accentColor',e.target.value)}
                  style={{width:28,height:28,borderRadius:6,border:'1px solid var(--border)',cursor:'pointer',padding:2}} />
                {cv.accentColor && <button onClick={()=>s('accentColor',null)} style={{fontSize:11,color:'var(--text3)',background:'none',border:'none',cursor:'pointer'}}>Reset</button>}
              </div>
            </div>

            {/* Photo + contact */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:14}}>
              <Lbl style={{marginTop:0}}>📸 Photo & Contact</Lbl>
              {/* Photo upload */}
              <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
                <div
                  onClick={()=>fileRef.current?.click()}
                  style={{width:72,height:72,borderRadius:'50%',border:'2px dashed var(--border)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,background:'var(--surface2)',transition:'border-color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--green)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  {cv.photo
                    ? <img src={cv.photo} alt="CV" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    : <div style={{textAlign:'center',padding:4}}><div style={{fontSize:20}}>📷</div><div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>Click to upload</div></div>
                  }
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:4}}>Passport/ID photo</div>
                  <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.5,marginBottom:6}}>Square photo recommended. Under 500KB. Shows in Modern & Executive templates.</div>
                  {cv.photo && <button onClick={()=>s('photo',null)} style={{fontSize:11,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:0}}>✕ Remove photo</button>}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}} />

              {/* Contact fields */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div style={{gridColumn:'1/-1'}}><Fld label="Full name *"><input style={inp} value={cv.full_name} onChange={e=>s('full_name',e.target.value)} placeholder="Jane Wanjiku Kamau" /></Fld></div>
                <div style={{gridColumn:'1/-1'}}><Fld label="Job title"><input style={inp} value={cv.job_title} onChange={e=>s('job_title',e.target.value)} placeholder="Marketing Officer" /></Fld></div>
                <Fld label="Email"><input style={inp} value={cv.email} onChange={e=>s('email',e.target.value)} placeholder="you@gmail.com" /></Fld>
                <Fld label="Phone"><input style={inp} value={cv.phone} onChange={e=>s('phone',e.target.value)} placeholder="+254 7XX XXX XXX" /></Fld>
                <Fld label="Location"><input style={inp} value={cv.location} onChange={e=>s('location',e.target.value)} placeholder="Nairobi, Kenya" /></Fld>
                <Fld label="LinkedIn"><input style={inp} value={cv.linkedin} onChange={e=>s('linkedin',e.target.value)} placeholder="linkedin.com/in/jane" /></Fld>
              </div>
            </div>

            {/* Section manager — DRAG TO REORDER */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:14}}>
              <Lbl style={{marginTop:0}}>⠿ Sections — drag to reorder</Lbl>
              <p style={{fontSize:11,color:'var(--text3)',marginBottom:10,lineHeight:1.5}}>Drag sections up/down to reorder them on your CV. Click to edit. Eye to hide.</p>
              {sectionOrder.map((id, i) => {
                const def = SECTION_DEFS[id]
                const isActive = activeSection === id
                const hidden = isHidden(id)
                const isOver = overIdx === i
                return (
                  <div
                    key={id}
                    className="drag-item"
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={e => onDragOver(e, i)}
                    onDrop={e => onDrop(e, i)}
                    onDragEnd={onDragEnd}
                    onClick={() => { setActiveSection(id) }}
                    style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'8px 10px', borderRadius:8, marginBottom:4,
                      background: isActive ? def.color : isOver ? 'var(--green-light)' : 'var(--surface2)',
                      border:`1.5px solid ${isActive ? def.tc : isOver ? 'var(--green)' : 'var(--border)'}`,
                      cursor:'pointer', opacity: hidden ? 0.45 : 1,
                      transition:'all .15s',
                    }}
                  >
                    <span style={{fontSize:16,color:'var(--text3)',cursor:'grab',flexShrink:0}}>⠿</span>
                    <span style={{fontSize:16,flexShrink:0}}>{def.icon}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:isActive?700:500,color:isActive?def.tc:'var(--text)'}}>{def.label}</span>
                    <button onClick={e=>{e.stopPropagation();toggleHide(id)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:15,color:hidden?'var(--text3)':'var(--green)',padding:'0 2px',flexShrink:0}} title={hidden?'Show section':'Hide section'}>
                      {hidden ? '🙈' : '👁'}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Active section editor */}
            <div style={{background:'var(--surface)',border:`2px solid ${SECTION_DEFS[activeSection]?.tc || 'var(--border)'}`,borderRadius:12,padding:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                <span style={{fontSize:22}}>{SECTION_DEFS[activeSection]?.icon}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:SECTION_DEFS[activeSection]?.tc}}>Editing: {SECTION_DEFS[activeSection]?.label}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>Click another section above to switch</div>
                </div>
              </div>

              {/* SUMMARY */}
              {activeSection==='summary' && (
                <Fld label="Write your professional summary">
                  <textarea style={{...inp,resize:'vertical',lineHeight:1.7}} rows={5}
                    value={cv.summary}
                    onChange={e=>s('summary',e.target.value)}
                    placeholder="Results-driven marketing professional with 4+ years in FMCG and telco. Led campaigns generating Ksh 12M in revenue. Known for data-led strategy and cross-functional team leadership. Seeking a senior role at a fast-growing East African business."
                  />
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>Tip: 3–5 sentences. Include your years of experience, key skill, and what kind of role you want.</div>
                </Fld>
              )}

              {/* EXPERIENCE */}
              {activeSection==='experience' && <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{cv.experience.length} job{cv.experience.length!==1?'s':''} listed</div>
                  <Abtn onClick={()=>add('experience',{company:'',role:'',duration:'',description:''})} />
                </div>
                {cv.experience.map((e,i)=>(
                  <Blk key={i}>
                    {cv.experience.length>1&&<Rbtn onClick={()=>rem('experience',i)}/>}
                    <Fld label="Company / Organisation"><input style={inp} value={e.company} onChange={ev=>u('experience',i,'company',ev.target.value)} placeholder="Safaricom PLC" /></Fld>
                    <Fld label="Your role / title"><input style={inp} value={e.role} onChange={ev=>u('experience',i,'role',ev.target.value)} placeholder="Senior Marketing Officer" /></Fld>
                    <Fld label="Duration"><input style={inp} value={e.duration} onChange={ev=>u('experience',i,'duration',ev.target.value)} placeholder="Jan 2022 – Present" /></Fld>
                    <Fld label="Key achievements (use • bullet points)">
                      <textarea style={{...inp,fontSize:12,resize:'vertical',lineHeight:1.65}} rows={4}
                        value={e.description}
                        onChange={ev=>u('experience',i,'description',ev.target.value)}
                        placeholder={"• Grew brand awareness by 40% via targeted digital campaigns across 3 counties\n• Managed Ksh 5M quarterly marketing budget with zero overruns\n• Led cross-functional team of 8 to deliver Safaricom Masoko product launch"}
                      />
                    </Fld>
                  </Blk>
                ))}
              </>}

              {/* EDUCATION */}
              {activeSection==='education' && <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{cv.education.length} institution{cv.education.length!==1?'s':''}</div>
                  <Abtn onClick={()=>add('education',{school:'',degree:'',year:'',grade:''})} />
                </div>
                {cv.education.map((e,i)=>(
                  <Blk key={i}>
                    {cv.education.length>1&&<Rbtn onClick={()=>rem('education',i)}/>}
                    <Fld label="Institution / University"><input style={inp} value={e.school} onChange={ev=>u('education',i,'school',ev.target.value)} placeholder="University of Nairobi" /></Fld>
                    <Fld label="Degree / Qualification"><input style={inp} value={e.degree} onChange={ev=>u('education',i,'degree',ev.target.value)} placeholder="BSc. Business Administration (Marketing)" /></Fld>
                    <div style={{display:'flex',gap:8}}>
                      <Fld label="Year" half><input style={inp} value={e.year} onChange={ev=>u('education',i,'year',ev.target.value)} placeholder="2021" /></Fld>
                      <Fld label="Grade / Classification" half><input style={inp} value={e.grade||''} onChange={ev=>u('education',i,'grade',ev.target.value)} placeholder="Upper Second Class" /></Fld>
                    </div>
                  </Blk>
                ))}
              </>}

              {/* SKILLS */}
              {activeSection==='skills' && <>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10,minHeight:36}}>
                  {cv.skills.length===0 && <span style={{fontSize:12,color:'var(--text3)',fontStyle:'italic'}}>No skills added yet. Type below and press Enter.</span>}
                  {cv.skills.map((sk,i)=>(
                    <span key={i} style={{display:'inline-flex',alignItems:'center',gap:5,background:'var(--green-light)',color:'var(--green)',padding:'4px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>
                      {sk}
                      <button onClick={()=>setCv(c=>({...c,skills:c.skills.filter((_,j)=>j!==i)}))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--green)',fontSize:14,padding:0,lineHeight:1}}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{display:'flex',gap:6,marginBottom:8}}>
                  <input style={{...inp,flex:1}} value={ski} onChange={e=>setSki(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="Type a skill and press Enter..." />
                  <button onClick={addSkill} className="btn-primary" style={{padding:'6px 14px',fontSize:13,flexShrink:0}}>Add</button>
                </div>
                <div style={{marginTop:8}}>
                  <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>Quick-add common skills:</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {['Microsoft Excel','PowerPoint','Google Workspace','Swahili','English','French','Python','SQL','Canva','QuickBooks','Salesforce','Project Management','Team Leadership','Data Analysis','Customer Service'].filter(s=>!cv.skills.includes(s)).slice(0,10).map(s=>(
                      <button key={s} onClick={()=>setCv(c=>({...c,skills:[...c.skills,s]}))} style={{fontSize:11,color:'var(--text2)',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:5,padding:'3px 8px',cursor:'pointer',fontFamily:'inherit'}}>
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>}

              {/* CERTIFICATIONS */}
              {activeSection==='certifications' && <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{cv.certifications.length} certification{cv.certifications.length!==1?'s':''}</div>
                  <Abtn onClick={()=>add('certifications',{title:'',issuer:'',year:'',link:''})} />
                </div>
                {cv.certifications.map((c,i)=>(
                  <Blk key={i}>
                    {cv.certifications.length>1&&<Rbtn onClick={()=>rem('certifications',i)}/>}
                    <Fld label="Certificate / Course name"><input style={inp} value={c.title} onChange={ev=>u('certifications',i,'title',ev.target.value)} placeholder="Google Project Management Certificate" /></Fld>
                    <div style={{display:'flex',gap:8}}>
                      <Fld label="Issuing body" half><input style={inp} value={c.issuer} onChange={ev=>u('certifications',i,'issuer',ev.target.value)} placeholder="Coursera / Google" /></Fld>
                      <Fld label="Year" half><input style={inp} value={c.year} onChange={ev=>u('certifications',i,'year',ev.target.value)} placeholder="2024" /></Fld>
                    </div>
                  </Blk>
                ))}
              </>}

              {/* LANGUAGES */}
              {activeSection==='languages' && <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{cv.languages.length} language{cv.languages.length!==1?'s':''}</div>
                  <Abtn onClick={()=>add('languages',{language:'',proficiency:'Fluent'})} />
                </div>
                {cv.languages.map((l,i)=>(
                  <Blk key={i}>
                    {cv.languages.length>1&&<Rbtn onClick={()=>rem('languages',i)}/>}
                    <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
                      <Fld label="Language" half><input style={inp} value={l.language} onChange={ev=>u('languages',i,'language',ev.target.value)} placeholder="Swahili" /></Fld>
                      <Fld label="Proficiency" half>
                        <select style={inp} value={l.proficiency} onChange={ev=>u('languages',i,'proficiency',ev.target.value)}>
                          {['Native / Mother tongue','Fluent','Advanced','Intermediate','Basic'].map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                      </Fld>
                    </div>
                  </Blk>
                ))}
              </>}

              {/* ACHIEVEMENTS */}
              {activeSection==='achievements' && <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{cv.achievements.length} achievement{cv.achievements.length!==1?'s':''}</div>
                  <Abtn onClick={()=>add('achievements',{text:''})} />
                </div>
                {cv.achievements.map((a,i)=>(
                  <Blk key={i}>
                    {cv.achievements.length>1&&<Rbtn onClick={()=>rem('achievements',i)}/>}
                    <Fld label={`Achievement ${i+1}`}>
                      <input style={inp} value={a.text} onChange={ev=>u('achievements',i,'text',ev.target.value)} placeholder="Employee of the Year 2023 — Equity Bank Kenya" />
                    </Fld>
                  </Blk>
                ))}
              </>}

              {/* REFEREES */}
              {activeSection==='referees' && <>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,padding:'10px 12px',background:'var(--surface2)',borderRadius:8}}>
                  <input type="checkbox" id="refReq" checked={cv.refereesOnRequest||false} onChange={e=>s('refereesOnRequest',e.target.checked)} style={{width:16,height:16,cursor:'pointer'}} />
                  <label htmlFor="refReq" style={{fontSize:13,cursor:'pointer',fontWeight:500}}>
                    Show "References available on request" instead of full details
                  </label>
                </div>
                {!cv.refereesOnRequest && <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{fontSize:12,color:'var(--text2)'}}>{cv.referees.length} referee{cv.referees.length!==1?'s':''} — 2 referees recommended</div>
                    <Abtn onClick={()=>add('referees',{name:'',title:'',company:'',phone:'',email:''})} />
                  </div>
                  {cv.referees.map((r,i)=>(
                    <Blk key={i}>
                      {cv.referees.length>1&&<Rbtn onClick={()=>rem('referees',i)}/>}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <Fld label="Full name"><input style={inp} value={r.name} onChange={ev=>u('referees',i,'name',ev.target.value)} placeholder="Dr. James Mwangi" /></Fld>
                        <Fld label="Job title"><input style={inp} value={r.title} onChange={ev=>u('referees',i,'title',ev.target.value)} placeholder="Head of Marketing" /></Fld>
                        <Fld label="Company / Organisation"><input style={inp} value={r.company} onChange={ev=>u('referees',i,'company',ev.target.value)} placeholder="Equity Bank Kenya" /></Fld>
                        <Fld label="Phone number"><input style={inp} value={r.phone} onChange={ev=>u('referees',i,'phone',ev.target.value)} placeholder="+254 7XX XXX XXX" /></Fld>
                        <div style={{gridColumn:'1/-1'}}><Fld label="Email address"><input style={inp} value={r.email} onChange={ev=>u('referees',i,'email',ev.target.value)} placeholder="j.mwangi@equitybank.co.ke" /></Fld></div>
                      </div>
                    </Blk>
                  ))}
                </>}
                {cv.refereesOnRequest && (
                  <div style={{background:'var(--green-light)',border:'1px solid #A8D5B8',borderRadius:8,padding:'10px 14px',fontSize:13,color:'var(--green)',fontStyle:'italic'}}>
                    ✓ Your CV will show: <strong>"References available upon request"</strong>
                  </div>
                )}
              </>}
            </div>
          </div>
        )}

        {/* ── RIGHT: CV PREVIEW ─────────────────────────── */}
        <div id="cvprint" style={{position:'sticky',top:20}}>
          <CVPreview cv={cv} />
        </div>
      </div>
    </div>
  )
}

// ── CV PREVIEW COMPONENT ─────────────────────────────────────────
export function CVPreview({ cv }) {
  const template  = cv.template || 'modern'
  const baseT     = TEMPLATES[template] || TEMPLATES.modern
  const accent    = cv.accentColor || baseT.accent
  const hbg       = template === 'executive' ? cv.accentColor || '#2C2C2C'
                  : template === 'bold'      ? '#1A1814'
                  : template === 'classic'   ? '#ffffff'
                  : accent
  const isDark    = template === 'bold' || template === 'executive'
  const hiddenSet = new Set(cv.hiddenSections || [])
  const order     = cv.sectionOrder || DEFAULT_ORDER
  const showPhoto = cv.photo && (template === 'modern' || template === 'executive')

  // Section heading style per template
  const SH = () => {
    if (template === 'classic') return { fontFamily:'Georgia,serif', fontSize:13, fontWeight:700, color:accent, borderBottom:`1.5px solid ${accent}`, paddingBottom:4, marginBottom:10 }
    if (template === 'bold' || template === 'executive') return { fontSize:9, fontWeight:800, color:accent, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10, paddingBottom:4, borderBottom:`1px solid ${accent}40` }
    return { fontSize:9, fontWeight:800, color:accent, textTransform:'uppercase', letterSpacing:'1px', borderBottom:`2px solid ${accent}`, paddingBottom:3, marginBottom:10 }
  }
  const sh = SH()

  const skillStyle = {
    modern:   { background:`${accent}18`, color:accent, borderRadius:20, padding:'3px 10px' },
    classic:  { background:'transparent', color:accent, border:`1px solid ${accent}`, borderRadius:2, padding:'2px 8px' },
    bold:     { background:'#2a2a2a', color:accent, borderRadius:3, padding:'3px 10px', borderLeft:`3px solid ${accent}` },
    executive:{ background:'#333', color:accent, borderRadius:3, padding:'3px 10px', borderLeft:`3px solid ${accent}` },
  }[template] || {}

  const renderSection = (id) => {
    if (hiddenSet.has(id)) return null

    switch(id) {
      case 'summary':
        return cv.summary ? (
          <div key="summary" style={{marginBottom:16}}>
            <div style={sh}>Profile</div>
            <p style={{fontSize:11,lineHeight:1.85,color:isDark?'#ccc':'#444'}}>{cv.summary}</p>
          </div>
        ) : null

      case 'experience':
        return cv.experience?.some(e=>e.company) ? (
          <div key="exp" style={{marginBottom:16}}>
            <div style={sh}>Work Experience</div>
            {cv.experience.filter(e=>e.company).map((e,i)=>(
              <div key={i} style={{marginBottom:13}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:1}}>
                  <span style={{fontWeight:800,fontSize:12,color:isDark?'#eee':'#1a1a1a'}}>{e.role}</span>
                  <span style={{fontSize:10,color:isDark?'#888':'#999',whiteSpace:'nowrap',marginLeft:8,flexShrink:0}}>{e.duration}</span>
                </div>
                <div style={{color:accent,fontSize:11,fontWeight:700,marginBottom:4}}>{e.company}</div>
                {e.description&&<div style={{fontSize:11,color:isDark?'#bbb':'#555',lineHeight:1.7,whiteSpace:'pre-line'}}>{e.description}</div>}
              </div>
            ))}
          </div>
        ) : null

      case 'education':
        return cv.education?.some(e=>e.school) ? (
          <div key="edu" style={{marginBottom:16}}>
            <div style={sh}>Education</div>
            {cv.education.filter(e=>e.school).map((e,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:9}}>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:isDark?'#eee':'#1a1a1a'}}>{e.degree}</div>
                  <div style={{fontSize:11,color:isDark?'#aaa':'#666'}}>{e.school}</div>
                  {e.grade&&<div style={{fontSize:10,color:accent,fontWeight:600}}>{e.grade}</div>}
                </div>
                <div style={{fontSize:10,color:isDark?'#888':'#888',flexShrink:0,marginLeft:8}}>{e.year}</div>
              </div>
            ))}
          </div>
        ) : null

      case 'skills':
        return cv.skills?.length > 0 ? (
          <div key="skills" style={{marginBottom:16}}>
            <div style={sh}>Skills</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {cv.skills.map((sk,i)=>(
                <span key={i} style={{fontSize:11,fontWeight:600,...skillStyle}}>{sk}</span>
              ))}
            </div>
          </div>
        ) : null

      case 'certifications':
        return cv.certifications?.some(c=>c.title) ? (
          <div key="certs" style={{marginBottom:16}}>
            <div style={sh}>Certifications</div>
            {cv.certifications.filter(c=>c.title).map((c,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:7}}>
                <div>
                  <div style={{fontWeight:700,fontSize:11.5,color:isDark?'#eee':'#1a1a1a'}}>{c.title}</div>
                  {c.issuer&&<div style={{fontSize:10,color:isDark?'#aaa':'#777'}}>{c.issuer}</div>}
                </div>
                <div style={{fontSize:10,color:isDark?'#888':'#888',flexShrink:0,marginLeft:8}}>{c.year}</div>
              </div>
            ))}
          </div>
        ) : null

      case 'languages':
        return cv.languages?.some(l=>l.language) ? (
          <div key="langs" style={{marginBottom:16}}>
            <div style={sh}>Languages</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:16}}>
              {cv.languages.filter(l=>l.language).map((l,i)=>(
                <div key={i}>
                  <span style={{fontSize:12,fontWeight:700,color:isDark?'#eee':'#333'}}>{l.language}</span>
                  <span style={{fontSize:10,color:isDark?'#888':'#888',marginLeft:4}}>{l.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null

      case 'achievements':
        return cv.achievements?.some(a=>a.text) ? (
          <div key="ach" style={{marginBottom:16}}>
            <div style={sh}>Achievements & Awards</div>
            {cv.achievements.filter(a=>a.text).map((a,i)=>(
              <div key={i} style={{display:'flex',gap:8,marginBottom:7,alignItems:'flex-start'}}>
                <span style={{color:accent,fontWeight:800,fontSize:12,flexShrink:0,marginTop:1}}>★</span>
                <span style={{fontSize:11,color:isDark?'#bbb':'#444',lineHeight:1.6}}>{a.text}</span>
              </div>
            ))}
          </div>
        ) : null

      case 'referees':
        return (
          <div key="refs" style={{marginBottom:16}}>
            <div style={sh}>References</div>
            {cv.refereesOnRequest ? (
              <p style={{fontSize:11,color:isDark?'#aaa':'#666',fontStyle:'italic'}}>References available upon request.</p>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:cv.referees?.filter(r=>r.name).length>1?'1fr 1fr':'1fr',gap:16}}>
                {cv.referees?.filter(r=>r.name).map((r,i)=>(
                  <div key={i}>
                    <div style={{fontWeight:800,fontSize:12,color:isDark?'#eee':'#1a1a1a'}}>{r.name}</div>
                    {r.title&&<div style={{fontSize:11,color:accent,fontWeight:600}}>{r.title}</div>}
                    {r.company&&<div style={{fontSize:11,color:isDark?'#aaa':'#666'}}>{r.company}</div>}
                    {r.phone&&<div style={{fontSize:10,color:isDark?'#888':'#888'}}>{r.phone}</div>}
                    {r.email&&<div style={{fontSize:10,color:isDark?'#888':'#888'}}>{r.email}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      default: return null
    }
  }

  return (
    <div style={{background:'white',maxWidth:720,margin:'0 auto',boxShadow:'0 8px 32px rgba(0,0,0,0.15)',borderRadius:4,overflow:'hidden',fontFamily:"Georgia,'Times New Roman',serif"}}>

      {/* ── HEADER ── */}
      {template === 'classic' ? (
        <div style={{padding:'32px 44px 18px',borderBottom:`3px solid ${accent}`,background:'white'}}>
          <div style={{display:'flex',gap:18,alignItems:'flex-start'}}>
            {showPhoto&&<img src={cv.photo} alt="" style={{width:72,height:72,borderRadius:4,objectFit:'cover',border:`2px solid ${accent}`,flexShrink:0}} />}
            <div style={{flex:1}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:700,color:'#1a1a1a',marginBottom:3}}>{cv.full_name||'Your Name'}</div>
              {cv.job_title&&<div style={{fontSize:13,color:accent,fontWeight:700,marginBottom:10}}>{cv.job_title}</div>}
              <div style={{display:'flex',gap:14,fontSize:10,color:'#666',flexWrap:'wrap'}}>
                {cv.email&&<span>✉ {cv.email}</span>}
                {cv.phone&&<span>☏ {cv.phone}</span>}
                {cv.location&&<span>⌖ {cv.location}</span>}
                {cv.linkedin&&<span>⊞ {cv.linkedin}</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{background:hbg,padding:'28px 44px 24px'}}>
          <div style={{display:'flex',gap:18,alignItems:'flex-start'}}>
            {showPhoto&&(
              <img src={cv.photo} alt="" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',border:'3px solid rgba(255,255,255,0.4)',flexShrink:0}} />
            )}
            <div style={{flex:1}}>
              <div style={{fontFamily:template==='bold'||template==='executive'?'DM Sans,sans-serif':"Fraunces,Georgia,serif",fontSize:28,fontWeight:800,color:'white',marginBottom:3,letterSpacing:template==='bold'?'-.5px':'normal'}}>
                {cv.full_name||'Your Name'}
              </div>
              {cv.job_title&&<div style={{fontSize:template==='bold'||template==='executive'?11:12,color:'rgba(255,255,255,.75)',textTransform:template==='bold'||template==='executive'?'uppercase':'none',letterSpacing:template==='bold'||template==='executive'?'1.5px':'0',fontWeight:template==='bold'||template==='executive'?700:400,marginBottom:12}}>{cv.job_title}</div>}
              <div style={{display:'flex',gap:14,fontSize:10,color:'rgba(255,255,255,.65)',flexWrap:'wrap'}}>
                {cv.email&&<span>✉ {cv.email}</span>}
                {cv.phone&&<span>📞 {cv.phone}</span>}
                {cv.location&&<span>📍 {cv.location}</span>}
                {cv.linkedin&&<span>🔗 {cv.linkedin}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BODY: sections rendered in configured order ── */}
      <div style={{padding:'24px 44px 36px',background:isDark?'#111':'white'}}>
        {order.map(id => renderSection(id))}
      </div>
    </div>
  )
}