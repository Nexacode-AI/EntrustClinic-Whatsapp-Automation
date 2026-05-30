'use client'
import { useState } from 'react'
import dayjs from 'dayjs'
import { api } from '../lib/api'
import { Bell, Star, UserX, MessageSquare, Calendar, User } from 'lucide-react'

const STATUS = {
  upcoming:  { label: 'Upcoming',  cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  no_show:   { label: 'No-show',   cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
}

export default function AppointmentTable({ appointments: initial }) {
  const [appointments, setAppointments] = useState(initial)
  const [loading, setLoading] = useState({})
  const [toast, setToast] = useState(null)

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }
  const setBtn = (id, action, val) => setLoading((p) => ({ ...p, [`${id}-${action}`]: val }))

  async function sendReminder(a) {
    setBtn(a.id, 'remind', true)
    try { await api.sendReminder(a.id); showToast(`Reminder sent to ${a.patients?.name || a.patients?.phone}`) }
    catch { showToast('Failed to send reminder', false) }
    finally { setBtn(a.id, 'remind', false) }
  }

  async function sendReview(a) {
    setBtn(a.id, 'review', true)
    try { await api.sendReview(a.id); showToast(`Review request sent`) }
    catch { showToast('Failed to send review request', false) }
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
      <div className="bg-white rounded-xl border border-slate-200 p-20 text-center shadow-sm">
        <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No appointments</p>
        <p className="text-sm text-slate-400 mt-1">Nothing to show for this filter.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">Patient</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">Doctor</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">Service</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">Date & Time</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">Status</th>
              <th className="px-5 py-3.5 text-right text-xs uppercase tracking-wider text-slate-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.map((a) => {
              const s = STATUS[a.status] || STATUS.upcoming
              return (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                        <User size={13} className="text-teal-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{a.patients?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400 font-mono">{a.patients?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 text-sm">{a.doctors?.name || '—'}</td>
                  <td className="px-5 py-4 text-slate-600 text-sm">{a.services?.name || '—'}</td>
                  <td className="px-5 py-4">
                    <p className="text-slate-800 font-medium">{dayjs(a.appointment_date).format('D MMM YYYY')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.appointment_time?.slice(0, 5)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 justify-end flex-wrap">
                      <a href={`/conversations?phone=${encodeURIComponent(a.patients?.phone)}`}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all font-medium">
                        <MessageSquare size={11} /> Chat
                      </a>
                      {a.status === 'upcoming' && (
                        <>
                          <button onClick={() => sendReminder(a)} disabled={loading[`${a.id}-remind`]}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all font-medium disabled:opacity-40">
                            <Bell size={11} /> {loading[`${a.id}-remind`] ? '…' : 'Remind'}
                          </button>
                          <button onClick={() => markNoShow(a)} disabled={loading[`${a.id}-noshow`]}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-all font-medium disabled:opacity-40">
                            <UserX size={11} /> {loading[`${a.id}-noshow`] ? '…' : 'No-show'}
                          </button>
                        </>
                      )}
                      {(a.status === 'completed' || a.status === 'upcoming') && (
                        <button onClick={() => sendReview(a)} disabled={loading[`${a.id}-review`]}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all font-medium disabled:opacity-40">
                          <Star size={11} /> {loading[`${a.id}-review`] ? '…' : 'Review'}
                        </button>
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
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border shadow-lg bg-white z-50 ${toast.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}`}>
          <span className="font-bold">{toast.ok ? '✓' : '✗'}</span> {toast.msg}
        </div>
      )}
    </>
  )
}
