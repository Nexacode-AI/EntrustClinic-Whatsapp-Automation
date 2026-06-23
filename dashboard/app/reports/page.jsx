'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { EmptyState } from '../../components/ui/EmptyState'
import { BarChart2, TrendingUp, Users, Stethoscope, Pill } from 'lucide-react'
import dayjs from 'dayjs'

const TABS = ['Revenue', 'Doctor Productivity', 'Top Diagnoses', 'Drug Usage', 'Demographics']

export default function ReportsPage() {
  const [tab, setTab] = useState('Revenue')
  const [revenue, setRevenue] = useState([])
  const [productivity, setProductivity] = useState([])
  const [diagnoses, setDiagnoses] = useState([])
  const [drugUsage, setDrugUsage] = useState([])
  const [demographics, setDemographics] = useState({})
  const [period, setPeriod] = useState('monthly')
  const [year, setYear] = useState(dayjs().year().toString())
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [tab, period, year])

  async function loadAll() {
    setLoading(true)
    try {
      if (tab === 'Revenue') {
        const r = await api.revenueReport({ period, year })
        setRevenue(r || [])
      } else if (tab === 'Doctor Productivity') {
        const r = await api.doctorProductivity({ year })
        setProductivity(r || [])
      } else if (tab === 'Top Diagnoses') {
        const r = await api.diagnoses({ year })
        setDiagnoses(r || [])
      } else if (tab === 'Drug Usage') {
        const r = await api.drugUsage({ year })
        setDrugUsage(r || [])
      } else if (tab === 'Demographics') {
        const r = await api.demographics()
        setDemographics(r || {})
      }
    } catch {}
    setLoading(false)
  }

  const maxRevenue = revenue.length ? Math.max(...revenue.map(r => r.total || 0)) : 1

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Clinic performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="form-select py-1.5 text-sm" value={year} onChange={e => setYear(e.target.value)}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {tab === 'Revenue' && (
            <select className="form-select py-1.5 text-sm" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="daily">Daily (this month)</option>
            </select>
          )}
        </div>
      </div>

      <div className="card">
        <div className="tab-list border-b border-border px-4">
          {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'tab-active' : ''}`}>{t}</button>)}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              {tab === 'Revenue' && (
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-4">Revenue — {year} ({period})</h3>
                  {revenue.length === 0 ? (
                    <EmptyState icon={BarChart2} title="No revenue data" description="Revenue data will appear once invoices are created" />
                  ) : (
                    <div className="space-y-2">
                      {revenue.map((row, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-24 text-xs text-ink-muted text-right flex-shrink-0">{row.label || row.date || row.month}</span>
                          <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-lg transition-all flex items-center px-2"
                              style={{ width: `${Math.max(2, ((row.total || 0) / maxRevenue) * 100)}%` }}
                            >
                              <span className="text-xs text-white font-semibold truncate">RM {parseFloat(row.total || 0).toFixed(0)}</span>
                            </div>
                          </div>
                          <span className="w-28 text-xs font-bold text-ink text-right flex-shrink-0">RM {parseFloat(row.total || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'Doctor Productivity' && (
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-4">Consultations by Doctor — {year}</h3>
                  {productivity.length === 0 ? (
                    <EmptyState icon={Stethoscope} title="No data" />
                  ) : (
                    <div className="overflow-x-auto"><table className="data-table">
                      <thead><tr><th>Doctor</th><th>Consultations</th><th>Completed</th><th>Revenue Generated</th></tr></thead>
                      <tbody>
                        {productivity.map((row, i) => (
                          <tr key={i}>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center text-brand text-xs font-bold">{row.doctor_name?.[0] || 'D'}</div>
                                <span className="font-semibold text-sm">{row.doctor_name}</span>
                              </div>
                            </td>
                            <td className="font-bold text-sm">{row.total_consultations}</td>
                            <td className="text-sm text-success-dark font-semibold">{row.completed}</td>
                            <td className="font-bold text-sm text-brand">RM {parseFloat(row.revenue || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  )}
                </div>
              )}

              {tab === 'Top Diagnoses' && (
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-4">Top ICD-10 Diagnoses — {year}</h3>
                  {diagnoses.length === 0 ? (
                    <EmptyState icon={Stethoscope} title="No diagnosis data" />
                  ) : (
                    <div className="space-y-2">
                      {diagnoses.slice(0, 20).map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 text-xs text-ink-faint font-bold text-right">{i + 1}</span>
                          <span className="font-mono text-xs font-semibold text-brand w-16 flex-shrink-0">{d.code}</span>
                          <span className="flex-1 text-sm text-ink truncate">{d.description}</span>
                          <div className="w-32 h-5 bg-muted rounded overflow-hidden">
                            <div className="h-full bg-teal-500 rounded" style={{ width: `${(d.count / (diagnoses[0]?.count || 1)) * 100}%` }} />
                          </div>
                          <span className="w-12 text-xs font-bold text-ink text-right">{d.count}x</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'Drug Usage' && (
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-4">Top Prescribed Drugs — {year}</h3>
                  {drugUsage.length === 0 ? (
                    <EmptyState icon={Pill} title="No drug data" />
                  ) : (
                    <div className="overflow-x-auto"><table className="data-table">
                      <thead><tr><th>Drug</th><th>Prescriptions</th><th>Units Dispensed</th></tr></thead>
                      <tbody>
                        {drugUsage.map((d, i) => (
                          <tr key={i}>
                            <td>
                              <p className="font-semibold text-sm">{d.drug_name}</p>
                              <p className="text-2xs text-ink-faint">{d.generic_name}</p>
                            </td>
                            <td className="font-bold text-sm">{d.prescriptions}</td>
                            <td className="text-sm font-semibold text-brand">{d.units_dispensed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  )}
                </div>
              )}

              {tab === 'Demographics' && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-ink mb-3">Gender Split</h3>
                    <div className="space-y-2">
                      {(demographics.gender || []).map(g => (
                        <div key={g.gender} className="flex items-center gap-2">
                          <span className="w-16 text-sm capitalize text-ink-muted">{g.gender}</span>
                          <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                            <div className="h-full bg-brand rounded" style={{ width: `${(g.count / (demographics.total || 1)) * 100}%` }} />
                          </div>
                          <span className="w-16 text-xs font-bold text-right">{g.count} ({Math.round((g.count / (demographics.total || 1)) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink mb-3">Age Groups</h3>
                    <div className="space-y-2">
                      {(demographics.age_groups || []).map(ag => (
                        <div key={ag.group} className="flex items-center gap-2">
                          <span className="w-16 text-sm text-ink-muted">{ag.group}</span>
                          <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                            <div className="h-full bg-teal-500 rounded" style={{ width: `${(ag.count / (demographics.total || 1)) * 100}%` }} />
                          </div>
                          <span className="w-8 text-xs font-bold text-right">{ag.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
