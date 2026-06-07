'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { Badge, TriageDot } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { ListOrdered, Plus, RefreshCw, Clock, Users, Stethoscope, CheckCircle, Monitor } from 'lucide-react'
import dayjs from 'dayjs'

const STATUS_COLUMNS = [
  { id: 'waiting',        label: 'Waiting',       color: 'bg-warning/10 border-warning/20' },
  { id: 'in_consultation', label: 'In Consult',   color: 'bg-brand-light border-brand/20' },
  { id: 'billing',        label: 'Billing',       color: 'bg-info-light border-info/20' },
  { id: 'done',           label: 'Done',          color: 'bg-success-light border-success/20' },
]

const NEXT_STATUS = {
  waiting:        'in_consultation',
  in_consultation:'billing',
  billing:        'done',
}

export default function QueuePage() {
  const [queue, setQueue] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', triage: 'normal', reason: '' })

  const load = useCallback(async () => {
    try {
      const [q, s, d] = await Promise.all([api.queue(), api.queueStats(), api.doctors()])
      setQueue(q || [])
      setStats(s || {})
      setDoctors(d || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  async function handleStatusChange(id, newStatus) {
    await api.updateQueue(id, newStatus)
    load()
  }

  async function handleAddQueue() {
    if (!form.patient_id) return
    await api.addQueue(form)
    setAddOpen(false)
    setForm({ patient_id: '', doctor_id: '', triage: 'normal', reason: '' })
    load()
  }

  const grouped = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.id] = queue.filter(q => q.status === col.id)
    return acc
  }, {})

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Queue Board</h1>
          <p className="page-subtitle">{dayjs().format('dddd, D MMMM YYYY')}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/queue/display`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm"
          >
            <Monitor size={14} /> Display Screen
          </a>
          <button onClick={load} className="btn-ghost btn-sm"><RefreshCw size={14} /></button>
          <button onClick={() => setAddOpen(true)} className="btn-primary btn-sm">
            <Plus size={14} /> Add Walk-in
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Today', value: stats.total || 0, icon: Users, color: 'bg-brand-light', iconColor: 'text-brand' },
          { label: 'Waiting', value: stats.waiting || 0, icon: Clock, color: 'bg-warning-light', iconColor: 'text-warning-dark' },
          { label: 'In Consult', value: stats.active || 0, icon: Stethoscope, color: 'bg-info-light', iconColor: 'text-info-dark' },
          { label: 'Avg Wait', value: `${stats.avgWait || 0}m`, icon: CheckCircle, color: 'bg-success-light', iconColor: 'text-success-dark' },
        ].map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className="stat-card">
            <div>
              <p className="stat-value">{value}</p>
              <p className="stat-label">{label}</p>
            </div>
            <div className={`stat-icon-wrap ${color}`}>
              <Icon size={18} className={iconColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Queue columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map(col => (
          <div key={col.id} className={`card border ${col.color}`}>
            <div className="card-header">
              <span className="card-title text-sm">{col.label}</span>
              <span className="badge badge-gray text-xs">{grouped[col.id]?.length || 0}</span>
            </div>
            <div className="p-3 space-y-2 min-h-32">
              {(grouped[col.id] || []).length === 0 ? (
                <p className="text-xs text-ink-faint text-center py-6">Empty</p>
              ) : (
                (grouped[col.id] || []).map(entry => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    onNext={NEXT_STATUS[col.id] ? () => handleStatusChange(entry.id, NEXT_STATUS[col.id]) : null}
                    onNoShow={() => handleStatusChange(entry.id, 'no_show')}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Walk-in Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Walk-in Patient"
        footer={
          <>
            <button onClick={() => setAddOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAddQueue} className="btn-primary">Add to Queue</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Patient Phone / Search</label>
            <input
              className="form-input"
              placeholder="Enter patient phone number"
              value={form.patient_id}
              onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Doctor</label>
            <select className="form-select" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
              <option value="">Any available doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Triage</label>
            <div className="flex gap-2">
              {['normal','urgent','emergency'].map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, triage: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all capitalize ${
                    form.triage === t
                      ? t === 'emergency' ? 'bg-danger text-white border-danger'
                        : t === 'urgent' ? 'bg-warning text-white border-warning'
                        : 'bg-success text-white border-success'
                      : 'bg-white text-ink-muted border-border hover:bg-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason / Chief Complaint</label>
            <input className="form-input" placeholder="Brief reason for visit" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function QueueCard({ entry, onNext, onNoShow }) {
  const waitMin = entry.checked_in_at
    ? Math.floor((Date.now() - new Date(entry.checked_in_at).getTime()) / 60000)
    : 0

  return (
    <div className="bg-white rounded-xl border border-border p-3 shadow-xs hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-brand leading-none">#{entry.queue_number}</span>
          <TriageDot triage={entry.triage} />
        </div>
        <Badge status={entry.triage} />
      </div>
      <p className="text-sm font-semibold text-ink leading-tight">{entry.patients?.name || 'Walk-in'}</p>
      <p className="text-xs text-ink-muted mt-0.5">{entry.doctors?.name || 'Any doctor'}</p>
      {entry.reason && <p className="text-xs text-ink-faint mt-1 truncate">{entry.reason}</p>}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-2xs text-ink-faint flex items-center gap-1">
          <Clock size={10} /> {waitMin}m wait
        </span>
        {onNext && (
          <button onClick={onNext} className="btn-primary btn-sm py-1 text-xs">
            Move →
          </button>
        )}
      </div>
    </div>
  )
}
