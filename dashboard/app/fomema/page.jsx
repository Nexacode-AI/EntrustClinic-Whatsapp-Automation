'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Plus, Users, Search, Send, FileText } from 'lucide-react'
import dayjs from 'dayjs'

const EXAM_RESULT = ['pending','pass','fail','unfit','referred']
const NATIONALITY = ['Bangladesh','Indonesia','Myanmar','Nepal','Philippines','Vietnam','India','Pakistan','Cambodia','Other']

export default function FomemaPage() {
  const [workers, setWorkers] = useState([])
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [addWorkerOpen, setAddWorkerOpen] = useState(false)
  const [examOpen, setExamOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [workerForm, setWorkerForm] = useState({ name: '', ic_passport: '', nationality: 'Bangladesh', employer: '', phone: '', gender: 'male', date_of_birth: '' })
  const [examForm, setExamForm] = useState({ result: 'pending', chest_xray: '', urine_test: '', blood_test: '', physical_exam: '', examination_date: dayjs().format('YYYY-MM-DD'), notes: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [w, s] = await Promise.all([api.fomemaWorkers(), api.fomemaStats()])
      setWorkers(w || [])
      setStats(s || {})
    } catch {}
    setLoading(false)
  }

  async function handleAddWorker() {
    await api.createWorker(workerForm)
    setAddWorkerOpen(false)
    setWorkerForm({ name: '', ic_passport: '', nationality: 'Bangladesh', employer: '', phone: '', gender: 'male', date_of_birth: '' })
    loadAll()
  }

  async function handleCreateExam() {
    if (!selected) return
    const exam = await api.createExam(selected.id, examForm)
    setExamOpen(false)
    loadAll()
  }

  async function handleSubmit(workerId, examId) {
    await api.submitFomema(examId)
    loadAll()
  }

  const filtered = workers.filter(w =>
    !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.ic_passport?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">FOMEMA</h1>
          <p className="page-subtitle">Foreign worker medical examination</p>
        </div>
        <button onClick={() => setAddWorkerOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Register Worker</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Registered', value: stats.total || 0, color: 'bg-brand-light', iconColor: 'text-brand' },
          { label: 'Passed', value: stats.pass || 0, color: 'bg-success-light', iconColor: 'text-success-dark' },
          { label: 'Failed / Unfit', value: (stats.fail || 0) + (stats.unfit || 0), color: 'bg-danger-light', iconColor: 'text-danger-dark' },
          { label: 'Pending', value: stats.pending || 0, color: 'bg-warning-light', iconColor: 'text-warning-dark' },
        ].map(({ label, value, color, iconColor }) => (
          <div key={label} className={`card-padded border rounded-xl ${color}`}>
            <p className={`text-2xl font-black ${iconColor}`}>{value}</p>
            <p className="text-xs text-ink-muted font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Workers</span>
          <div className="relative w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="form-input pl-7 py-1.5 text-sm" placeholder="Search name / passport..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No workers registered" description="Register foreign workers to begin FOMEMA examination" action={<button onClick={() => setAddWorkerOpen(true)} className="btn-primary btn-sm"><Plus size={13} /> Register</button>} />
        ) : (
          <table className="data-table">
            <thead><tr><th>Worker</th><th>Nationality</th><th>Employer</th><th>Exam Date</th><th>Result</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(w => {
                const latestExam = w.fomema_exams?.[0]
                return (
                  <tr key={w.id}>
                    <td>
                      <p className="font-semibold text-sm text-ink">{w.name}</p>
                      <p className="text-2xs text-ink-faint font-mono">{w.ic_passport}</p>
                    </td>
                    <td className="text-sm text-ink-muted">{w.nationality}</td>
                    <td className="text-sm text-ink-muted">{w.employer}</td>
                    <td className="text-sm text-ink-muted">{latestExam?.examination_date ? dayjs(latestExam.examination_date).format('D MMM YYYY') : '—'}</td>
                    <td>{latestExam ? <Badge status={latestExam.result} /> : <Badge status="pending" label="No Exam" />}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelected(w); setExamOpen(true) }} className="btn-ghost btn-xs"><FileText size={11} /> Exam</button>
                        {latestExam && latestExam.result !== 'pending' && !latestExam.submitted_to_fomema && (
                          <button onClick={() => handleSubmit(w.id, latestExam.id)} className="btn-primary btn-xs"><Send size={11} /> Submit</button>
                        )}
                        {latestExam?.submitted_to_fomema && <span className="badge badge-green text-xs">Submitted</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Worker Modal */}
      <Modal open={addWorkerOpen} onClose={() => setAddWorkerOpen(false)} title="Register Foreign Worker" footer={
        <><button onClick={() => setAddWorkerOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleAddWorker} className="btn-primary">Register</button></>
      }>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={workerForm.name} onChange={e => setWorkerForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">IC / Passport No.</label>
            <input className="form-input" value={workerForm.ic_passport} onChange={e => setWorkerForm(f => ({ ...f, ic_passport: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Nationality</label>
            <select className="form-select" value={workerForm.nationality} onChange={e => setWorkerForm(f => ({ ...f, nationality: e.target.value }))}>
              {NATIONALITY.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Employer</label>
            <input className="form-input" value={workerForm.employer} onChange={e => setWorkerForm(f => ({ ...f, employer: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={workerForm.phone} onChange={e => setWorkerForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-select" value={workerForm.gender} onChange={e => setWorkerForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input type="date" className="form-input" value={workerForm.date_of_birth} onChange={e => setWorkerForm(f => ({ ...f, date_of_birth: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Create Exam Modal */}
      <Modal open={examOpen} onClose={() => setExamOpen(false)} title={`FOMEMA Examination — ${selected?.name}`} footer={
        <><button onClick={() => setExamOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleCreateExam} className="btn-primary">Save Exam</button></>
      }>
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Examination Date</label>
            <input type="date" className="form-input" value={examForm.examination_date} onChange={e => setExamForm(f => ({ ...f, examination_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Chest X-Ray Result</label>
            <input className="form-input" placeholder="Normal / Abnormal..." value={examForm.chest_xray} onChange={e => setExamForm(f => ({ ...f, chest_xray: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Urine Test</label>
            <input className="form-input" placeholder="Normal / Abnormal..." value={examForm.urine_test} onChange={e => setExamForm(f => ({ ...f, urine_test: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Blood Test</label>
            <input className="form-input" placeholder="Normal / Abnormal..." value={examForm.blood_test} onChange={e => setExamForm(f => ({ ...f, blood_test: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Physical Examination</label>
            <textarea className="form-textarea" rows={2} value={examForm.physical_exam} onChange={e => setExamForm(f => ({ ...f, physical_exam: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Overall Result</label>
            <div className="flex gap-2">
              {EXAM_RESULT.map(r => (
                <button key={r} onClick={() => setExamForm(f => ({ ...f, result: r }))}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${
                    examForm.result === r
                      ? r === 'pass' ? 'bg-success text-white border-success'
                        : r === 'fail' || r === 'unfit' ? 'bg-danger text-white border-danger'
                        : 'bg-brand text-white border-brand'
                      : 'bg-white border-border text-ink hover:bg-muted'
                  }`}
                >{r}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={2} value={examForm.notes} onChange={e => setExamForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
