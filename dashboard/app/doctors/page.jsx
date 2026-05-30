'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Stethoscope, Plus, Pencil, Check, X, Phone, Calendar, UserX } from 'lucide-react'

const EMPTY = { name: '', whatsapp_phone: '', google_calendar_id: '' }
const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all'
const labelCls = 'text-xs font-medium text-slate-500 block mb-1.5'

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
      const updated = await api.updateDoctor(id, { name: form.name.trim(), whatsapp_phone: form.whatsapp_phone.trim() || null, google_calendar_id: form.google_calendar_id.trim() || null })
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
      const created = await api.createDoctor({ name: addForm.name.trim(), whatsapp_phone: addForm.whatsapp_phone.trim() || null, google_calendar_id: addForm.google_calendar_id.trim() || null })
      await api.setDoctorServices(created.id, { service_ids: addServices })
      setAddForm(EMPTY); setAddServices([]); setShowAdd(false)
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

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
            <Stethoscope size={16} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctors</h1>
            <p className="text-sm text-slate-500">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>
        <button onClick={() => { setShowAdd(true); setEditing(null) }} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors shadow-sm">
          <Plus size={15} /> Add Doctor
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border-2 border-teal-200 rounded-xl p-6 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-800 mb-5">New Doctor</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input type="text" placeholder="Dr. Name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp Number</label>
              <input type="text" placeholder="+601XXXXXXXXX" value={addForm.whatsapp_phone} onChange={(e) => setAddForm((f) => ({ ...f, whatsapp_phone: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Doctor's Gmail (for Calendar)</label>
              <input type="text" placeholder="doctor@gmail.com" value={addForm.google_calendar_id} onChange={(e) => setAddForm((f) => ({ ...f, google_calendar_id: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Services This Doctor Handles *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allServices.map((s) => (
                <label key={s.id} className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${addServices.includes(s.id) ? 'border-teal-300 bg-teal-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={addServices.includes(s.id)} onChange={() => setAddServices((prev) => prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id])} className="rounded border-slate-300 accent-teal-600" />
                  <div>
                    <p className="text-xs font-medium text-slate-800 leading-tight">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.duration_minutes} min</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addDoctor} disabled={saving} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
              <Check size={14} /> {saving ? 'Adding…' : 'Add Doctor'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddForm(EMPTY); setAddServices([]) }} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Doctor list */}
      {doctors.length === 0 && !showAdd ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
          <UserX size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No doctors yet</p>
          <p className="text-sm text-slate-400 mt-1">Click "Add Doctor" to register your first doctor</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                    {doctor.name.split(' ').pop()[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{doctor.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doctor.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      {doctor.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleActive(doctor)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium">
                    {doctor.active ? 'Deactivate' : 'Activate'}
                  </button>
                  {editing === doctor.id ? (
                    <>
                      <button onClick={() => saveDoctor(doctor.id)} disabled={saving} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white font-semibold disabled:opacity-50 transition-colors">
                        <Check size={11} /> {saving ? '…' : 'Save'}
                      </button>
                      <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 transition-colors">
                        <X size={11} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setEditing(doctor.id); setForm({ name: doctor.name, whatsapp_phone: doctor.whatsapp_phone || '', google_calendar_id: doctor.google_calendar_id || '' }) }} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium">
                      <Pencil size={11} /> Edit
                    </button>
                  )}
                </div>
              </div>

              {editing === doctor.id ? (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>WhatsApp Number</label>
                      <input type="text" placeholder="+601XXXXXXXXX" value={form.whatsapp_phone} onChange={(e) => setForm((f) => ({ ...f, whatsapp_phone: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Doctor's Gmail</label>
                      <input type="text" placeholder="doctor@gmail.com" value={form.google_calendar_id} onChange={(e) => setForm((f) => ({ ...f, google_calendar_id: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Phone size={12} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-0.5">WhatsApp</p>
                      <p className={`font-medium ${doctor.whatsapp_phone ? 'text-slate-700' : 'text-slate-400 italic'}`}>{doctor.whatsapp_phone || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-0.5">Google Calendar</p>
                      <p className={`font-medium ${doctor.google_calendar_id ? 'text-emerald-600' : 'text-slate-400 italic'}`}>{doctor.google_calendar_id ? '✓ Connected' : 'Not connected'}</p>
                    </div>
                  </div>
                </div>
              )}

              {doctor.doctor_services?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {doctor.doctor_services.map((ds) => (
                    <span key={ds.service_id} className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">{ds.services?.name}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border shadow-lg bg-white z-50 ${toast.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}`}>
          <span className="font-bold">{toast.ok ? '✓' : '✗'}</span> {toast.msg}
        </div>
      )}
    </div>
  )
}
