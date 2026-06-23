'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Plus, Video, Link, Send, PhoneOff, ExternalLink } from 'lucide-react'
import dayjs from 'dayjs'

export default function TelemedicinePage() {
  const [rooms, setRooms] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', scheduled_at: '', notes: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [r, p, d] = await Promise.all([api.videoRooms(), api.patients(), api.doctors()])
      setRooms(r || [])
      setPatients(p || [])
      setDoctors(d || [])
    } catch {}
    setLoading(false)
  }

  async function handleCreate() {
    await api.createRoom(form)
    setCreateOpen(false)
    setForm({ patient_id: '', doctor_id: '', scheduled_at: '', notes: '' })
    loadAll()
  }

  async function handleStart(id) {
    const room = await api.startRoom(id)
    if (room?.host_link) window.open(room.host_link, '_blank')
    loadAll()
  }

  async function handleEnd(id) {
    await api.endRoom(id)
    loadAll()
  }

  async function handleSendLink(id) {
    await api.sendRoomLink(id)
    alert('Room link sent to patient via WhatsApp')
  }

  const active = rooms.filter(r => r.status === 'active')
  const scheduled = rooms.filter(r => r.status === 'scheduled')
  const past = rooms.filter(r => r.status === 'ended')

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Telemedicine</h1>
          <p className="page-subtitle">Video consultations via Jitsi Meet</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> New Room</button>
      </div>

      {/* Active rooms */}
      {active.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-ink mb-2">Live Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.map(room => (
              <RoomCard key={room.id} room={room} onStart={handleStart} onEnd={handleEnd} onSendLink={handleSendLink} isActive />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled rooms */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink mb-2">Scheduled</h2>
        {scheduled.length === 0 ? (
          <EmptyState icon={Video} title="No scheduled rooms" description="Create a new telemedicine room to get started" action={<button onClick={() => setCreateOpen(true)} className="btn-primary btn-sm"><Plus size={13} /> New Room</button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduled.map(room => (
              <RoomCard key={room.id} room={room} onStart={handleStart} onEnd={handleEnd} onSendLink={handleSendLink} />
            ))}
          </div>
        )}
      </div>

      {/* Past rooms */}
      {past.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title text-sm">Ended Rooms</span></div>
          <div className="overflow-x-auto"><table className="data-table">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Scheduled</th><th>Duration</th><th>Status</th></tr></thead>
            <tbody>
              {past.slice(0, 10).map(room => (
                <tr key={room.id}>
                  <td className="font-semibold text-sm">{room.patients?.name || room.appointments?.patients?.name}</td>
                  <td className="text-sm text-ink-muted">{room.doctors?.name || room.appointments?.doctors?.name}</td>
                  <td className="text-sm text-ink-muted">{room.scheduled_at ? dayjs(room.scheduled_at).format('D MMM HH:mm') : '—'}</td>
                  <td className="text-sm text-ink-muted">
                    {room.started_at && room.ended_at
                      ? `${Math.round((new Date(room.ended_at) - new Date(room.started_at)) / 60000)}m`
                      : '—'}
                  </td>
                  <td><Badge status={room.status} /></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {/* Create Room Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Telemedicine Room" footer={
        <><button onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleCreate} className="btn-primary">Create Room</button></>
      }>
        <div className="space-y-4">
          <div className="p-3 bg-brand-light border border-brand/20 rounded-xl text-sm text-ink-muted">
            A Jitsi Meet room link will be generated and automatically sent to the patient via WhatsApp.
          </div>
          <div className="form-group">
            <label className="form-label">Patient</label>
            <select className="form-select" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Doctor</label>
            <select className="form-select" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
              <option value="">Select doctor...</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Scheduled Date & Time</label>
            <input type="datetime-local" className="form-input" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reason for consultation..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function RoomCard({ room, onStart, onEnd, onSendLink, isActive }) {
  return (
    <div className={`card-padded border rounded-xl ${isActive ? 'border-brand/30 bg-brand-light' : 'border-border bg-white'}`}>
      <div className="flex justify-between items-start mb-2">
        <Badge status={room.status} />
        {isActive && <span className="flex items-center gap-1 text-2xs text-danger font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" /> LIVE</span>}
      </div>
      <p className="font-bold text-ink">{room.patients?.name || room.appointments?.patients?.name}</p>
      <p className="text-xs text-ink-muted">{room.doctors?.name || room.appointments?.doctors?.name}</p>
      {room.scheduled_at && (
        <p className="text-xs text-ink-faint mt-1">{dayjs(room.scheduled_at).format('D MMM YYYY · HH:mm')}</p>
      )}
      {room.host_link && (
        <a href={room.host_link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand flex items-center gap-1 mt-1 hover:underline">
          <Link size={10} /> View room link
        </a>
      )}
      <div className="flex gap-1.5 mt-3">
        {!isActive && (
          <button onClick={() => onStart(room.id)} className="btn-primary btn-sm flex-1">
            <Video size={12} /> Start
          </button>
        )}
        {isActive && (
          <a href={room.host_link} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm flex-1 flex items-center justify-center gap-1">
            <ExternalLink size={12} /> Join
          </a>
        )}
        <button onClick={() => onSendLink(room.id)} className="btn-secondary btn-sm" title="Send link to patient">
          <Send size={12} />
        </button>
        {isActive && (
          <button onClick={() => onEnd(room.id)} className="btn-danger btn-sm" title="End room">
            <PhoneOff size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
