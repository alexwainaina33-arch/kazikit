import { useEffect, useState } from 'react'
import { pb } from '../api/pocketbase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUSES = ['applied','interview','offer','rejected','ghosted']
const SC = { applied:'badge-blue', interview:'badge-amber', offer:'badge-green', rejected:'badge-red', ghosted:'badge-gray' }
const EMPTY = { company:'', role:'', applied_date: new Date().toISOString().split('T')[0], status:'applied', salary_offered:'', contact_name:'', contact_phone:'', notes:'', next_action:'' }

export default function Applications() {
  const { user } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    pb.collection('kk_applications').getList(1, 200, { filter: `user = "${user.id}"`, sort: '-created' })
      .then(r => setApps(r.items)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [user.id])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.company || !form.role) return toast.error('Company and role are required')
    try {
      const data = { ...form, user: user.id }
      if (editing) await pb.collection('kk_applications').update(editing, data)
      else await pb.collection('kk_applications').create(data)
      toast.success(editing ? 'Updated' : 'Application logged!')
      setShowForm(false); setEditing(null); load()
    } catch { toast.error('Could not save') }
  }

  const del = async id => {
    if (!confirm('Delete this application?')) return
    await pb.collection('kk_applications').delete(id)
    toast.success('Deleted'); load()
  }

  const quickStatus = async (id, status) => {
    await pb.collection('kk_applications').update(id, { status })
    setApps(a => a.map(x => x.id === id ? { ...x, status } : x))
  }

  const inp = { width:'100%', padding:'8px 11px', border:'0.5px solid var(--border)', borderRadius:7, fontSize:13, background:'var(--surface)', color:'var(--text)', fontFamily:'inherit' }

  const filtered = apps
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-title">Job Applications</div>
      <p className="page-sub">Track every company you apply to. Never lose track again.</p>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input style={{ ...inp, width:200 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...inp, width:150 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <button className="btn-primary" style={{ marginLeft:'auto' }} onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true) }}>
          + Log application
        </button>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {['all',...STATUSES].map(s => {
          const count = s==='all' ? apps.length : apps.filter(a=>a.status===s).length
          return (
            <button key={s} onClick={() => setFilter(s)} style={{ padding:'5px 12px', borderRadius:20, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${filter===s?'var(--green)':'var(--border)'}`, background:filter===s?'var(--green-light)':'var(--surface)', color:filter===s?'var(--green)':'var(--text2)' }}>
              {s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)} ({count})
            </button>
          )
        })}
      </div>

      {loading ? <div style={{ color:'var(--text2)' }}>Loading...</div> : filtered.length===0 ? (
        <div className="card" style={{ textAlign:'center', padding:48 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
          <div style={{ fontSize:15, color:'var(--text2)', marginBottom:14 }}>No applications here yet</div>
          <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true) }}>Log your first application</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(a => (
            <div key={a.id} className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:10, background:'var(--green-light)', color:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18, fontFamily:'Fraunces,serif', flexShrink:0 }}>
                {a.company.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:15, marginBottom:1 }}>{a.company}</div>
                <div style={{ fontSize:13, color:'var(--text2)' }}>{a.role}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <span className={`badge ${SC[a.status]||'badge-gray'}`} style={{ textTransform:'capitalize', marginBottom:4, display:'inline-block' }}>{a.status}</span>
                {a.applied_date && <div style={{ fontSize:11, color:'var(--text3)' }}>{format(new Date(a.applied_date),'dd MMM yyyy')}</div>}
              </div>
              <select value={a.status} onChange={e => quickStatus(a.id, e.target.value)} style={{ padding:'5px 7px', borderRadius:6, border:'1px solid var(--border)', fontSize:12, cursor:'pointer', fontFamily:'inherit', background:'var(--surface)', color:'var(--text2)' }}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
              <button onClick={() => { setForm({...a}); setEditing(a.id); setShowForm(true) }} style={{ fontSize:18, background:'none', border:'none', cursor:'pointer' }}>✏️</button>
              <button onClick={() => del(a.id)} style={{ fontSize:18, background:'none', border:'none', cursor:'pointer' }}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:24 }} onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="card" style={{ width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:20, marginBottom:18 }}>{editing ? 'Edit application' : 'Log a new application'}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1 / -1' }}><label>Company *</label><input style={inp} value={form.company} onChange={set('company')} placeholder="Safaricom, KCB, USAID..." /></div>
              <div style={{ gridColumn:'1 / -1' }}><label>Role *</label><input style={inp} value={form.role} onChange={set('role')} placeholder="Marketing Officer" /></div>
              <div><label>Date applied</label><input style={inp} type="date" value={form.applied_date} onChange={set('applied_date')} /></div>
              <div><label>Status</label><select style={inp} value={form.status} onChange={set('status')}>{STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></div>
              <div><label>Contact person</label><input style={inp} value={form.contact_name} onChange={set('contact_name')} placeholder="HR Manager name" /></div>
              <div><label>Contact phone</label><input style={inp} value={form.contact_phone} onChange={set('contact_phone')} placeholder="+254 7XX XXX XXX" /></div>
              <div style={{ gridColumn:'1 / -1' }}><label>Next action</label><input style={inp} value={form.next_action} onChange={set('next_action')} placeholder="Follow up by email on Friday" /></div>
              <div style={{ gridColumn:'1 / -1' }}><label>Notes</label><textarea style={{ ...inp, resize:'vertical' }} rows={3} value={form.notes} onChange={set('notes')} placeholder="Any notes..." /></div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button className="btn-primary" onClick={save} style={{ flex:1, justifyContent:'center' }}>{editing ? 'Save changes' : 'Log application'}</button>
              <button className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
