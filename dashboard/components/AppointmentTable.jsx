'use client'
import { useState } from 'react'
import dayjs from 'dayjs'
import { api } from '../lib/api'
import { Bell, Star, UserX, MessageSquare, Calendar, User } from 'lucide-react'

const STATUS = {
  upcoming:  { label: 'Upcoming',  cls: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' },
  no_show:   { label: 'No-show',   cls: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' },
}

function ActionBtn({ onClick, disabled, color, icon: Icon, label }) {
  const colors = {
    blue:  'border-blue-200 text-blue-600 hover:bg-blue-50',
    amber: 'border-amber-200 text-amber-600 hover:bg-amber-50',
    green: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
    gray:  'border-border text-ink-secondary hover:text-ink hover:bg-slate-50',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all disabled:opacity-40 ${colors[color]}`}
    >
      <Icon size={11} strokeWidth={2} />
      {label}
    </button>
  )
}

export default function AppointmentTable({ appointments: initial }) {
  const [appointments, setAppointments] = useState(initial)
  const [loading, setLoading] = useState({})
  const [toast, setToast] = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }
  const setBtn = (id, action, val) => setLoading((p) => ({ ...p, [`${id}-${action}`]: val }))

  async function sendReminder(a) {
    setBtn(a.id, 'remind', true)
    try {
      await api.sendReminder(a.id)
      showToast(`Reminder sent to ${a.patients?.name || a.patients?.phone}`)
    } catch { showToast('Failed to send reminder', false) }
    finally { setBtn(a.id, 'remind', false) }
  }

  async function sendReview(a) {
    setBtn(a.id, 'review', true)
    try {
      await api.sendReview(a.id)
      showToast(`Review request sent to ${a.patients?.name || a.patients?.phone}`)
    } catch { showToast('Failed to send review request', false) }
    finally { setBtn(a.id, 'review', false) }
  }

  async function markNoShow(a) {
    if (!confirm(`Mark ${a.patients?.name || 'this patient'} as no-show?`)) return
    setBtn(a.id, 'noshow', true)
    try {
      await api.updateAppointmentStatus(a.id, 'no_show')
      setAppointments((prev) => prev.map((x) => x.id === a.id ? { ...x, status: 'no_show' } : x))
      showToast('Marked as no-show')
    } catch { showToast('Failed to update', false) }
    finally { setBtn(a.id, 'noshow', false) }
  }

  if (!appointments.length) {
    return (
      <div className="bg-card rounded-xl border border-border p-16 text-center shadow-sm">
        <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-ink-secondary font-medium">No appointments</p>
        <p className="text-sm text-ink-muted mt-1">Nothing to show for this filter.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Patient</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Service</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Date & Time</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Status</th>
              <th className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {appointments.map((a) => {
              const s = STATUS[a.status] || STATUS.upcoming
              return (
                <tr key={a.id} className="hover:bg-muted/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                        <User size={13} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{a.patients?.name || 'Unknown'}</p>
                        <p className="text-xs text-ink-muted font-mono">{a.patients?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-secondary">{a.services?.name || '—'}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-ink font-medium">{dayjs(a.appointment_date).format('D MMM YYYY')}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{a.appointment_time?.slice(0, 5)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      <a href={`/conversations?phone=${encodeURIComponent(a.patients?.phone)}`}>
                        <ActionBtn icon={MessageSquare} label="Chat" color="gray" onClick={() => {}} />
                      </a>
                      {a.status === 'upcoming' && (
                        <>
                          <ActionBtn icon={Bell}  label={loading[`${a.id}-remind`] ? '…' : 'Remind'}  color="blue"  onClick={() => sendReminder(a)} disabled={loading[`${a.id}-remind`]} />
                          <ActionBtn icon={UserX} label={loading[`${a.id}-noshow`] ? '…' : 'No-show'} color="amber" onClick={() => markNoShow(a)} disabled={loading[`${a.id}-noshow`]} />
                        </>
                      )}
                      {(a.status === 'completed' || a.status === 'upcoming') && (
                        <ActionBtn icon={Star} label={loading[`${a.id}-review`] ? '…' : 'Review'} color="green" onClick={() => sendReview(a)} disabled={loading[`${a.id}-review`]} />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border shadow-lg z-50 bg-card ${
          toast.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'
        }`}>
          <span className="font-bold">{toast.ok ? '✓' : '✗'}</span>
          {toast.msg}
        </div>
      )}
    </>
  )
}
