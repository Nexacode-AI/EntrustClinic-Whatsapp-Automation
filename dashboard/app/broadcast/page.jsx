'use client'
import { useState } from 'react'
import { api } from '../../lib/api'
import { Megaphone, AlertTriangle, Send, CheckCircle, FileText, Users, Filter } from 'lucide-react'

const TEMPLATES = [
  { label: 'Clinic Closed', text: 'Dear patient, our clinic will be closed tomorrow due to a public holiday. We apologise for any inconvenience. Please contact us to reschedule your appointment.' },
  { label: 'Appointment Reminder', text: 'Hi! This is a reminder that you have an upcoming appointment at Entrust Family Clinic. Please arrive 10 minutes early. See you soon!' },
  { label: 'Google Review', text: 'Hi! Thank you for visiting Entrust Family Clinic. We hope you had a great experience! Would you mind leaving us a review? It really helps us grow.\n\nhttps://g.page/entrust-clinic/review' },
]

const STATUS_OPTIONS = [
  { value: 'upcoming',  label: 'Upcoming appointments' },
  { value: 'completed', label: 'Completed appointments' },
  { value: '',          label: 'All patients' },
]

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all'

export default function BroadcastPage() {
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState({ status: 'upcoming', date_from: '', date_to: '' })
  const [result, setResult] = useState(null)
  const [sending, setSending] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function send() {
    if (!message.trim()) return alert('Message cannot be empty')
    if (!confirmed) return alert('Please confirm you understand the WhatsApp policy')
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
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
          <Megaphone size={16} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Broadcast Message</h1>
          <p className="text-sm text-slate-500">Send a WhatsApp message to multiple patients at once</p>
        </div>
      </div>

      {/* Policy warning — full width */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-0.5">WhatsApp Policy</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            WhatsApp only allows free-form messages to patients who messaged you within the last 24 hours. Use for patients with upcoming appointments. Never send spam — this is how bans happen.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Message composer (2 cols) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Templates */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Templates</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => setMessage(tpl.text)}
                  className="text-xs px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50 transition-all font-medium"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400">{message.length} characters</p>
              {message.length > 0 && (
                <button onClick={() => setMessage('')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Clear</button>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-5 rounded-xl border shadow-sm ${result.failed > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className={result.failed > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                <p className="font-semibold text-slate-800">Broadcast Complete</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Sent</p>
                  <p className="font-bold text-emerald-600 text-xl">{result.sent}</p>
                </div>
                {result.failed > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs">Failed</p>
                    <p className="font-bold text-amber-600 text-xl">{result.failed}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-xs">Total matched</p>
                  <p className="font-bold text-slate-700 text-xl">{result.total}</p>
                </div>
              </div>
              {result.failed > 0 && <p className="text-xs text-amber-700 mt-2">Failed messages: outside 24h window or no phone number</p>}
            </div>
          )}
        </div>

        {/* Right — Audience + Send (1 col) */}
        <div className="space-y-4">

          {/* Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Send To</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">Patient Filter</label>
                <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} className={inputCls}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">Date From</label>
                <input type="date" value={filter.date_from} onChange={(e) => setFilter((f) => ({ ...f, date_from: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">Date To</label>
                <input type="date" value={filter.date_to} onChange={(e) => setFilter((f) => ({ ...f, date_to: e.target.value }))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Confirm + Send */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-teal-300 transition-all">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-teal-600"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I understand WhatsApp messaging policies and confirm this message is relevant to the selected patients
              </span>
            </label>

            <button
              onClick={send}
              disabled={sending || !message.trim() || !confirmed}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Send size={14} />
              {sending ? 'Sending…' : 'Send Broadcast'}
            </button>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Users size={13} className="text-slate-400 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">Only patients in the 24h active window will receive free-form messages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
