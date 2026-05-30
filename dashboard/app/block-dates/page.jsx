'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Ban, Plus, Trash2, CalendarOff } from 'lucide-react'

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all'
const labelCls = 'text-xs font-medium text-slate-500 block mb-1.5'

export default function BlockDatesPage() {
  const [blocks, setBlocks] = useState([])
  const [doctors, setDoctors] = useState([])
  const [form, setForm] = useState({ doctor_id: '', blocked_date: '', start_time: '', end_time: '', reason: '' })
  const [isFullDay, setIsFullDay] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    load()
    api.doctors().then(setDoctors).catch(() => {})
  }, [])

  async function load() {
    try {
      const today = new Date().toISOString().slice(0, 10)
      setBlocks(await api.blockedSlots({ from: today }))
    } catch { showToast('Failed to load', false) }
  }

  async function addBlock() {
    if (!form.blocked_date) return showToast('Date is required', false)
    if (!isFullDay && (!form.start_time || !form.end_time)) return showToast('Start and end time required', false)
    setSaving(true)
    try {
      await api.createBlockedSlot({
        doctor_id: form.doctor_id || null,
        blocked_date: form.blocked_date,
        start_time: isFullDay ? null : form.start_time,
        end_time: isFullDay ? null : form.end_time,
        reason: form.reason || null,
      })
      setForm({ doctor_id: '', blocked_date: '', start_time: '', end_time: '', reason: '' })
      showToast('Block added!')
      await load()
    } catch { showToast('Failed to add', false) }
    finally { setSaving(false) }
  }

  async function removeBlock(id) {
    try {
      await api.deleteBlockedSlot(id)
      setBlocks((prev) => prev.filter((b) => b.id !== id))
      showToast('Removed')
    } catch { showToast('Failed to remove', false) }
  }

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  function doctorName(id) {
    if (!id) return 'All Doctors'
    return doctors.find((d) => d.id === id)?.name || 'Unknown'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <Ban size={16} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Block Dates</h1>
          <p className="text-sm text-slate-500">Block holidays, lunch breaks, or doctor leave</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form — left */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-5">
              <Plus size={14} className="text-teal-600" />
              <p className="text-sm font-semibold text-slate-800">Add New Block</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Doctor</label>
                <select value={form.doctor_id} onChange={(e) => setForm((f) => ({ ...f, doctor_id: e.target.value }))} className={inputCls}>
                  <option value="">All Doctors</option>
                  {doctors.filter((d) => d.active).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Date *</label>
                <input type="date" value={form.blocked_date} onChange={(e) => setForm((f) => ({ ...f, blocked_date: e.target.value }))} className={inputCls} />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={isFullDay} onChange={(e) => setIsFullDay(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-teal-600" />
                <span className="text-sm text-slate-700 font-medium">Full day block</span>
              </label>

              {!isFullDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Start Time</label>
                    <input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>End Time</label>
                    <input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>Reason (optional)</label>
                <input type="text" placeholder="e.g. Public holiday, Doctor leave" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className={inputCls} />
              </div>

              <button onClick={addBlock} disabled={saving} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-all shadow-sm">
                <Ban size={13} /> {saving ? 'Adding…' : 'Block This Date'}
              </button>
            </div>
          </div>
        </div>

        {/* Blocks list — right */}
        <div className="lg:col-span-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Upcoming Blocks</p>
          {blocks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
              <CalendarOff size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No blocked dates set</p>
              <p className="text-sm text-slate-400 mt-1">Add a block using the form on the left</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((b) => (
                <div key={b.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(b.blocked_date + 'T00:00:00').toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {b.start_time && <span className="text-slate-500 font-normal"> · {b.start_time.slice(0, 5)} – {b.end_time?.slice(0, 5)}</span>}
                      {!b.start_time && <span className="ml-2 text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">Full day</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {doctorName(b.doctor_id)}{b.reason ? ` · ${b.reason}` : ''}
                    </p>
                  </div>
                  <button onClick={() => removeBlock(b.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium shrink-0">
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border shadow-lg bg-white z-50 ${toast.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}`}>
          <span className="font-bold">{toast.ok ? '✓' : '✗'}</span> {toast.msg}
        </div>
      )}
    </div>
  )
}
