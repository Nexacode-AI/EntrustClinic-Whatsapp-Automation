'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { setError('Invalid username or password'); return }
      window.location.href = '/analytics'
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f8fafc' }}>

      {/* Left — branding panel */}
      <div
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#14b8a6' }} />
        <div className="absolute bottom-20 -left-20 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: '#0ea5e9' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(20,184,166,0.25)', border: '1px solid rgba(20,184,166,0.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">Entrust Clinic</p>
            <p className="text-teal-400 text-xs">WhatsApp Automation</p>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 text-xs font-medium">System Active</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart clinic<br />management
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Automate appointments, reminders, and patient communication through WhatsApp.
          </p>

          <div className="space-y-4">
            {[
              { label: 'Appointment Booking', desc: 'Patients book via WhatsApp 24/7', color: '#5eead4' },
              { label: 'Smart Reminders', desc: 'Automated confirmations & follow-ups', color: '#38bdf8' },
              { label: 'AI Conversations', desc: 'Claude AI handles patient queries', color: '#a78bfa' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}20`, border: `1px solid ${item.color}30` }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-tight">{item.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs relative z-10">© 2026 Entrust Family Clinic</p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center px-6" style={{ backgroundColor: '#f8fafc' }}>
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-lg">Entrust Clinic</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1.5">Sign in to your dashboard to continue</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="admin"
                  required
                  autoComplete="username"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                  style={{ backgroundColor: '#f8fafc' }}
                  onFocus={(e) => { e.target.style.borderColor = '#14b8a6'; e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.1)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                  style={{ backgroundColor: '#f8fafc' }}
                  onFocus={(e) => { e.target.style.borderColor = '#14b8a6'; e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.1)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ backgroundColor: '#fff1f2', border: '1px solid #fecaca' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white text-sm font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 mt-1"
                style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
              >
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
