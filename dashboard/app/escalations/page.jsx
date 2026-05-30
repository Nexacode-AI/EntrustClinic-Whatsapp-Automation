import { api } from '../../lib/api'
import EscalationsList from '../../components/EscalationsList'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export default async function EscalationsPage() {
  let escalations = []
  try { escalations = await api.escalations({ resolved: 'false' }) } catch {}

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle size={16} className="text-red-500" />
        </div>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Escalations</h1>
            <p className="text-sm text-slate-500">Patients who need human follow-up</p>
          </div>
          {escalations.length > 0 && (
            <span className="bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-full">
              {escalations.length} open
            </span>
          )}
        </div>
      </div>

      {escalations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-20 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-emerald-500" />
          </div>
          <p className="text-slate-800 font-semibold text-lg">All clear!</p>
          <p className="text-sm text-slate-400 mt-1">No open escalations right now.</p>
        </div>
      ) : (
        <EscalationsList initialEscalations={escalations} />
      )}
    </div>
  )
}
