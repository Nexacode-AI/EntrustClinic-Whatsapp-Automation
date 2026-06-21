'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Plus, Building2, FileText, Clock } from 'lucide-react'
import dayjs from 'dayjs'

const TABS = ['Panels', 'Claims', 'Aging Report']
const CLAIM_STATUSES = ['pending', 'submitted', 'acknowledged', 'paid', 'rejected']

export default function PanelPage() {
  const [tab, setTab] = useState('Panels')
  const [panels, setPanels] = useState([])
  const [claims, setClaims] = useState([])
  const [aging, setAging] = useState({})
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [p, c, a] = await Promise.all([api.panels(), api.panelClaims(), api.claimAging()])
      setPanels(p || [])
      setClaims(c || [])
      setAging(a || {})
    } catch {}
    setLoading(false)
  }

  async function handleAddPanel() {
    await api.createPanel(form)
    setAddOpen(false)
    setForm({ name: '', contact: '', email: '', phone: '' })
    loadAll()
  }

  async function updateClaimStatus(id, status) {
    await api.updateClaim(id, { status })
    loadAll()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  const totalOutstanding = (aging['<30'] || 0) + (aging['30-60'] || 0) + (aging['60-90'] || 0) + (aging['>90'] || 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel / TPA</h1>
          <p className="page-subtitle">Corporate panel billing & claims</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Add Panel</button>
      </div>

      <div className="card">
        <div className="tab-list border-b border-border px-4">
          {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'tab-active' : ''}`}>{t}</button>)}
        </div>

        {tab === 'Panels' && (
          <div>
            {panels.length === 0 ? (
              <EmptyState icon={Building2} title="No panel companies" description="Add corporate panel companies to enable panel billing" action={<button onClick={() => setAddOpen(true)} className="btn-primary btn-sm"><Plus size={13} /> Add Panel</button>} />
            ) : (
              <table className="data-table">
                <thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
                <tbody>
                  {panels.map(p => (
                    <tr key={p.id}>
                      <td className="font-semibold text-sm">{p.name}</td>
                      <td className="text-sm text-ink-muted">{p.contact}</td>
                      <td className="text-sm text-ink-muted">{p.email}</td>
                      <td className="text-sm text-ink-muted">{p.phone}</td>
                      <td><Badge status={p.status || 'active'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'Claims' && (
          <div>
            {claims.length === 0 ? (
              <EmptyState icon={FileText} title="No claims" description="Panel claims will appear here when panel invoices are created" />
            ) : (
              <table className="data-table">
                <thead><tr><th>Claim Ref</th><th>Patient</th><th>Panel</th><th>Amount</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
                <tbody>
                  {claims.map(c => (
                    <tr key={c.id}>
                      <td className="font-mono text-brand font-semibold text-sm">{c.claim_number || '—'}</td>
                      <td className="text-sm">{c.invoices?.patients?.name}</td>
                      <td className="text-sm">{c.panel_companies?.name}</td>
                      <td className="font-semibold text-sm">RM {parseFloat(c.amount || 0).toFixed(2)}</td>
                      <td><Badge status={c.status} /></td>
                      <td className="text-sm text-ink-muted">{c.submitted_at ? dayjs(c.submitted_at).format('D MMM YYYY') : '—'}</td>
                      <td>
                        {c.status === 'pending' && (
                          <button onClick={() => updateClaimStatus(c.id, 'submitted')} className="btn-primary btn-xs">Submit</button>
                        )}
                        {c.status === 'submitted' && (
                          <button onClick={() => updateClaimStatus(c.id, 'acknowledged')} className="btn-ghost btn-xs">Acknowledge</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'Aging Report' && (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Accounts Receivable Aging</h3>
              <span className="text-sm font-bold text-ink">Total Outstanding: <span className="text-brand">RM {parseFloat(totalOutstanding).toFixed(2)}</span></span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Current (<30 days)', key: '<30', color: 'bg-success-light border-success/20 text-success-dark' },
                { label: '30–60 days', key: '30-60', color: 'bg-warning-light border-warning/20 text-warning-dark' },
                { label: '60–90 days', key: '60-90', color: 'bg-orange-50 border-orange-200 text-orange-700' },
                { label: 'Overdue (>90 days)', key: '>90', color: 'bg-danger-light border-danger/20 text-danger-dark' },
              ].map(({ label, key, color }) => (
                <div key={key} className={`card-padded border rounded-xl ${color}`}>
                  <p className="text-xs font-medium opacity-75">{label}</p>
                  <p className="text-2xl font-black mt-1">RM {parseFloat(aging[key] || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="text-xs text-ink-faint">Aging is calculated from the invoice date. Overdue accounts (&gt;90 days) require immediate follow-up.</p>
            </div>
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Panel Company" footer={
        <><button onClick={() => setAddOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleAddPanel} className="btn-primary">Add Panel</button></>
      }>
        <div className="space-y-3">
          {[['name','Company Name'],['contact','Contact Person'],['email','Email'],['phone','Phone']].map(([k,l]) => (
            <div key={k} className="form-group">
              <label className="form-label">{l}</label>
              <input className="form-input" type={k === 'email' ? 'email' : 'text'} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
