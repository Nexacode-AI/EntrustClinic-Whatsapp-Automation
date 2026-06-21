'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Plus, DollarSign, FileText, Check } from 'lucide-react'
import dayjs from 'dayjs'

export default function PayrollPage() {
  const [runs, setRuns] = useState([])
  const [selected, setSelected] = useState(null)
  const [runDetail, setRunDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [genForm, setGenForm] = useState({ period_month: dayjs().format('YYYY-MM') })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const r = await api.payrollRuns()
      setRuns(r || [])
    } catch {}
    setLoading(false)
  }

  async function selectRun(run) {
    setSelected(run)
    try {
      const detail = await api.payrollRun(run.id)
      setRunDetail(detail)
    } catch {}
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const [yearStr, monthStr] = genForm.period_month.split('-')
      const run = await api.generatePayroll({ month: parseInt(monthStr), year: parseInt(yearStr) })
      setGenOpen(false)
      await load()
      selectRun(run)
    } catch {}
    setGenerating(false)
  }

  async function handleApprove(runId) {
    await api.approvePayroll(runId)
    load()
    if (selected?.id === runId) selectRun({ ...selected, status: 'approved' })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">Monthly payroll with EPF, SOCSO & EIS</p>
        </div>
        <button onClick={() => setGenOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Generate Payroll</button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-var(--header-h)-10rem)]">
        {/* Runs list */}
        <div className="w-72 flex-shrink-0 card overflow-hidden flex flex-col">
          <div className="card-header"><span className="card-title text-sm">Payroll Runs</span></div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
            {runs.length === 0 ? (
              <EmptyState icon={DollarSign} title="No payroll runs" description="Generate payroll to get started" />
            ) : (
              runs.map(run => (
                <button key={run.id} onClick={() => selectRun(run)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selected?.id === run.id ? 'bg-brand-light border-brand/30' : 'bg-white border-border hover:bg-muted'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-ink">{run.period_month}</span>
                    <Badge status={run.status} />
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{run.staff_count || 0} staff · RM {parseFloat(run.total_gross || 0).toFixed(2)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Run detail */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          {!selected ? (
            <EmptyState icon={DollarSign} title="Select a payroll run" description="View detailed payroll breakdown per staff" />
          ) : (
            <>
              <div className="p-4 border-b border-border flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-ink">Payroll — {selected.period_month}</h2>
                  <p className="text-xs text-ink-muted">{runDetail?.payroll_items?.length || 0} staff members</p>
                </div>
                {selected.status === 'draft' && (
                  <button onClick={() => handleApprove(selected.id)} className="btn-primary btn-sm"><Check size={13} /> Approve Payroll</button>
                )}
              </div>

              {/* Summary row */}
              {runDetail && (
                <div className="grid grid-cols-4 gap-3 p-4 border-b border-border">
                  {[
                    { label: 'Total Gross', value: `RM ${parseFloat(runDetail.total_gross || 0).toFixed(2)}`, color: 'text-ink' },
                    { label: 'EPF (Employer 13%)', value: `RM ${parseFloat(runDetail.total_epf_employer || 0).toFixed(2)}`, color: 'text-brand' },
                    { label: 'SOCSO + EIS', value: `RM ${parseFloat((runDetail.total_socso_employer || 0) + (runDetail.total_eis_employer || 0)).toFixed(2)}`, color: 'text-info-dark' },
                    { label: 'Net Payable', value: `RM ${parseFloat(runDetail.total_net || 0).toFixed(2)}`, color: 'text-success-dark font-black' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-3 bg-muted rounded-xl">
                      <p className="text-2xs text-ink-faint font-medium">{label}</p>
                      <p className={`text-base font-bold mt-0.5 ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {(runDetail?.payroll_items || []).length === 0 ? (
                  <EmptyState icon={FileText} title="No payroll items" />
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Staff</th>
                        <th>Basic</th>
                        <th>Commission</th>
                        <th>EPF (Emp)</th>
                        <th>EPF (ER)</th>
                        <th>SOCSO</th>
                        <th>EIS</th>
                        <th>PCB</th>
                        <th>Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(runDetail?.payroll_items || []).map(item => (
                        <tr key={item.id}>
                          <td>
                            <p className="font-semibold text-sm">{item.staff_profiles?.name}</p>
                            <p className="text-2xs text-ink-faint capitalize">{item.staff_profiles?.role}</p>
                          </td>
                          <td className="text-sm font-semibold">RM {parseFloat(item.basic_salary || 0).toFixed(2)}</td>
                          <td className="text-sm text-success-dark">+RM {parseFloat(item.commissions || 0).toFixed(2)}</td>
                          <td className="text-sm text-danger-dark">-RM {parseFloat(item.epf_employee || 0).toFixed(2)}</td>
                          <td className="text-sm text-brand">RM {parseFloat(item.epf_employer || 0).toFixed(2)}</td>
                          <td className="text-sm text-danger-dark">-RM {parseFloat(item.socso_employee || 0).toFixed(2)}</td>
                          <td className="text-sm text-danger-dark">-RM {parseFloat(item.eis_employee || 0).toFixed(2)}</td>
                          <td className="text-sm text-danger-dark">-RM {parseFloat(item.pcb || 0).toFixed(2)}</td>
                          <td className="font-black text-sm text-success-dark">RM {parseFloat(item.net_pay || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate Payroll" footer={
        <><button onClick={() => setGenOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleGenerate} disabled={generating} className="btn-primary">{generating ? 'Generating...' : 'Generate'}</button></>
      }>
        <div className="space-y-4">
          <div className="p-3 bg-brand-light border border-brand/20 rounded-xl text-sm text-ink-muted">
            Payroll will be calculated for all active staff with Malaysian statutory deductions: EPF (11%/13%), SOCSO (0.5%/1.75%), EIS (0.2%/0.2%), and PCB (simplified schedule).
          </div>
          <div className="form-group">
            <label className="form-label">Payroll Month</label>
            <input type="month" className="form-input" value={genForm.period_month} onChange={e => setGenForm(f => ({ ...f, period_month: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={2} value={genForm.notes} onChange={e => setGenForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes for this payroll run..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
