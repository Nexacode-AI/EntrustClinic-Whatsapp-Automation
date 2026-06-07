'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Plus, Package, Search } from 'lucide-react'
import dayjs from 'dayjs'

const TABS = ['Package Plans', 'Patient Packages']

export default function PackagesPage() {
  const [tab, setTab] = useState('Package Plans')
  const [plans, setPlans] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [addPlanOpen, setAddPlanOpen] = useState(false)
  const [sellOpen, setSellOpen] = useState(false)
  const [planForm, setPlanForm] = useState({ name: '', description: '', total_sessions: '', validity_days: 365, price: '' })
  const [sellForm, setSellForm] = useState({ patient_id: '', plan_id: '', payment_method: 'cash' })
  const [patients, setPatients] = useState([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [p, pt] = await Promise.all([api.packagePlans(), api.patients()])
      setPlans(p || [])
      setPatients(pt || [])
    } catch {}
    setLoading(false)
  }

  async function handleAddPlan() {
    await api.createPlan(planForm)
    setAddPlanOpen(false)
    setPlanForm({ name: '', description: '', total_sessions: '', validity_days: 365, price: '' })
    loadAll()
  }

  async function handleSell() {
    await api.sellPackage(sellForm)
    setSellOpen(false)
    loadAll()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Treatment Packages</h1>
          <p className="page-subtitle">Prepaid session packages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSellOpen(true)} className="btn-secondary btn-sm"><Package size={13} /> Sell Package</button>
          <button onClick={() => setAddPlanOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> New Plan</button>
        </div>
      </div>

      <div className="card">
        <div className="tab-list border-b border-border px-4">
          {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'tab-active' : ''}`}>{t}</button>)}
        </div>

        {tab === 'Package Plans' && (
          <div className="p-4">
            {plans.length === 0 ? (
              <EmptyState icon={Package} title="No package plans" description="Create treatment package plans to sell to patients" action={<button onClick={() => setAddPlanOpen(true)} className="btn-primary btn-sm"><Plus size={13} /> Create Plan</button>} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map(plan => (
                  <div key={plan.id} className="card-padded border border-border rounded-xl hover:shadow-card-hover transition-all">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-ink">{plan.name}</h3>
                      <Badge status={plan.is_active ? 'active' : 'inactive'} />
                    </div>
                    {plan.description && <p className="text-sm text-ink-muted mt-1">{plan.description}</p>}
                    <div className="mt-3 flex gap-4 text-sm">
                      <div><p className="text-ink-faint text-xs">Sessions</p><p className="font-bold text-ink">{plan.total_sessions}</p></div>
                      <div><p className="text-ink-faint text-xs">Validity</p><p className="font-bold text-ink">{plan.validity_days} days</p></div>
                      <div><p className="text-ink-faint text-xs">Price</p><p className="font-bold text-brand">RM {parseFloat(plan.price || 0).toFixed(2)}</p></div>
                    </div>
                    <button onClick={() => { setSellForm(f => ({ ...f, plan_id: plan.id })); setSellOpen(true) }} className="btn-primary btn-sm w-full mt-3">
                      Sell to Patient
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Patient Packages' && (
          <div>
            <div className="p-3 border-b border-border">
              <div className="relative w-56">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input className="form-input pl-7 py-1.5 text-sm" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <EmptyState icon={Package} title="Search for a patient" description="Enter patient name above to see their packages" />
          </div>
        )}
      </div>

      {/* Add Plan Modal */}
      <Modal open={addPlanOpen} onClose={() => setAddPlanOpen(false)} title="New Package Plan" footer={
        <><button onClick={() => setAddPlanOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleAddPlan} className="btn-primary">Create Plan</button></>
      }>
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Plan Name</label>
            <input className="form-input" placeholder="e.g. Dental Cleaning Package" value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={2} value={planForm.description} onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="form-group">
              <label className="form-label">Sessions</label>
              <input type="number" className="form-input" min={1} value={planForm.total_sessions} onChange={e => setPlanForm(f => ({ ...f, total_sessions: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Validity (days)</label>
              <input type="number" className="form-input" min={1} value={planForm.validity_days} onChange={e => setPlanForm(f => ({ ...f, validity_days: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Price (RM)</label>
              <input type="number" step="0.01" className="form-input" value={planForm.price} onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Sell Package Modal */}
      <Modal open={sellOpen} onClose={() => setSellOpen(false)} title="Sell Package to Patient" footer={
        <><button onClick={() => setSellOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleSell} className="btn-primary">Sell Package</button></>
      }>
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Patient</label>
            <select className="form-select" value={sellForm.patient_id} onChange={e => setSellForm(f => ({ ...f, patient_id: e.target.value }))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Package Plan</label>
            <select className="form-select" value={sellForm.plan_id} onChange={e => setSellForm(f => ({ ...f, plan_id: e.target.value }))}>
              <option value="">Select plan...</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} — RM {parseFloat(p.price || 0).toFixed(2)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={sellForm.payment_method} onChange={e => setSellForm(f => ({ ...f, payment_method: e.target.value }))}>
              {['cash','card','online_banking'].map(m => <option key={m} value={m} className="capitalize">{m.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
