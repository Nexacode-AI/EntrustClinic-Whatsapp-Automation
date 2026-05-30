'use client'
import { useState } from 'react'
import dayjs from 'dayjs'
import { api } from '../lib/api'
import { MessageSquare, CheckCircle, Phone } from 'lucide-react'

const REASON_LABELS = {
  low_rating:    'Low Rating',
  complaint:     'Complaint',
  staff_request: 'Staff Request',
  unknown:       'Unknown',
}

export default function EscalationsList({ initialEscalations }) {
  const [escalations, setEscalations] = useState(initialEscalations)
  const [resolving, setResolving] = useState({})
  const [toast, setToast] = useState(null)

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  async function resolve(id) {
    setResolving((p) => ({ ...p, [id]: true }))
    try {
      await api.resolveEscalation(id)
      setEscalations((prev) => prev.filter((e) => e.id !== id))
      showToast('Escalation resolved')
    } catch { showToast('Failed to resolve', false) }
    finally { setResolving((p) => ({ ...p, [id]: false })) }
  }

  return (
    <>
      <div className="space-y-3">
        {escalations.map((e) => (
          <div key={e.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-l-4 border-red-400 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-800">{e.patients?.name || 'Unknown Patient'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-xs">
                    <Phone size={11} /> {e.phone}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg font-medium">
                      {REASON_LABELS[e.reason] || e.reason?.replace('_', ' ') || 'Complaint'}
                    </span>
                    <span className="text-xs text-slate-400">{dayjs(e.created_at).format('D MMM, h:mm A')}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={`/conversations?phone=${encodeURIComponent(e.phone)}`}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium">
                    <MessageSquare size={13} /> View Chat
                  </a>
                  <button onClick={() => resolve(e.id)} disabled={resolving[e.id]}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors shadow-sm disabled:opacity-50">
                    <CheckCircle size={13} /> {resolving[e.id] ? '…' : 'Resolve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border shadow-lg bg-white z-50 ${toast.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}`}>
          <span className="font-bold">{toast.ok ? '✓' : '✗'}</span> {toast.msg}
        </div>
      )}
    </>
  )
}
