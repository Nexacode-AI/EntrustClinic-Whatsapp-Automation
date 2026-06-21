'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Search, Plus, Receipt, CreditCard, TrendingUp, DollarSign, Printer, Check, X } from 'lucide-react'
import dayjs from 'dayjs'

const PAY_METHODS = ['cash', 'card', 'online_banking', 'panel', 'package']

export default function BillingPage() {
  const [invoices, setInvoices] = useState([])
  const [stats, setStats] = useState({})
  const [daily, setDaily] = useState({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [selectedInv, setSelectedInv] = useState(null)
  const [payForm, setPayForm] = useState({ payment_method: 'cash', amount_paid: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [inv, s, d] = await Promise.all([
        api.invoices({ status: statusFilter || undefined }),
        api.revenueStats(),
        api.dailySummary(),
      ])
      setInvoices(inv?.data || inv || [])
      setStats(s || {})
      setDaily(d || {})
    } catch {}
    setLoading(false)
  }

  useEffect(() => { setLoading(true); load() }, [statusFilter])

  function openPayment(inv) {
    setSelectedInv(inv)
    setPayForm({ payment_method: 'cash', amount_paid: inv.total || '', notes: '' })
    setPayOpen(true)
  }

  async function handlePayment() {
    await api.updatePayment(selectedInv.id, payForm)
    setPayOpen(false)
    load()
  }

  const filtered = invoices.filter(inv =>
    !search || inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) || inv.patients?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="page-subtitle">Invoices & payments</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary btn-sm">
          <Plus size={14} /> New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Today's Revenue", value: `RM ${(stats.today || 0).toFixed(2)}`, icon: DollarSign, color: 'bg-success-light', iconColor: 'text-success-dark' },
          { label: 'This Week', value: `RM ${(stats.week || 0).toFixed(2)}`, icon: TrendingUp, color: 'bg-brand-light', iconColor: 'text-brand' },
          { label: 'This Month', value: `RM ${(stats.month || 0).toFixed(2)}`, icon: CreditCard, color: 'bg-info-light', iconColor: 'text-info-dark' },
          { label: 'Outstanding', value: `RM ${(stats.outstanding || 0).toFixed(2)}`, icon: Receipt, color: 'bg-warning-light', iconColor: 'text-warning-dark' },
        ].map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className="stat-card">
            <div>
              <p className="stat-value text-base">{value}</p>
              <p className="stat-label">{label}</p>
            </div>
            <div className={`stat-icon-wrap ${color}`}>
              <Icon size={18} className={iconColor} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Invoice list */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <span className="card-title">Invoices</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input className="form-input pl-7 py-1.5 text-sm w-48" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="form-select py-1.5 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <EmptyState icon={Receipt} title="No invoices" description="Invoices will appear here" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id}>
                      <td><span className="font-mono text-brand font-semibold">{inv.invoice_number}</span></td>
                      <td>
                        <p className="font-medium text-ink text-sm">{inv.patients?.name}</p>
                        <p className="text-2xs text-ink-faint">{inv.patients?.phone}</p>
                      </td>
                      <td className="text-sm text-ink-muted">{dayjs(inv.created_at).format('D MMM YYYY')}</td>
                      <td>
                        <span className="font-bold text-ink">RM {parseFloat(inv.total || 0).toFixed(2)}</span>
                        {inv.discount_amount > 0 && <p className="text-2xs text-success-dark">-RM {parseFloat(inv.discount_amount).toFixed(2)}</p>}
                      </td>
                      <td><Badge status={inv.payment_status} /></td>
                      <td>
                        <div className="flex gap-1">
                          {inv.status !== 'paid' && (
                            <button onClick={() => openPayment(inv)} className="btn-primary btn-xs">
                              <Check size={11} /> Pay
                            </button>
                          )}
                          <button className="btn-ghost btn-xs"><Printer size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Daily summary */}
        <div className="card card-padded">
          <h3 className="card-title mb-3">Today&apos;s Summary</h3>
          <div className="space-y-2">
            {Object.entries(daily.byMethod || {}).map(([method, total]) => (
              <div key={method} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm capitalize text-ink">{method?.replace(/_/g, ' ')}</span>
                <p className="text-sm font-bold text-ink">RM {parseFloat(total || 0).toFixed(2)}</p>
              </div>
            ))}
            {Object.keys(daily.byMethod || {}).length === 0 && (
              <p className="text-sm text-ink-faint text-center py-4">No transactions today</p>
            )}
          </div>
          {(daily.totalPaid || 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex justify-between">
              <span className="font-bold text-ink">Total Collected</span>
              <span className="font-black text-brand">RM {parseFloat(daily.totalPaid || 0).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />

      {/* Payment Modal */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={`Record Payment — ${selectedInv?.invoice_number}`} footer={
        <><button onClick={() => setPayOpen(false)} className="btn-secondary">Cancel</button><button onClick={handlePayment} className="btn-primary">Record Payment</button></>
      }>
        <div className="space-y-4">
          <div className="bg-muted rounded-xl p-3 flex justify-between">
            <span className="text-sm text-ink-muted">Total Due</span>
            <span className="font-black text-ink">RM {parseFloat(selectedInv?.total_amount || 0).toFixed(2)}</span>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAY_METHODS.map(m => (
                <button key={m} onClick={() => setPayForm(f => ({ ...f, payment_method: m }))}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-all ${
                    payForm.payment_method === m ? 'bg-brand text-white border-brand' : 'bg-white border-border hover:bg-muted text-ink'
                  }`}>
                  {m.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Amount Paid (RM)</label>
            <input type="number" className="form-input" step="0.01" value={payForm.amount_paid} onChange={e => setPayForm(f => ({ ...f, amount_paid: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" placeholder="Reference number, notes..." value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function CreateInvoiceModal({ open, onClose, onCreated }) {
  const [patients, setPatients] = useState([])
  const [panels, setPanels] = useState([])
  const [form, setForm] = useState({ patient_id: '', panel_id: '', discount_amount: 0, notes: '' })
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }])

  useEffect(() => {
    if (open) {
      Promise.all([api.patients(), api.panels()]).then(([p, pan]) => {
        setPatients(p || [])
        setPanels(pan || [])
      }).catch(() => {})
    }
  }, [open])

  function addItem() {
    setItems(p => [...p, { description: '', quantity: 1, unit_price: 0 }])
  }

  const subtotal = items.reduce((s, it) => s + (it.quantity * it.unit_price), 0)
  const total = subtotal - (parseFloat(form.discount_amount) || 0)

  async function handleCreate() {
    await api.createInvoice({ ...form, items })
    onClose()
    onCreated()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Invoice" size="lg" footer={
      <><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleCreate} className="btn-primary">Create Invoice</button></>
    }>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Patient</label>
            <select className="form-select" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Panel / TPA</label>
            <select className="form-select" value={form.panel_id} onChange={e => setForm(f => ({ ...f, panel_id: e.target.value }))}>
              <option value="">Self-pay (cash)</option>
              {panels.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="form-label">Line Items</label>
            <button onClick={addItem} className="btn-ghost btn-xs"><Plus size={11} /> Add</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-1.5 px-2 text-xs text-ink-muted font-medium">Description</th>
                <th className="text-right py-1.5 px-2 text-xs text-ink-muted font-medium w-16">Qty</th>
                <th className="text-right py-1.5 px-2 text-xs text-ink-muted font-medium w-24">Price (RM)</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-1 px-1"><input className="form-input py-1 text-sm" value={item.description} onChange={e => setItems(p => p.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it))} placeholder="Item description" /></td>
                  <td className="py-1 px-1"><input type="number" className="form-input py-1 text-sm text-right" min={1} value={item.quantity} onChange={e => setItems(p => p.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))} /></td>
                  <td className="py-1 px-1"><input type="number" className="form-input py-1 text-sm text-right" step="0.01" value={item.unit_price} onChange={e => setItems(p => p.map((it, idx) => idx === i ? { ...it, unit_price: parseFloat(e.target.value) || 0 } : it))} /></td>
                  <td className="py-1"><button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="text-danger p-1"><X size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-4 text-sm">
          <div className="text-right space-y-1">
            <div className="flex gap-4"><span className="text-ink-muted">Subtotal</span><span className="font-semibold">RM {subtotal.toFixed(2)}</span></div>
            <div className="flex gap-4 items-center">
              <span className="text-ink-muted">Discount</span>
              <input type="number" className="form-input py-1 w-24 text-right text-sm" step="0.01" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: e.target.value }))} />
            </div>
            <div className="flex gap-4 pt-1 border-t border-border"><span className="font-bold text-ink">Total</span><span className="font-black text-brand">RM {total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
