'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Plus, Receipt, TrendingDown, TrendingUp, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState({})
  const [pl, setPl] = useState({})
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [form, setForm] = useState({ category_id: '', description: '', amount: '', date: dayjs().format('YYYY-MM-DD'), vendor: '', receipt_number: '' })

  useEffect(() => { loadAll() }, [month])

  async function loadAll() {
    try {
      const [e, c, s, p] = await Promise.all([
        api.expenses({ month }),
        api.expenseCategories(),
        api.expenseSummary({ month }),
        api.profitLoss({ month }),
      ])
      setExpenses(e?.data || e || [])
      setCategories(c || [])
      setSummary(s || {})
      setPl(p || {})
    } catch {}
    setLoading(false)
  }

  async function handleAdd() {
    await api.createExpense(form)
    setAddOpen(false)
    setForm({ category_id: '', description: '', amount: '', date: dayjs().format('YYYY-MM-DD'), vendor: '', receipt_number: '' })
    loadAll()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return
    await api.deleteExpense(id)
    loadAll()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  const profit = (pl.revenue || 0) - (pl.expenses || 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Clinic expense tracking</p>
        </div>
        <div className="flex gap-2">
          <input type="month" className="form-input py-1.5 text-sm" value={month} onChange={e => setMonth(e.target.value)} />
          <button onClick={() => setAddOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Add Expense</button>
        </div>
      </div>

      {/* P&L summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="stat-card">
          <div><p className="stat-value text-base">RM {parseFloat(pl.revenue || 0).toFixed(2)}</p><p className="stat-label">Revenue</p></div>
          <div className="stat-icon-wrap bg-success-light"><TrendingUp size={18} className="text-success-dark" /></div>
        </div>
        <div className="stat-card">
          <div><p className="stat-value text-base">RM {parseFloat(pl.expenses || 0).toFixed(2)}</p><p className="stat-label">Expenses</p></div>
          <div className="stat-icon-wrap bg-danger-light"><TrendingDown size={18} className="text-danger-dark" /></div>
        </div>
        <div className={`stat-card border-2 ${profit >= 0 ? 'border-success/30 bg-success-light/50' : 'border-danger/30 bg-danger-light/50'}`}>
          <div>
            <p className={`stat-value text-base ${profit >= 0 ? 'text-success-dark' : 'text-danger-dark'}`}>RM {profit.toFixed(2)}</p>
            <p className="stat-label">Net Profit</p>
          </div>
          <div className={`stat-icon-wrap ${profit >= 0 ? 'bg-success-light' : 'bg-danger-light'}`}>
            {profit >= 0 ? <TrendingUp size={18} className="text-success-dark" /> : <TrendingDown size={18} className="text-danger-dark" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expense list */}
        <div className="lg:col-span-2 card">
          <div className="card-header"><span className="card-title">Expenses — {dayjs(month).format('MMMM YYYY')}</span></div>
          {expenses.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses" description="Add expenses to track clinic overhead" action={<button onClick={() => setAddOpen(true)} className="btn-primary btn-sm"><Plus size={13} /> Add Expense</button>} />
          ) : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Vendor</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="text-sm text-ink-muted">{dayjs(e.date).format('D MMM')}</td>
                    <td><span className="badge badge-gray text-xs">{e.expense_categories?.name || '—'}</span></td>
                    <td className="text-sm">{e.description}</td>
                    <td className="text-sm text-ink-muted">{e.vendor}</td>
                    <td className="font-bold text-sm text-danger-dark">RM {parseFloat(e.amount || 0).toFixed(2)}</td>
                    <td>
                      <button onClick={() => handleDelete(e.id)} className="text-ink-faint hover:text-danger transition-colors p-1">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card card-padded">
          <h3 className="card-title mb-3">By Category</h3>
          <div className="space-y-2">
            {(summary.by_category || []).map(cat => (
              <div key={cat.name} className="flex justify-between items-center py-1">
                <span className="text-sm text-ink">{cat.name}</span>
                <span className="font-bold text-sm text-ink">RM {parseFloat(cat.total || 0).toFixed(2)}</span>
              </div>
            ))}
            {(!summary.by_category || summary.by_category.length === 0) && (
              <p className="text-sm text-ink-faint text-center py-4">No data</p>
            )}
            {summary.total > 0 && (
              <div className="mt-2 pt-2 border-t border-border flex justify-between">
                <span className="font-bold text-sm text-ink">Total</span>
                <span className="font-black text-sm text-danger-dark">RM {parseFloat(summary.total || 0).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Expense" footer={
        <><button onClick={() => setAddOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleAdd} className="btn-primary">Add</button></>
      }>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">Select category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 form-group">
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (RM)</label>
            <input type="number" step="0.01" className="form-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Vendor</label>
            <input className="form-input" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Receipt Number</label>
            <input className="form-input" value={form.receipt_number} onChange={e => setForm(f => ({ ...f, receipt_number: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
