'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ClipboardList, Plus, Check, X, Trash2, Pencil } from 'lucide-react'

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', duration_minutes: 30 })
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', duration_minutes: 30 })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try { setServices(await api.services()) }
    catch { showToast('Failed to load services', false) }
  }

  async function addService() {
    if (!addForm.name.trim()) return showToast('Name is required', false)
    setSaving(true)
    try {
      await api.createService({ name: addForm.name.trim(), duration_minutes: Number(addForm.duration_minutes) })
      setAddForm({ name: '', duration_minutes: 30 })
      setShowAdd(false)
      showToast('Service added!')
      await load()
    } catch { showToast('Failed to add', false) }
    finally { setSaving(false) }
  }

  async function saveService(id) {
    if (!form.name.trim()) return showToast('Name is required', false)
    setSaving(true)
    try {
      const updated = await api.updateService(id, { name: form.name.trim(), duration_minutes: Number(form.duration_minutes) })
      setServices((prev) => prev.map((s) => s.id === id ? updated : s))
      setEditing(null)
      showToast('Saved!')
    } catch { showToast('Save failed', false) }
    finally { setSaving(false) }
  }

  async function deleteService(id) {
    if (!confirm('Delete this service? Existing appointments are not affected.')) return
    try {
      await api.deleteService(id)
      setServices((prev) => prev.filter((s) => s.id !== id))
      showToast('Deleted')
    } catch { showToast('Delete failed', false) }
  }

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={20} className="text-brand" />
            <h1 className="text-2xl font-bold text-ink">Services</h1>
          </div>
          <p className="text-sm text-ink-secondary ml-7">Manage clinic services shown to patients during booking</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Service
        </button>
      </div>

      {showAdd && (
        <div className="bg-card border-2 border-brand/30 rounded-xl p-5 mb-5 shadow-sm">
          <p className="text-sm font-semibold text-ink mb-4">New Service</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-ink-secondary block mb-1">Service Name *</label>
              <input type="text" placeholder="e.g. General Consultation" value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-secondary block mb-1">Duration (min)</label>
              <input type="number" min="5" max="240" value={addForm.duration_minutes}
                onChange={(e) => setAddForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                className={`${inputCls} w-24`} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addService} disabled={saving}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors">
              <Check size={14} /> {saving ? 'Adding…' : 'Add'}
            </button>
            <button onClick={() => setShowAdd(false)}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border text-ink-secondary hover:text-ink hover:bg-muted transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Service Name</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Duration</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-muted/60 transition-colors">
                {editing === s.id ? (
                  <>
                    <td className="px-5 py-3">
                      <input type="text" value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className={`${inputCls} w-full`} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <input type="number" min="5" max="240" value={form.duration_minutes}
                          onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                          className={`${inputCls} w-20`} />
                        <span className="text-xs text-ink-muted">min</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => saveService(s.id)} disabled={saving}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-brand text-white font-semibold disabled:opacity-50 transition-colors">
                          <Check size={11} /> {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:text-ink transition-colors">
                          <X size={11} /> Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3.5 font-medium text-ink">{s.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-muted text-ink-secondary border border-border px-2.5 py-1 rounded-full font-medium">{s.duration_minutes} min</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setEditing(s.id); setForm({ name: s.name, duration_minutes: s.duration_minutes }) }}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:text-ink hover:bg-muted transition-colors font-medium">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => deleteService(s.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
