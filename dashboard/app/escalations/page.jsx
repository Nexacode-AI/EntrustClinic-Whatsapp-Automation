import { api } from '../../lib/api'
import dayjs from 'dayjs'
import { AlertTriangle, MessageSquare, CheckCircle, Phone } from 'lucide-react'

const REASON_LABELS = {
  low_rating:    'Low Rating',
  complaint:     'Complaint',
  staff_request: 'Staff Request',
  unknown:       'Unknown',
}

export default async function EscalationsPage() {
  let escalations = []
  try { escalations = await api.escalations({ resolved: 'false' }) } catch {}

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={20} className="text-red-500" />
          <h1 className="text-2xl font-bold text-ink">Escalations</h1>
          {escalations.length > 0 && (
            <span className="bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-2 py-0.5 rounded-full">
              {escalations.length} open
            </span>
          )}
        </div>
        <p className="text-sm text-ink-secondary ml-7">Patients who need human follow-up</p>
      </div>

      {escalations.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center shadow-sm">
          <CheckCircle size={36} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-ink font-semibold">All clear</p>
          <p className="text-sm text-ink-secondary mt-1">No open escalations right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {escalations.map((e) => (
            <div key={e.id} className="bg-card rounded-xl border border-border border-l-4 border-l-red-400 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{e.patients?.name || 'Unknown Patient'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-ink-muted text-xs">
                    <Phone size={11} />
                    {e.phone}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg font-medium">
                      {REASON_LABELS[e.reason] || e.reason?.replace('_', ' ') || 'Complaint'}
                    </span>
                    <span className="text-xs text-ink-muted">{dayjs(e.created_at).format('D MMM, h:mm A')}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <a
                    href={`/conversations?phone=${encodeURIComponent(e.phone)}`}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:text-ink hover:bg-muted transition-colors font-medium"
                  >
                    <MessageSquare size={13} />
                    View Chat
                  </a>
                  <a
                    href={`/api/escalations/${e.id}/resolve`}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white font-medium transition-colors shadow-sm"
                  >
                    <CheckCircle size={13} />
                    Resolve
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
