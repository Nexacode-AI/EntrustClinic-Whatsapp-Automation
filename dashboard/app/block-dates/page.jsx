'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Ban, Plus, Trash2 } from 'lucide-react'

const inputCls = 'w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all'
const labelCls = 'text-xs font-medium text-ink-secondary block mb-1'

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
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Ban size={20} className="text-brand" />
          <h1 className="text-2xl font-bold text-ink">Block Dates</h1>
        </div>
        <p className="text-sm text-ink-secondary ml-7">Block holidays, lunch breaks, or doctor leave — patients cannot book these slots</p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm">
        <p className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
          <Plus size={15} className="text-brand" /> Add New Block
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Doctor</label>
            <select value={form.doctor_id} onChange={(e) => setForm((f) => ({ ...f, doctor_id: e.target.value }))}
              className={inputCls}>
              <option value="">All Doctors</option>
              {doctors.filter((d) => d.active).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date *</label>
            <input type="date" value={form.blocked_date}
              onChange={(e) => setForm((f) => ({ ...f, blocked_date: e.target.value }))}
              className={inputCls} />
          </div>
        </div>

        <label className="flex items-center gap-2.5 mb-4 cursor-pointer w-fit">
          <input type="checkbox" checked={isFullDay} onChange={(e) => setIsFullDay(e.target.checked)}
            className="rounded border-border accent-brand" />
          <span className="text-sm text-ink font-medium">Full day block</span>
        </label>

        {!isFullDay && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Start Time</label>
              <input type="time" value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input type="time" value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className={inputCls} />
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className={labelCls}>Reason (optional)</label>
          <input type="text" placeholder="e.g. Public holiday, Lunch break, Doctor leave"
            value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            className={inputCls} />
        </div>

        <button onClick={addBlock} disabled={saving}
          className="flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors shadow-sm">
          <Ban size={14} /> {saving ? 'Adding…' : 'Block This Date'}
        </button>
      </div>

      {/* Existing blocks */}
      <div>
        <h2 className="text-sm font-semibold text-ink-secondary mb-3 uppercase tracking-wider">Upcoming Blocks</h2>
        {blocks.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center shadow-sm">
            <p className="text-ink-secondary">No blocked dates set.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map((b) => (
              <div key={b.id} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {new Date(b.blocked_date + 'T00:00:00').toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    {b.start_time && <span className="text-ink-secondary font-normal"> · {b.start_time.slice(0, 5)} – {b.end_time?.slice(0, 5)}</span>}
                    {!b.start_time && <span className="ml-2 text-xs bg-slate-100 text-ink-secondary border border-border px-2 py-0.5 rounded-full">Full day</span>}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    {doctorName(b.doctor_id)}{b.reason ? ` · ${b.reason}` : ''}
                  </p>
                </div>
                <button onClick={() => removeBlock(b.id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium shrink-0">
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border shadow-lg bg-card z-50 ${
          toast.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'
        }`}>
          <span className="font-bold">{toast.ok ? '✓' : '✗'}</span> {toast.msg}
        </div>
      )}
    </div>
  )
}
