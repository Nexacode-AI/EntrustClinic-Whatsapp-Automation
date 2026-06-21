'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Plus, Star, Gift, Search } from 'lucide-react'
import dayjs from 'dayjs'

const TIERS = {
  bronze:   { min: 0,    max: 499,   color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  silver:   { min: 500,  max: 1499,  color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
  gold:     { min: 1500, max: 4999,  color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  platinum: { min: 5000, max: Infinity, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
}

const TABS = ['Rewards Catalogue', 'Transactions', 'Patient Lookup']

export default function LoyaltyPage() {
  const [tab, setTab] = useState('Rewards Catalogue')
  const [rewards, setRewards] = useState([])
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState('')
  const [patientLoyalty, setPatientLoyalty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addRewardOpen, setAddRewardOpen] = useState(false)
  const [rewardForm, setRewardForm] = useState({ name: '', description: '', points_required: '', value_rm: '', is_active: true })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [r, tx] = await Promise.all([api.rewards(), api.loyaltyTx()])
      setRewards(r || [])
      setTransactions(tx || [])
    } catch {}
    setLoading(false)
  }

  async function handleAddReward() {
    await api.createReward(rewardForm)
    setAddRewardOpen(false)
    setRewardForm({ name: '', description: '', points_required: '', value_rm: '', is_active: true })
    loadAll()
  }

  async function lookupPatient(phone) {
    if (!phone) return
    try {
      const pts = await api.patients({ search: phone })
      if (pts?.[0]) {
        const loyalty = await api.patientLoyalty(pts[0].id)
        setPatientLoyalty({ ...pts[0], loyalty })
      }
    } catch {}
  }

  const getTier = (points) => {
    for (const [tier, range] of Object.entries(TIERS)) {
      if (points >= range.min && points <= range.max) return tier
    }
    return 'bronze'
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Loyalty Program</h1>
          <p className="page-subtitle">Bronze · Silver · Gold · Platinum</p>
        </div>
        <button onClick={() => setAddRewardOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Add Reward</button>
      </div>

      {/* Tier overview */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Object.entries(TIERS).map(([tier, range]) => (
          <div key={tier} className={`card-padded border rounded-xl ${range.bg}`}>
            <p className={`text-sm font-bold capitalize ${range.color}`}>{tier}</p>
            <p className="text-xs text-ink-faint mt-0.5">{range.min} – {range.max === Infinity ? '∞' : range.max} pts</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="tab-list border-b border-border px-4">
          {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'tab-active' : ''}`}>{t}</button>)}
        </div>

        {tab === 'Rewards Catalogue' && (
          <div className="p-4">
            {rewards.length === 0 ? (
              <EmptyState icon={Gift} title="No rewards" description="Add rewards that patients can redeem with their points" action={<button onClick={() => setAddRewardOpen(true)} className="btn-primary btn-sm"><Plus size={13} /> Add Reward</button>} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map(r => (
                  <div key={r.id} className="card-padded border border-border rounded-xl">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-ink">{r.name}</h3>
                      <Badge status={r.is_active ? 'active' : 'inactive'} />
                    </div>
                    {r.description && <p className="text-sm text-ink-muted mt-1">{r.description}</p>}
                    <div className="mt-3 flex gap-4 text-sm">
                      <div><p className="text-ink-faint text-xs">Points Req.</p><p className="font-bold text-brand">{r.points_required} pts</p></div>
                      {r.value_rm && <div><p className="text-ink-faint text-xs">Value</p><p className="font-bold text-success-dark">RM {parseFloat(r.value_rm).toFixed(2)}</p></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Transactions' && (
          <div>
            {transactions.length === 0 ? (
              <EmptyState icon={Star} title="No transactions" description="Point transactions will appear here" />
            ) : (
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Type</th><th>Points</th><th>Description</th><th>Date</th></tr></thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td className="font-semibold text-sm">{tx.patients?.name || tx.patient_loyalty?.patients?.name}</td>
                      <td><Badge status={tx.type === 'earn' ? 'active' : 'inactive'} label={tx.type === 'earn' ? 'Earned' : 'Redeemed'} /></td>
                      <td>
                        <span className={`font-bold text-sm ${tx.type === 'earn' ? 'text-success-dark' : 'text-danger-dark'}`}>
                          {tx.type === 'earn' ? '+' : '-'}{tx.points}
                        </span>
                      </td>
                      <td className="text-sm text-ink-muted">{tx.description}</td>
                      <td className="text-sm text-ink-muted">{dayjs(tx.created_at).format('D MMM YYYY')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'Patient Lookup' && (
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input className="form-input pl-7" placeholder="Search patient by phone or name..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupPatient(search)} />
              </div>
              <button onClick={() => lookupPatient(search)} className="btn-primary">Lookup</button>
            </div>

            {patientLoyalty && (
              <div className="space-y-4">
                <div className={`p-4 border rounded-xl ${TIERS[getTier(patientLoyalty.loyalty?.points || 0)].bg}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-ink text-lg">{patientLoyalty.name}</h3>
                      <p className="text-sm text-ink-muted">{patientLoyalty.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${TIERS[getTier(patientLoyalty.loyalty?.points || 0)].color}`}>
                        {patientLoyalty.loyalty?.points || 0} pts
                      </p>
                      <p className={`text-sm font-bold capitalize ${TIERS[getTier(patientLoyalty.loyalty?.points || 0)].color}`}>
                        {getTier(patientLoyalty.loyalty?.points || 0)} Tier
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-ink-muted">
                    Lifetime points: <span className="font-semibold text-ink">{patientLoyalty.loyalty?.lifetime_points || 0}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={async () => { await api.earnPoints({ patient_id: patientLoyalty.id, points: 10, description: 'Manual bonus' }); lookupPatient(search) }} className="btn-secondary btn-sm"><Star size={13} /> Add 10 Points</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={addRewardOpen} onClose={() => setAddRewardOpen(false)} title="Add Reward" footer={
        <><button onClick={() => setAddRewardOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleAddReward} className="btn-primary">Add Reward</button></>
      }>
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Reward Name</label>
            <input className="form-input" placeholder="e.g. Free Consultation" value={rewardForm.name} onChange={e => setRewardForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={2} value={rewardForm.description} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Points Required</label>
              <input type="number" className="form-input" value={rewardForm.points_required} onChange={e => setRewardForm(f => ({ ...f, points_required: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Value (RM)</label>
              <input type="number" step="0.01" className="form-input" value={rewardForm.value_rm} onChange={e => setRewardForm(f => ({ ...f, value_rm: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
