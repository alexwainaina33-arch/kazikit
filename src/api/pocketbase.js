import PocketBase from 'pocketbase'

export const pb = new PocketBase('https://fieldtrack-kenya.fly.dev')
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

// ── Pay-per-action pricing ──────────────────────────────────────
// No subscription. No monthly. Pay only when you need it.
// Competitor Careergo charges Ksh 30 (AI slop, no tracker, no prep)
// We charge Ksh 70 — human-controlled, EA-specific, full sections
export const PRODUCTS = {
  cv_download: {
    key: 'cv_download',
    name: 'CV Download (PDF)',
    price: 70,
    amount: 7000,           // Paystack amount in cents
    desc: 'Download your CV as a professional PDF',
    icon: '📄',
  },
  cover_letter: {
    key: 'cover_letter',
    name: 'Cover Letter Download',
    price: 50,
    amount: 5000,
    desc: 'Professional cover letter matched to your CV',
    icon: '✉️',
  },
  bundle: {
    key: 'bundle',
    name: 'CV + Cover Letter Bundle',
    price: 99,
    amount: 9900,
    desc: 'Best value — CV PDF + matching cover letter',
    icon: '📦',
    badge: 'BEST VALUE',
  },
  interview_prep: {
    key: 'interview_prep',
    name: 'Interview Prep Unlock',
    price: 79,
    amount: 7900,
    desc: 'Full interview prep — all categories, salary guide, unlimited practice',
    icon: '🎯',
  },
  full_kit: {
    key: 'full_kit',
    name: 'Full Job Hunt Kit',
    price: 149,
    amount: 14900,
    desc: 'CV + Cover Letter + Interview Prep + unlimited applications',
    icon: '🚀',
    badge: 'MOST POPULAR',
  },
}

// What's always free (to hook them in)
export const FREE_FEATURES = [
  'Build and edit your CV (all sections)',
  'Preview your CV live',
  'Track up to 5 applications',
  'Dashboard with stats',
  'Basic interview questions',
]