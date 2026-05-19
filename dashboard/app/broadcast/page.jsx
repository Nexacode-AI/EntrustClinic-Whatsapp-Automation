'use client'
import { useState } from 'react'
import { api } from '../../lib/api'
import { Megaphone, AlertTriangle, Send, CheckCircle } from 'lucide-react'

const TEMPLATES = [
  { label: 'Clinic Closed', text: 'Dear patient, our clinic will be closed tomorrow due to a public holiday. We apologise for any inconvenience. Please contact us to reschedule your appointment.' },
  { label: 'Appointment Reminder', text: 'Hi! This is a reminder that you have an upcoming appointment at Entrust Family Clinic. Please arrive 10 minutes early. See you soon!' },
  { label: 'Google Review', text: 'Hi! Thank you for visiting Entrust Family Clinic. We hope you had a great experience! Would you mind leaving us a review? It really helps us grow.\n\nhttps://g.page/entrust-clinic/review' },
]

const STATUS_OPTIONS = [
  { value: 'upcoming',  label: 'Upcoming appointments' },
  { value: 'completed', label: 'Completed appointments' },
  { value: '',          label: 'All patients (ever booked)' },
]

const inputCls = 'w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all'

export default function BroadcastPage() {
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState({ status: 'upcoming', date_from: '', date_to: '' })
  const [result, setResult] = useState(null)
  const [sending, setSending] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function send() {
    if (!message.trim()) return alert('Message cannot be empty')
    if (!confirmed) return alert('Please confirm you understand the WhatsApp policy below')
    setSending(true)
    setResult(null)
    try {
      const res = await api.broadcast(message.trim(), {
        status: filter.status || undefined,
        date_from: filter.date_from || undefined,
        date_to: filter.date_to || undefined,
      })
      setResult(res)
    } catch { alert('Broadcast failed — check backend logs') }
    finally { setSending(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone size={20} className="text-brand" />
          <h1 className="text-2xl font-bold text-ink">Broadcast Message</h1>
        </div>
        <p className="text-sm text-ink-secondary ml-7">Send a WhatsApp message to multiple patients at once</p>
      </div>

      {/* Policy warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">WhatsApp Policy</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              WhatsApp only allows free-form messages to patients who have messaged you within the last 24 hours.
              Use broadcast for patients with upcoming appointments. Never send spam — this is how restrictions happen.
            </p>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Quick Templates</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tpl) => (
            <button key={tpl.label} onClick={() => setMessage(tpl.text)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:text-ink hover:border-brand/40 hover:bg-brand/5 transition-all font-medium">
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wider block mb-2">Message *</label>
        <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none transition-all shadow-sm"
        />
        <p className="text-xs text-ink-muted mt-1">{message.length} characters</p>
      </div>

      {/* Filter */}
      <div className="bg-card border border-border rounded-xl p-5 mb-5 shadow-sm">
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-4">Send To</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1">Patient Filter</label>
            <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} className={inputCls}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1">Date From</label>
            <input type="date" value={filter.date_from}
              onChange={(e) => setFilter((f) => ({ ...f, date_from: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-secondary block mb-1">Date To</label>
            <input type="date" value={filter.date_to}
              onChange={(e) => setFilter((f) => ({ ...f, date_to: e.target.value }))} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Confirm */}
      <label className="flex items-start gap-3 mb-5 cursor-pointer p-4 bg-card border border-border rounded-xl shadow-sm">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 rounded border-border accent-brand" />
        <span className="text-sm text-ink-secondary leading-relaxed">
          I understand WhatsApp messaging policies and confirm this message is relevant to the selected patients
        </span>
      </label>

      <button onClick={send} disabled={sending || !message.trim() || !confirmed}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark disabled:opacity-40 transition-all shadow-sm">
        <Send size={15} /> {sending ? 'Sending…' : 'Send Broadcast'}
      </button>

      {result && (
        <div className={`mt-5 p-5 rounded-xl border shadow-sm ${result.failed > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className={result.failed > 0 ? 'text-amber-500' : 'text-emerald-500'} />
            <p className="font-semibold text-ink">Broadcast Complete</p>
          </div>
          <p className="text-sm text-ink-secondary">Sent: <strong className="text-emerald-600">{result.sent}</strong></p>
          {result.failed > 0 && <p className="text-sm text-amber-700 mt-0.5">Failed: <strong>{result.failed}</strong> (outside 24h window or no phone)</p>}
          <p className="text-xs text-ink-muted mt-2">Total matched: {result.total} patients</p>
        </div>
      )}
    </div>
  )
}
