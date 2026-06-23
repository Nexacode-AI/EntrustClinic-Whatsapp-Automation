'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Plus, Users, LogIn, LogOut, Clock, Calendar } from 'lucide-react'
import dayjs from 'dayjs'

const TABS = ['Staff', 'Attendance', 'Leave Requests']
const ROLES = ['doctor', 'nurse', 'receptionist', 'pharmacist', 'admin', 'manager']

export default function StaffPage() {
  const [tab, setTab] = useState('Staff')
  const [staff, setStaff] = useState([])
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [clockForm, setClockForm] = useState({ staff_id: '' })
  const [form, setForm] = useState({ name: '', role: 'nurse', ic_number: '', phone: '', email: '', salary_basic: '', commission_rate: '' })
  const [leaveForm, setLeaveForm] = useState({ staff_id: '', type: 'annual', start_date: '', end_date: '', reason: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [s, a, l] = await Promise.all([api.staff(), api.attendance({ date: dayjs().format('YYYY-MM-DD') }), api.leaves({ status: 'pending' })])
      setStaff(s || [])
      setAttendance(a || [])
      setLeaves(l || [])
    } catch {}
    setLoading(false)
  }

  async function handleAdd() {
    await api.createStaff(form)
    setAddOpen(false)
    setForm({ name: '', role: 'nurse', ic_number: '', phone: '', email: '', salary_basic: '', commission_rate: '' })
    loadAll()
  }

  async function handleClockIn(staffId) {
    await api.clockIn({ staff_id: staffId })
    loadAll()
  }

  async function handleClockOut(staffId) {
    await api.clockOut({ staff_id: staffId })
    loadAll()
  }

  async function handleLeaveAction(id, status) {
    await api.updateLeave(id, status)
    loadAll()
  }

  const staffClockedIn = new Set(attendance.filter(a => !a.clock_out).map(a => a.staff_id))

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Team, attendance & leave</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLeaveOpen(true)} className="btn-secondary btn-sm"><Calendar size={13} /> Apply Leave</button>
          <button onClick={() => setAddOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Add Staff</button>
        </div>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="stat-card">
          <div><p className="stat-value">{staff.length}</p><p className="stat-label">Total Staff</p></div>
          <div className="stat-icon-wrap bg-brand-light"><Users size={18} className="text-brand" /></div>
        </div>
        <div className="stat-card">
          <div><p className="stat-value">{staffClockedIn.size}</p><p className="stat-label">Present Today</p></div>
          <div className="stat-icon-wrap bg-success-light"><LogIn size={18} className="text-success-dark" /></div>
        </div>
        <div className="stat-card">
          <div><p className="stat-value">{leaves.length}</p><p className="stat-label">Pending Leave</p></div>
          <div className="stat-icon-wrap bg-warning-light"><Calendar size={18} className="text-warning-dark" /></div>
        </div>
      </div>

      <div className="card">
        <div className="tab-list border-b border-border px-4">
          {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'tab-active' : ''}`}>{t}</button>)}
        </div>

        {tab === 'Staff' && (
          <div>
            {staff.length === 0 ? (
              <EmptyState icon={Users} title="No staff" description="Add your clinic staff members" action={<button onClick={() => setAddOpen(true)} className="btn-primary btn-sm"><Plus size={13} /> Add Staff</button>} />
            ) : (
              <div className="overflow-x-auto"><table className="data-table">
                <thead><tr><th>Name</th><th>Role</th><th>IC Number</th><th>Phone</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {staff.map(s => {
                    const isClockedIn = staffClockedIn.has(s.id)
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center">
                              <span className="text-brand text-xs font-bold">{s.name?.[0]}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{s.name}</p>
                              <p className="text-2xs text-ink-faint">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-gray capitalize">{s.role}</span></td>
                        <td className="font-mono text-sm">{s.ic_number}</td>
                        <td className="text-sm text-ink-muted">{s.phone}</td>
                        <td className="font-semibold text-sm">RM {parseFloat(s.salary_basic || 0).toFixed(2)}</td>
                        <td>
                          {isClockedIn
                            ? <span className="badge badge-green">Clocked In</span>
                            : <span className="badge badge-gray">Out</span>
                          }
                        </td>
                        <td>
                          {isClockedIn
                            ? <button onClick={() => handleClockOut(s.id)} className="btn-ghost btn-xs text-danger"><LogOut size={11} /> Clock Out</button>
                            : <button onClick={() => handleClockIn(s.id)} className="btn-ghost btn-xs text-success-dark"><LogIn size={11} /> Clock In</button>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table></div>
            )}
          </div>
        )}

        {tab === 'Attendance' && (
          <div>
            {attendance.length === 0 ? (
              <EmptyState icon={Clock} title="No attendance today" description="Staff check-in/out will appear here" />
            ) : (
              <div className="overflow-x-auto"><table className="data-table">
                <thead><tr><th>Staff</th><th>Role</th><th>Clock In</th><th>Clock Out</th><th>Hours</th></tr></thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.id}>
                      <td className="font-semibold text-sm">{a.staff_profiles?.name}</td>
                      <td><span className="badge badge-gray capitalize">{a.staff_profiles?.role}</span></td>
                      <td className="text-sm text-ink-muted">{a.clock_in ? dayjs(a.clock_in).format('HH:mm') : '—'}</td>
                      <td className="text-sm text-ink-muted">{a.clock_out ? dayjs(a.clock_out).format('HH:mm') : <span className="badge badge-green text-xs">Active</span>}</td>
                      <td className="font-semibold text-sm">{a.hours_worked ? `${parseFloat(a.hours_worked).toFixed(1)}h` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        )}

        {tab === 'Leave Requests' && (
          <div>
            {leaves.length === 0 ? (
              <EmptyState icon={Calendar} title="No pending leave requests" />
            ) : (
              <div className="overflow-x-auto"><table className="data-table">
                <thead><tr><th>Staff</th><th>Type</th><th>Start</th><th>End</th><th>Reason</th><th>Actions</th></tr></thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id}>
                      <td className="font-semibold text-sm">{l.staff_profiles?.name}</td>
                      <td><span className="badge badge-blue capitalize">{(l.type || l.leave_type)?.replace(/_/g, ' ')}</span></td>
                      <td className="text-sm">{dayjs(l.start_date).format('D MMM YYYY')}</td>
                      <td className="text-sm">{dayjs(l.end_date).format('D MMM YYYY')}</td>
                      <td className="text-sm text-ink-muted max-w-xs truncate">{l.reason}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => handleLeaveAction(l.id, 'approved')} className="btn-success btn-xs">Approve</button>
                          <button onClick={() => handleLeaveAction(l.id, 'rejected')} className="btn-danger btn-xs">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Staff Member" footer={
        <><button onClick={() => setAddOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleAdd} className="btn-primary">Add Staff</button></>
      }>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">IC Number</label>
            <input className="form-input" value={form.ic_number} onChange={e => setForm(f => ({ ...f, ic_number: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Salary (RM)</label>
            <input type="number" step="0.01" className="form-input" value={form.salary_basic} onChange={e => setForm(f => ({ ...f, salary_basic: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Commission Rate (%)</label>
            <input type="number" step="0.1" min="0" max="100" className="form-input" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Apply Leave Modal */}
      <Modal open={leaveOpen} onClose={() => setLeaveOpen(false)} title="Apply Leave" footer={
        <><button onClick={() => setLeaveOpen(false)} className="btn-secondary">Cancel</button><button onClick={async () => { await api.applyLeave(leaveForm); setLeaveOpen(false); loadAll() }} className="btn-primary">Apply</button></>
      }>
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Staff Member</label>
            <select className="form-select" value={leaveForm.staff_id} onChange={e => setLeaveForm(f => ({ ...f, staff_id: e.target.value }))}>
              <option value="">Select staff...</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select className="form-select" value={leaveForm.type} onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}>
              {['annual','sick','emergency','maternity','paternity','unpaid'].map(t => <option key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={leaveForm.start_date} onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={leaveForm.end_date} onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-textarea" rows={2} value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
