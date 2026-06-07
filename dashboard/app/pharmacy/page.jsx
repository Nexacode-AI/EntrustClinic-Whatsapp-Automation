'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Pill, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'

export default function PharmacyPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dispensing, setDispensing] = useState(false)
  const [interactions, setInteractions] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const p = await api.pendingRx({ status: 'pending' })
      setPrescriptions(p || [])
    } catch {}
    setLoading(false)
  }

  async function selectRx(rx) {
    setSelected(rx)
    setInteractions([])
    if (rx.prescription_items?.length > 1) {
      try {
        const drugs = rx.prescription_items.map(i => i.drug_name)
        const r = await api.checkInteractions(drugs)
        setInteractions(r?.interactions || [])
      } catch {}
    }
  }

  async function dispenseAll() {
    if (!selected) return
    setDispensing(true)
    try {
      for (const item of selected.prescription_items || []) {
        if (!item.dispensed) {
          await api.dispenseItem(item.id, { quantity: item.quantity || 1 })
        }
      }
      await api.updateRxStatus(selected.id, 'dispensed')
      setSelected(null)
      load()
    } catch {}
    setDispensing(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispensary</h1>
          <p className="page-subtitle">Pending prescriptions queue</p>
        </div>
        <button onClick={load} className="btn-ghost btn-sm"><RefreshCw size={14} /></button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-var(--header-h)-10rem)]">
        {/* Prescription queue */}
        <div className="w-80 flex-shrink-0 card overflow-hidden flex flex-col">
          <div className="card-header">
            <span className="card-title text-sm">Pending Rx</span>
            <span className="badge badge-yellow text-xs">{prescriptions.length}</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
            {prescriptions.length === 0 ? (
              <EmptyState icon={Pill} title="No pending prescriptions" description="Dispensed — you're all caught up" />
            ) : (
              prescriptions.map(rx => (
                <button
                  key={rx.id}
                  onClick={() => selectRx(rx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selected?.id === rx.id ? 'bg-brand-light border-brand/30' : 'bg-white border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-ink">{rx.consultations?.patients?.name}</p>
                    <Badge status={rx.status} />
                  </div>
                  <p className="text-2xs text-ink-muted mt-0.5">{rx.prescription_items?.length || 0} item(s)</p>
                  <p className="text-2xs text-ink-faint">{dayjs(rx.created_at).format('D MMM HH:mm')}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Dispense panel */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          {!selected ? (
            <EmptyState icon={Pill} title="Select a prescription" description="Choose a prescription from the queue to dispense" />
          ) : (
            <>
              <div className="p-4 border-b border-border flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-ink">{selected.consultations?.patients?.name}</h2>
                  <p className="text-2xs text-ink-muted">Prescribed by {selected.consultations?.doctors?.name} · {dayjs(selected.created_at).format('D MMM YYYY HH:mm')}</p>
                </div>
                <button
                  onClick={dispenseAll}
                  disabled={dispensing}
                  className="btn-primary"
                >
                  <Check size={14} /> {dispensing ? 'Dispensing...' : 'Dispense All'}
                </button>
              </div>

              {interactions.length > 0 && (
                <div className="mx-4 mt-4 p-3 bg-danger-light border border-danger/20 rounded-xl flex gap-2">
                  <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-danger-dark">Drug Interaction Warning</p>
                    {interactions.map((intx, i) => (
                      <p key={i} className="text-xs text-ink-muted mt-0.5">{intx.drug1} + {intx.drug2}: {intx.description}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(selected.prescription_items || []).map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${item.dispensed ? 'bg-success-light border-success/20' : 'bg-white border-border'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-ink">{item.drug_name}</p>
                        <p className="text-sm text-ink-muted mt-0.5">{item.dosage} · {item.frequency} · {item.duration}</p>
                        {item.instructions && <p className="text-xs text-ink-faint mt-0.5 italic">{item.instructions}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-ink">Qty: {item.quantity || 1}</p>
                        {item.dispensed && <span className="badge badge-green mt-1">Dispensed</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
