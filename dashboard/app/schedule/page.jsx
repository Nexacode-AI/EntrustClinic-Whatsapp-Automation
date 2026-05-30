'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Calendar, Check } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DEFAULT_SLOTS = DAYS.map((_, i) => ({ day_of_week: i, start_time: '09:00', end_time: i === 0 ? '13:00' : '21:00', active: true }))
const inputCls = 'bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all'

export default function SchedulePage() {
  const [doctors, setDoctors] = useState([])
  const [selected, setSelected] = useState(null)
  const [slots, setSlots] = useState(DEFAULT_SLOTS)
  const [services, setServices] = useState([])
  const [allServices, setAllServices] = useState([])
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('hours')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    Promise.all([api.doctors(), api.services()])
      .then(([docs, svcs]) => { setDoctors(docs); setAllServices(svcs) })
      .catch(() => showToast('Failed to load', false))
  }, [])

  async function selectDoctor(doctor) {
    setSelected(doctor)
    try {
      const [avail, svcData] = await Promise.all([
        api.doctorAvailability(doctor.id),
        api.doctors().then((all) => all.find((d) => d.id === doctor.id)),
      ])
      setSlots(DEFAULT_SLOTS.map((def) => avail.find((a) => a.day_of_week === def.day_of_week) || def))
      setServices(svcData?.doctor_services?.map((ds) => ds.service_id) || [])
    } catch { showToast('Failed to load schedule', false) }
  }

  function updateSlot(day, field, value) {
    setSlots((prev) => prev.map((s) => s.day_of_week === day ? { ...s, [field]: value } : s))
  }

  async function saveHours() {
    setSaving(true)
    try { await api.setDoctorAvailability(selected.id, { slots }); showToast('Schedule saved!') }
    catch { showToast('Save failed', false) }
    finally { setSaving(false) }
  }

  async function saveServices() {
    setSaving(true)
    try { await api.setDoctorServices(selected.id, { service_ids: services }); showToast('Services saved!') }
    catch { showToast('Save failed', false) }
    finally { setSaving(false) }
  }

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Calendar size={16} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Schedule</h1>
          <p className="text-sm text-slate-500">Set working hours and services per doctor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Doctor selector — left */}
        <div className="lg:col-span-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Select Doctor</p>
          {doctors.filter((d) => d.active).length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
              <p className="text-sm text-slate-400">No active doctors</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {doctors.filter((d) => d.active).map((d) => (
                <button
                  key={d.id}
                  onClick={() => selectDoctor(d)}
                  className={`w-full text-left text-sm px-4 py-3 rounded-xl border font-medium transition-all ${
                    selected?.id === d.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'border-slate-200 text-slate-600 bg-white hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold">{d.name}</p>
                  <p className={`text-xs mt-0.5 ${selected?.id === d.id ? 'text-teal-100' : 'text-slate-400'}`}>
                    {d.doctor_services?.length || 0} services
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Schedule editor — right */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm h-full flex flex-col items-center justify-center">
              <Calendar size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Select a doctor to edit their schedule</p>
              <p className="text-sm text-slate-400 mt-1">Choose from the list on the left</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                {[{ key: 'hours', label: 'Working Hours' }, { key: 'services', label: 'Services' }].map(({ key, label }) => (
                  <button key={key} onClick={() => setTab(key)}
                    className={`px-6 py-3.5 text-sm font-medium transition-colors ${tab === key ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'hours' && (
                <div className="p-6">
                  <div className="space-y-3">
                    {slots.map((slot) => (
                      <div key={slot.day_of_week} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${slot.active ? 'bg-slate-50' : 'opacity-50'}`}>
                        <label className="flex items-center gap-2.5 w-32 cursor-pointer shrink-0">
                          <input type="checkbox" checked={slot.active} onChange={(e) => updateSlot(slot.day_of_week, 'active', e.target.checked)} className="rounded border-slate-300 accent-teal-600" />
                          <span className="text-sm font-medium text-slate-700">{DAYS[slot.day_of_week]}</span>
                        </label>
                        {slot.active ? (
                          <div className="flex items-center gap-2">
                            <input type="time" value={slot.start_time?.slice(0, 5) || '09:00'} onChange={(e) => updateSlot(slot.day_of_week, 'start_time', e.target.value)} className={inputCls} />
                            <span className="text-slate-400 text-sm">to</span>
                            <input type="time" value={slot.end_time?.slice(0, 5) || '21:00'} onChange={(e) => updateSlot(slot.day_of_week, 'end_time', e.target.value)} className={inputCls} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Day off</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={saveHours} disabled={saving} className="mt-5 flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Check size={14} /> {saving ? 'Saving…' : 'Save Hours'}
                  </button>
                </div>
              )}

              {tab === 'services' && (
                <div className="p-6">
                  <p className="text-sm text-slate-500 mb-4">Select services this doctor handles</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allServices.map((s) => (
                      <label key={s.id} className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${services.includes(s.id) ? 'border-teal-300 bg-teal-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                        <input type="checkbox" checked={services.includes(s.id)} onChange={() => setServices((prev) => prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id])} className="rounded border-slate-300 accent-teal-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.duration_minutes} min</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button onClick={saveServices} disabled={saving} className="mt-5 flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Check size={14} /> {saving ? 'Saving…' : 'Save Services'}
                  </button>
                </div>
              )}
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
