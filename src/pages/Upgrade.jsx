import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { pb, PRODUCTS, PAYSTACK_PUBLIC_KEY } from '../api/pocketbase'
import toast from 'react-hot-toast'

export default function Upgrade() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(null)
  const [purchases, setPurchases] = useState([])

  useEffect(() => {
    pb.collection('kk_subscriptions')
      .getList(1, 50, { filter: `user = "${user.id}"`, sort: '-created' })
      .then(r => setPurchases(r.items))
      .catch(() => {})
  }, [user.id])

  const hasPurchased = (key) => {
    if (key === 'interview_prep') return purchases.some(p => ['interview_prep','full_kit'].includes(p.plan))
    if (key === 'cv_download') return false   // can always buy again
    if (key === 'cover_letter') return false
    if (key === 'bundle') return false
    if (key === 'full_kit') return purchases.some(p => p.plan === 'full_kit')
    return false
  }

  function pay(productKey) {
    const product = PRODUCTS[productKey]
    setLoading(productKey)
    const handler = window.PaystackPop?.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: product.amount,
      currency: 'KES',
      ref: `kk_${productKey}_${user.id}_${Date.now()}`,
      callback: async res => {
        try {
          await pb.collection('kk_subscriptions').create({
            user: user.id,
            plan: productKey,
            paystack_reference: res.reference,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            active: true,
          })
          toast.success(`✅ ${product.name} unlocked!`)
          setPurchases(prev => [...prev, { plan: productKey }])

          // If CV or bundle download, trigger print
          if (['cv_download','bundle'].includes(productKey)) {
            setTimeout(() => {
              toast('Opening your CV for printing…', { icon: '🖨️' })
              window.dispatchEvent(new CustomEvent('kk_print_cv'))
            }, 1200)
          }
        } catch {
          toast.error('Payment received but activation failed. Email hello@kazikit.co.ke')
        } finally { setLoading(null) }
      },
      onClose: () => { toast('Payment cancelled'); setLoading(null) },
    })
    handler?.openIframe()
  }

  const productList = [
    { ...PRODUCTS.cv_download,   canRepurchase: true },
    { ...PRODUCTS.cover_letter,  canRepurchase: true },
    { ...PRODUCTS.bundle,        canRepurchase: true },
    { ...PRODUCTS.interview_prep },
    { ...PRODUCTS.full_kit },
  ]

  return (
    <div>
      <div className="page-title">Buy What You Need</div>
      <p className="page-sub">No subscription. No monthly charge. Pay once for exactly what you need.</p>

      {/* Test mode */}
      <div style={{ background: 'var(--amber-light)', border: '1px solid #E8C080', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🧪</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)', marginBottom: 2 }}>TEST MODE — no real money charged</div>
          <p style={{ fontSize: 12, color: '#7A5020' }}>Test card: <strong>4084 0840 8408 4081</strong> · Any future expiry · CVV: 408 · PIN: 0000</p>
        </div>
      </div>

      {/* Free reminder */}
      <div style={{ background: 'var(--green-light)', border: '1px solid #A8D5B8', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>These are always free for you</div>
          <div style={{ fontSize: 12, color: '#1D4A2B', marginTop: 2 }}>Build & edit your CV · Live preview · Track 5 applications · Dashboard · Basic interview questions</div>
        </div>
      </div>

      {/* Purchase history */}
      {purchases.length > 0 && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Your purchases</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {purchases.map((p, i) => (
              <span key={i} style={{ background: 'var(--green-light)', color: 'var(--green)', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
                ✓ {PRODUCTS[p.plan]?.name || p.plan}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Products grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, maxWidth: 860 }}>
        {productList.map((product) => {
          const purchased = hasPurchased(product.key)
          const isLoading = loading === product.key
          const isFeatured = product.key === 'full_kit'

          return (
            <div key={product.key} className="card" style={{ border: isFeatured ? '2px solid var(--green)' : '1px solid var(--border)', position: 'relative', background: isFeatured ? 'var(--green)' : 'var(--surface)' }}>
              {product.badge && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: isFeatured ? 'var(--amber)' : 'var(--green)', color: 'white', padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {product.badge}
                </div>
              )}

              <div style={{ fontSize: 28, marginBottom: 10 }}>{product.icon}</div>
              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 32, fontWeight: 700, color: isFeatured ? 'white' : 'var(--green)', marginBottom: 4 }}>
                Ksh {product.price}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isFeatured ? 'rgba(255,255,255,0.9)' : 'var(--text)', marginBottom: 6 }}>{product.name}</div>
              <p style={{ fontSize: 13, color: isFeatured ? 'rgba(255,255,255,0.7)' : 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>{product.desc}</p>

              {/* What's included */}
              {product.key === 'full_kit' && (
                <div style={{ marginBottom: 16 }}>
                  {['CV Download (Ksh 70 value)', 'Cover Letter (Ksh 50 value)', 'Interview Prep Forever (Ksh 79 value)', 'Unlimited app tracking'].map(f => (
                    <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{f}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>Total value: Ksh 199 · You pay: Ksh 149 · Save Ksh 50</div>
                </div>
              )}

              {product.key === 'interview_prep' && purchased && (
                <div style={{ background: 'var(--green-light)', border: '1px solid #A8D5B8', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                  ✅ Unlocked — full access active
                </div>
              )}

              <button
                onClick={() => pay(product.key)}
                disabled={isLoading || (purchased && !product.canRepurchase)}
                style={{
                  width: '100%', padding: 12, borderRadius: 8, border: 'none',
                  background: purchased && !product.canRepurchase ? 'rgba(255,255,255,0.2)' : isFeatured ? 'var(--amber)' : 'var(--green)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  cursor: isLoading || (purchased && !product.canRepurchase) ? 'default' : 'pointer',
                  fontFamily: 'inherit', opacity: isLoading ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {isLoading ? 'Opening payment...'
                  : purchased && !product.canRepurchase ? `✓ Already purchased`
                  : product.canRepurchase && purchases.some(p => p.plan === product.key) ? `Download again — Ksh ${product.price}`
                  : `Pay Ksh ${product.price} →`}
              </button>
              <p style={{ fontSize: 11, color: isFeatured ? 'rgba(255,255,255,0.45)' : 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
                M-PESA & card via Paystack
              </p>
            </div>
          )
        })}
      </div>

      {/* Price context */}
      <div style={{ marginTop: 28, maxWidth: 860, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>💡 How KaziKit compares to alternatives</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8, fontSize: 13 }}>
          {[
            { label: 'Careergo (AI CV)', cost: 'Ksh 30', note: 'No tracker, no prep, AI-generated' },
            { label: 'KaziKit CV', cost: 'Ksh 70', note: '9 sections, EA-specific, you write it', green: true },
            { label: 'Human CV writer', cost: 'Ksh 1,000+', note: '2-5 day wait' },
            { label: 'Interview coaching', cost: 'Ksh 2,000+', note: '1 session only' },
          ].map(c => (
            <div key={c.label} style={{ background: c.green ? 'var(--green-light)' : 'var(--surface)', border: `1px solid ${c.green ? 'var(--green)' : 'var(--border)'}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, color: c.green ? 'var(--green)' : 'var(--text)', marginBottom: 2 }}>{c.cost}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.green ? '#1D4A2B' : 'var(--text2)' }}>{c.label}</div>
              <div style={{ fontSize: 11, color: c.green ? '#2D7A3E' : 'var(--text3)' }}>{c.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}