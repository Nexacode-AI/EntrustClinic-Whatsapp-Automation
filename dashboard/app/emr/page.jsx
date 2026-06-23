'use client'
import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Search, Plus, Save, Check, Mic, ChevronDown, X, Stethoscope, Pill, Activity, History } from 'lucide-react'
import dayjs from 'dayjs'

const TABS = ['Consultation', 'Vitals', 'Prescriptions', 'History']

export default function EmrPage() {
  const [activeQueue, setActiveQueue] = useState([])
  const [selected, setSelected] = useState(null)
  const [consultation, setConsultation] = useState(null)
  const [tab, setTab] = useState('Consultation')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActive()
  }, [])

  async function loadActive() {
    try {
      const q = await api.queue({ status: 'in_consultation' })
      setActiveQueue(q || [])
    } catch {}
    setLoading(false)
  }

  async function selectPatient(entry) {
    setSelected(entry)
    setTab('Consultation')
    try {
      const consults = await api.consultations({ queue_entry_id: entry.id })
      if (consults && consults.length > 0) {
        setConsultation(consults[0])
      } else {
        const newConsult = await api.createConsultation({
          patient_id: entry.patient_id,
          doctor_id: entry.doctor_id,
          queue_entry_id: entry.id,
        })
        setConsultation(newConsult)
      }
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex gap-4 h-[calc(100vh-var(--header-h)-2rem)]">
      {/* Patient list panel */}
      <div className="w-72 flex-shrink-0 card overflow-hidden flex flex-col">
        <div className="card-header">
          <span className="card-title text-sm">In Consultation</span>
          <span className="badge badge-teal text-xs">{activeQueue.length}</span>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
          {activeQueue.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No active patients" description="Patients in consultation will appear here" />
          ) : (
            activeQueue.map(entry => (
              <button
                key={entry.id}
                onClick={() => selectPatient(entry)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selected?.id === entry.id
                    ? 'bg-brand-light border-brand/30 shadow-sm'
                    : 'bg-white border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-brand">#{entry.queue_number}</span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    entry.triage === 'emergency' ? 'bg-danger' : entry.triage === 'urgent' ? 'bg-warning' : 'bg-success'
                  }`} />
                </div>
                <p className="text-sm font-semibold text-ink mt-0.5 truncate">{entry.patients?.name}</p>
                <p className="text-2xs text-ink-muted">{entry.doctors?.name || 'Unassigned'}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* EMR main panel */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {!selected ? (
          <EmptyState icon={Stethoscope} title="Select a patient" description="Choose a patient from the left panel to begin consultation" />
        ) : (
          <>
            {/* Patient bar */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center">
                  <span className="text-brand font-bold text-sm">{selected.patients?.name?.[0]}</span>
                </div>
                <div>
                  <h2 className="font-bold text-ink">{selected.patients?.name}</h2>
                  <p className="text-2xs text-ink-muted">{selected.patients?.ic_number} · {selected.patients?.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge status="in_consultation" />
                {consultation && (
                  <CompleteButton consultId={consultation.id} onComplete={loadActive} />
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="tab-list border-b border-border px-4">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'tab-active' : ''}`}>
                  {t === 'Consultation' && <Stethoscope size={13} />}
                  {t === 'Vitals' && <Activity size={13} />}
                  {t === 'Prescriptions' && <Pill size={13} />}
                  {t === 'History' && <History size={13} />}
                  {t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === 'Consultation' && consultation && (
                <ConsultTab consult={consultation} onSave={setConsultation} />
              )}
              {tab === 'Vitals' && selected && (
                <VitalsTab patientId={selected.patient_id} consultId={consultation?.id} />
              )}
              {tab === 'Prescriptions' && consultation && (
                <PrescriptionsTab consultId={consultation.id} />
              )}
              {tab === 'History' && selected && (
                <HistoryTab patientId={selected.patient_id} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CompleteButton({ consultId, onComplete }) {
  const [loading, setLoading] = useState(false)
  async function handleComplete() {
    if (!confirm('Complete consultation and move patient to billing?')) return
    setLoading(true)
    try {
      await api.completeConsult(consultId)
      onComplete()
    } catch {}
    setLoading(false)
  }
  return (
    <button onClick={handleComplete} disabled={loading} className="btn-primary btn-sm">
      <Check size={13} /> {loading ? 'Completing...' : 'Complete Consult'}
    </button>
  )
}

function ConsultTab({ consult, onSave }) {
  const [form, setForm] = useState({
    chief_complaint: consult.chief_complaint || '',
    history: consult.history || '',
    physical_exam: consult.physical_exam || '',
    assessment: consult.assessment || '',
    diagnoses_json: consult.diagnoses_json || [],
    mc_days: consult.mc_days || 0,
    follow_up_date: consult.follow_up_date || '',
    notes: consult.notes || '',
  })
  const [saved, setSaved] = useState(false)
  const [diagSearch, setDiagSearch] = useState('')
  const [diagResults, setDiagResults] = useState([])

  async function handleSave() {
    await api.updateConsultation(consult.id, form)
    onSave({ ...consult, ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function searchDiag(q) {
    setDiagSearch(q)
    if (q.length < 2) { setDiagResults([]); return }
    try {
      const r = await api.searchIcd10(q)
      setDiagResults(r || [])
    } catch {}
  }

  function addDiag(diag) {
    if (!form.diagnoses_json.find(d => d.code === diag.code)) {
      setForm(f => ({ ...f, diagnoses_json: [...f.diagnoses_json, diag] }))
    }
    setDiagSearch('')
    setDiagResults([])
  }

  function removeDiag(code) {
    setForm(f => ({ ...f, diagnoses_json: f.diagnoses_json.filter(d => d.code !== code) }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 form-group">
          <label className="form-label">Chief Complaint</label>
          <input className="form-input" value={form.chief_complaint} onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))} placeholder="Main presenting complaint..." />
        </div>
        <div className="col-span-2 form-group">
          <label className="form-label">History of Illness</label>
          <textarea className="form-textarea" rows={3} value={form.history} onChange={e => setForm(f => ({ ...f, history: e.target.value }))} placeholder="History of present illness..." />
        </div>
        <div className="col-span-2 form-group">
          <label className="form-label">Examination Findings</label>
          <textarea className="form-textarea" rows={3} value={form.physical_exam} onChange={e => setForm(f => ({ ...f, physical_exam: e.target.value }))} placeholder="Physical examination findings..." />
        </div>
      </div>

      {/* ICD-10 Diagnosis */}
      <div className="form-group">
        <label className="form-label">Diagnoses (ICD-10)</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            className="form-input pl-8"
            placeholder="Search ICD-10 codes..."
            value={diagSearch}
            onChange={e => searchDiag(e.target.value)}
          />
          {diagResults.length > 0 && (
            <div className="absolute z-20 w-full bg-white border border-border rounded-xl shadow-lg mt-1 overflow-hidden">
              {diagResults.slice(0, 6).map(r => (
                <button key={r.code} onClick={() => addDiag(r)} className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex gap-2">
                  <span className="font-mono text-brand font-semibold">{r.code}</span>
                  <span className="text-ink">{r.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {form.diagnoses_json.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.diagnoses_json.map(d => (
              <span key={d.code} className="badge badge-blue flex items-center gap-1">
                <span className="font-mono">{d.code}</span> {d.desc}
                <button onClick={() => removeDiag(d.code)}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 form-group">
          <label className="form-label">Assessment</label>
          <textarea className="form-textarea" rows={3} value={form.assessment} onChange={e => setForm(f => ({ ...f, assessment: e.target.value }))} placeholder="Clinical assessment and management plan..." />
        </div>
        <div className="form-group">
          <label className="form-label">MC Days</label>
          <input type="number" className="form-input" min={0} max={30} value={form.mc_days} onChange={e => setForm(f => ({ ...f, mc_days: parseInt(e.target.value) || 0 }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Follow-up Date</label>
          <input type="date" className="form-input" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
        </div>
        <div className="col-span-2 form-group">
          <label className="form-label">Additional Notes</label>
          <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any other notes..." />
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className={saved ? 'btn-success btn-sm' : 'btn-primary btn-sm'}>
          {saved ? <><Check size={13} /> Saved</> : <><Save size={13} /> Save Notes</>}
        </button>
      </div>
    </div>
  )
}

function VitalsTab({ patientId, consultId }) {
  const [vitals, setVitals] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ bp_systolic: '', bp_diastolic: '', heart_rate: '', temperature: '', spo2: '', weight: '', height: '' })

  useEffect(() => {
    if (patientId) api.patientVitals(patientId).then(v => setVitals(v || [])).catch(() => {})
  }, [patientId])

  async function handleSave() {
    await api.updateConsultation(consultId, { vitals: form })
    const v = await api.patientVitals(patientId)
    setVitals(v || [])
    setAddOpen(false)
  }

  const latest = vitals[0]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-ink">Current Vitals</h3>
        <button onClick={() => setAddOpen(true)} className="btn-primary btn-sm"><Plus size={13} /> Record Vitals</button>
      </div>

      {latest && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Blood Pressure', value: latest.vitals?.bp_systolic && latest.vitals?.bp_diastolic ? `${latest.vitals.bp_systolic}/${latest.vitals.bp_diastolic}` : '—', unit: 'mmHg', color: 'bg-red-50 border-red-100' },
            { label: 'Heart Rate', value: latest.vitals?.heart_rate || '—', unit: 'bpm', color: 'bg-pink-50 border-pink-100' },
            { label: 'Temperature', value: latest.vitals?.temperature || '—', unit: '°C', color: 'bg-orange-50 border-orange-100' },
            { label: 'SpO2', value: latest.vitals?.spo2 ? `${latest.vitals.spo2}%` : '—', unit: '', color: 'bg-blue-50 border-blue-100' },
            { label: 'Weight', value: latest.vitals?.weight || '—', unit: 'kg', color: 'bg-green-50 border-green-100' },
            { label: 'Height', value: latest.vitals?.height || '—', unit: 'cm', color: 'bg-teal-50 border-teal-100' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className={`card-padded border rounded-xl ${color}`}>
              <p className="text-2xs text-ink-faint font-medium">{label}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{value} <span className="text-xs font-normal text-ink-muted">{unit}</span></p>
            </div>
          ))}
        </div>
      )}

      {vitals.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">History</h3>
          <div className="overflow-x-auto"><table className="data-table">
            <thead><tr><th>Date</th><th>BP</th><th>HR</th><th>Temp</th><th>SpO2</th><th>Weight</th></tr></thead>
            <tbody>
              {vitals.slice(1).map((v, i) => (
                <tr key={i}>
                  <td>{dayjs(v.visit_date || v.created_at).format('D MMM YYYY')}</td>
                  <td>{v.vitals?.bp_systolic}/{v.vitals?.bp_diastolic}</td>
                  <td>{v.vitals?.heart_rate}</td>
                  <td>{v.vitals?.temperature}</td>
                  <td>{v.vitals?.spo2}%</td>
                  <td>{v.vitals?.weight} kg</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record Vitals" footer={
        <><button onClick={() => setAddOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} className="btn-primary">Save</button></>
      }>
        <div className="grid grid-cols-2 gap-3">
          {[['bp_systolic','Systolic (mmHg)'],['bp_diastolic','Diastolic (mmHg)'],['heart_rate','Heart Rate (bpm)'],['temperature','Temperature (°C)'],['spo2','SpO2 (%)'],['weight','Weight (kg)'],['height','Height (cm)']].map(([key, label]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input type="number" className="form-input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function PrescriptionsTab({ consultId }) {
  const [prescriptions, setPrescriptions] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [items, setItems] = useState([{ drug_name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  const [drugSearch, setDrugSearch] = useState('')
  const [drugResults, setDrugResults] = useState([])
  const [searchIdx, setSearchIdx] = useState(null)

  useEffect(() => {
    if (!consultId) return
    api.consultation(consultId).then(c => setPrescriptions(c?.prescriptions || [])).catch(() => {})
  }, [consultId])

  async function searchDrug(q, idx) {
    setSearchIdx(idx)
    setDrugSearch(q)
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, drug_name: q } : it))
    if (q.length < 2) { setDrugResults([]); return }
    try {
      const r = await api.searchDrugs(q)
      setDrugResults(r || [])
    } catch {}
  }

  function selectDrug(drug, idx) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, drug_name: drug.name, dosage: drug.default_dosage || '' } : it))
    setDrugResults([])
    setDrugSearch('')
  }

  function addItem() {
    setItems(prev => [...prev, { drug_name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    await api.createPrescription(consultId, { items })
    setAddOpen(false)
    setItems([{ drug_name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-ink">Prescriptions</h3>
        <button onClick={() => setAddOpen(true)} className="btn-primary btn-sm"><Plus size={13} /> New Prescription</button>
      </div>
      {prescriptions.length === 0 && <EmptyState icon={Pill} title="No prescriptions" description="Add medications for this consultation" />}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Write Prescription" size="lg" footer={
        <><button onClick={() => setAddOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} className="btn-primary">Save Prescription</button></>
      }>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-xl border border-border space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink-muted">Item {idx + 1}</span>
                {items.length > 1 && <button onClick={() => removeItem(idx)} className="text-danger"><X size={14} /></button>}
              </div>
              <div className="relative">
                <input
                  className="form-input"
                  placeholder="Drug name (search...)"
                  value={item.drug_name}
                  onChange={e => searchDrug(e.target.value, idx)}
                />
                {drugResults.length > 0 && searchIdx === idx && (
                  <div className="absolute z-20 w-full bg-white border border-border rounded-xl shadow-lg mt-1">
                    {drugResults.slice(0, 5).map(r => (
                      <button key={r.id} onClick={() => selectDrug(r, idx)} className="w-full text-left px-3 py-2 hover:bg-muted text-sm">
                        <span className="font-semibold">{r.name}</span>
                        {r.generic_name && <span className="text-ink-faint"> ({r.generic_name})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input className="form-input" placeholder="Dosage" value={item.dosage} onChange={e => setItems(p => p.map((it, i) => i === idx ? { ...it, dosage: e.target.value } : it))} />
                <input className="form-input" placeholder="Frequency" value={item.frequency} onChange={e => setItems(p => p.map((it, i) => i === idx ? { ...it, frequency: e.target.value } : it))} />
                <input className="form-input" placeholder="Duration" value={item.duration} onChange={e => setItems(p => p.map((it, i) => i === idx ? { ...it, duration: e.target.value } : it))} />
              </div>
              <input className="form-input" placeholder="Special instructions" value={item.instructions} onChange={e => setItems(p => p.map((it, i) => i === idx ? { ...it, instructions: e.target.value } : it))} />
            </div>
          ))}
          <button onClick={addItem} className="btn-ghost btn-sm w-full"><Plus size={13} /> Add another drug</button>
        </div>
      </Modal>
    </div>
  )
}

function HistoryTab({ patientId }) {
  const [history, setHistory] = useState([])
  useEffect(() => {
    if (patientId) api.patientConsults(patientId).then(h => setHistory(h || [])).catch(() => {})
  }, [patientId])

  if (history.length === 0) return <EmptyState icon={History} title="No history" description="Past consultations will appear here" />

  return (
    <div className="space-y-3">
      {history.map(h => (
        <div key={h.id} className="card-padded border border-border rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-ink">{dayjs(h.created_at).format('D MMM YYYY')}</span>
            <Badge status={h.status} />
          </div>
          {h.chief_complaint && <p className="text-sm text-ink-muted"><span className="font-medium text-ink">CC:</span> {h.chief_complaint}</p>}
          {h.diagnoses_json?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {h.diagnoses_json.map(d => <span key={d.code} className="badge badge-blue text-xs">{d.code} {d.desc || d.description}</span>)}
            </div>
          )}
          {h.mc_days > 0 && <p className="text-xs text-ink-faint mt-1">MC: {h.mc_days} days</p>}
        </div>
      ))}
    </div>
  )
}
