'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Stethoscope, Plus, Pencil, Check, X, Phone, Calendar } from 'lucide-react'

const EMPTY = { name: '', whatsapp_phone: '', google_calendar_id: '' }

const inputCls = 'w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all'
const labelCls = 'text-xs font-medium text-ink-secondary block mb-1'

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [allServices, setAllServices] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY)
  const [addServices, setAddServices] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    load()
    api.services().then(setAllServices).catch(() => {})
  }, [])

  async function load() {
    try { setDoctors(await api.doctors()) }
    catch { showToast('Failed to load doctors', false) }
  }

  async function saveDoctor(id) {
    if (!form.name.trim()) return showToast('Name is required', false)
    setSaving(true)
    try {
      const updated = await api.updateDoctor(id, {
        name: form.name.trim(),
        whatsapp_phone: form.whatsapp_phone.trim() || null,
        google_calendar_id: form.google_calendar_id.trim() || null,
      })
      setDoctors((prev) => prev.map((d) => d.id === id ? { ...d, ...updated } : d))
      setEditing(null)
      showToast('Saved!')
    } catch { showToast('Save failed', false) }
    finally { setSaving(false) }
  }

  async function addDoctor() {
    if (!addForm.name.trim()) return showToast('Name is required', false)
    if (addServices.length === 0) return showToast('Select at least one service', false)
    setSaving(true)
    try {
      const created = await api.createDoctor({
        name: addForm.name.trim(),
        whatsapp_phone: addForm.whatsapp_phone.trim() || null,
        google_calendar_id: addForm.google_calendar_id.trim() || null,
      })
      await api.setDoctorServices(created.id, { service_ids: addServices })
      setAddForm(EMPTY)
      setAddServices([])
      setShowAdd(false)
      showToast('Doctor added!')
      await load()
    } catch { showToast('Failed to add doctor', false) }
    finally { setSaving(false) }
  }

  async function toggleActive(doctor) {
    try {
      const updated = await api.updateDoctor(doctor.id, { active: !doctor.active })
      setDoctors((prev) => prev.map((d) => d.id === doctor.id ? { ...d, ...updated } : d))
      showToast(updated.active ? 'Doctor activated' : 'Doctor deactivated')
    } catch { showToast('Failed to update', false) }
  }

  function toggleAddService(id) {
    setAddServices((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope size={20} className="text-brand" />
            <h1 className="text-2xl font-bold text-ink">Doctors</h1>
          </div>
          <p className="text-sm text-ink-secondary ml-7">Add, edit, and manage doctor profiles</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditing(null) }}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Doctor
        </button>
      </div>

      {/* Add Doctor Form */}
      {showAdd && (
        <div className="bg-card border-2 border-brand/30 rounded-xl p-6 mb-5 shadow-sm">
          <p className="text-sm font-semibold text-ink mb-4">New Doctor</p>

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input type="text" placeholder="Dr. Name" value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp Number</label>
              <input type="text" placeholder="+601XXXXXXXXX" value={addForm.whatsapp_phone}
                onChange={(e) => setAddForm((f) => ({ ...f, whatsapp_phone: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Doctor's Gmail (for Calendar)</label>
              <input type="text" placeholder="doctor@gmail.com" value={addForm.google_calendar_id}
                onChange={(e) => setAddForm((f) => ({ ...f, google_calendar_id: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          {/* Services */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wider block mb-3">
              Services This Doctor Handles *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allServices.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    addServices.includes(s.id)
                      ? 'border-brand/40 bg-brand/5 text-ink'
                      : 'border-border hover:border-brand/30 hover:bg-muted text-ink-secondary'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={addServices.includes(s.id)}
                    onChange={() => toggleAddService(s.id)}
                    className="rounded border-border accent-brand"
                  />
                  <div>
                    <p className="text-sm font-medium leading-tight">{s.name}</p>
                    <p className="text-xs text-ink-muted">{s.duration_minutes} min</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={addDoctor} disabled={saving}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors">
              <Check size={14} /> {saving ? 'Adding…' : 'Add Doctor'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddForm(EMPTY); setAddServices([]) }}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border text-ink-secondary hover:text-ink hover:bg-muted transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Doctor List */}
      <div className="space-y-3">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                  {doctor.name.split(' ').pop()[0]}
                </div>
                <div>
                  <p className="font-semibold text-ink">{doctor.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    doctor.active
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {doctor.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => toggleActive(doctor)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:text-ink hover:bg-muted transition-colors font-medium">
                  {doctor.active ? 'Deactivate' : 'Activate'}
                </button>
                {editing === doctor.id ? (
                  <>
                    <button onClick={() => saveDoctor(doctor.id)} disabled={saving}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors">
                      <Check size={12} /> {saving ? '…' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:text-ink transition-colors">
                      <X size={12} /> Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setEditing(doctor.id); setForm({ name: doctor.name, whatsapp_phone: doctor.whatsapp_phone || '', google_calendar_id: doctor.google_calendar_id || '' }) }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:text-ink hover:bg-muted transition-colors font-medium">
                    <Pencil size={11} /> Edit
                  </button>
                )}
              </div>
            </div>

            {editing === doctor.id ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp Number</label>
                  <input type="text" placeholder="+601XXXXXXXXX" value={form.whatsapp_phone}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp_phone: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Doctor's Gmail (for Calendar)</label>
                  <input type="text" placeholder="doctor@gmail.com" value={form.google_calendar_id}
                    onChange={(e) => setForm((f) => ({ ...f, google_calendar_id: e.target.value }))} className={inputCls} />
                  <p className="text-xs text-ink-muted mt-1">Doctor must share their Google Calendar with the system Gmail account to sync appointments</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-ink-muted" />
                  <div>
                    <p className="text-ink-muted">WhatsApp</p>
                    <p className={`mt-0.5 font-medium ${doctor.whatsapp_phone ? 'text-ink' : 'text-ink-muted italic'}`}>
                      {doctor.whatsapp_phone || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-ink-muted" />
                  <div>
                    <p className="text-ink-muted">Google Calendar</p>
                    <p className={`mt-0.5 font-medium ${doctor.google_calendar_id ? 'text-emerald-600' : 'text-ink-muted italic'}`}>
                      {doctor.google_calendar_id ? '✓ Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {doctor.doctor_services?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {doctor.doctor_services.map((ds) => (
                  <span key={ds.service_id} className="text-xs bg-muted text-ink-secondary border border-border px-2.5 py-1 rounded-full">
                    {ds.services?.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
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
