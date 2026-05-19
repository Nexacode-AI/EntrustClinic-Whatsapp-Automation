'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Calendar, Check } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DEFAULT_SLOTS = DAYS.map((_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: i === 0 ? '13:00' : '21:00',
  active: true,
}))

const inputCls = 'bg-white border border-border rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all'

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
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={20} className="text-brand" />
          <h1 className="text-2xl font-bold text-ink">Doctor Schedule</h1>
        </div>
        <p className="text-sm text-ink-secondary ml-7">Set working hours and services per doctor</p>
      </div>

      {/* Doctor selector */}
      <div className="flex gap-2 flex-wrap mb-6">
        {doctors.filter((d) => d.active).map((d) => (
          <button
            key={d.id}
            onClick={() => selectDoctor(d)}
            className={`text-sm px-4 py-2 rounded-lg border font-medium transition-all ${
              selected?.id === d.id
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'border-border text-ink-secondary bg-card hover:text-ink hover:bg-muted'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {!selected && (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
          <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-ink-secondary font-medium">Select a doctor above to edit their schedule</p>
        </div>
      )}

      {selected && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-border bg-muted">
            {[{ key: 'hours', label: 'Working Hours' }, { key: 'services', label: 'Services' }].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  tab === key
                    ? 'text-brand border-b-2 border-brand bg-card'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'hours' && (
            <div className="p-6">
              <div className="space-y-3">
                {slots.map((slot) => (
                  <div key={slot.day_of_week} className="flex items-center gap-4">
                    <label className="flex items-center gap-2.5 w-32 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.active}
                        onChange={(e) => updateSlot(slot.day_of_week, 'active', e.target.checked)}
                        className="rounded border-border accent-brand"
                      />
                      <span className={`text-sm font-medium ${slot.active ? 'text-ink' : 'text-ink-muted'}`}>
                        {DAYS[slot.day_of_week]}
                      </span>
                    </label>
                    {slot.active ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time" value={slot.start_time?.slice(0, 5) || '09:00'}
                          onChange={(e) => updateSlot(slot.day_of_week, 'start_time', e.target.value)}
                          className={inputCls}
                        />
                        <span className="text-ink-muted text-sm">to</span>
                        <input
                          type="time" value={slot.end_time?.slice(0, 5) || '21:00'}
                          onChange={(e) => updateSlot(slot.day_of_week, 'end_time', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-ink-muted italic bg-muted px-3 py-1 rounded-lg border border-border">Day off</span>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={saveHours} disabled={saving}
                className="mt-6 flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors shadow-sm">
                <Check size={14} /> {saving ? 'Saving…' : 'Save Hours'}
              </button>
            </div>
          )}

          {tab === 'services' && (
            <div className="p-6">
              <p className="text-xs text-ink-secondary mb-4 font-medium">Select services this doctor handles</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allServices.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      services.includes(s.id)
                        ? 'border-brand/40 bg-brand/5'
                        : 'border-border hover:border-brand/30 hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={services.includes(s.id)}
                      onChange={() => setServices((prev) => prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id])}
                      className="rounded border-border accent-brand"
                    />
                    <div>
                      <p className="text-sm font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-ink-muted">{s.duration_minutes} min</p>
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={saveServices} disabled={saving}
                className="mt-6 flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors shadow-sm">
                <Check size={14} /> {saving ? 'Saving…' : 'Save Services'}
              </button>
            </div>
          )}
        </div>
      )}

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
