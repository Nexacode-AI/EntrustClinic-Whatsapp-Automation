import { api } from '../../lib/api'
import StatsCard from '../../components/StatsCard'
import {
  CalendarCheck, CalendarClock, UserX, XCircle,
  Users, AlertTriangle, Star, ThumbsUp, Meh, ThumbsDown,
} from 'lucide-react'

export default async function AnalyticsPage() {
  let stats = null
  try { stats = await api.analytics() } catch {}

  const appt = stats?.appointments || {}
  const rev  = stats?.reviews || {}

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Overview</h1>
        <p className="text-sm text-ink-secondary mt-1">Real-time clinic performance snapshot</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatsCard label="Completed" value={appt.completed} icon={CalendarCheck} color="green" />
        <StatsCard label="Upcoming"  value={appt.upcoming}  icon={CalendarClock} color="blue"  />
        <StatsCard label="No-shows"  value={appt.no_show}   icon={UserX}         color="yellow"/>
        <StatsCard label="Cancelled" value={appt.cancelled} icon={XCircle}       color="red"   />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <StatsCard label="Total Patients"      value={stats?.totalPatients}     icon={Users}         color="blue" />
        <StatsCard label="Open Escalations"    value={stats?.escalations?.open} icon={AlertTriangle} color="red"  />
        <StatsCard
          label="Positive Review Rate"
          value={rev.positiveRate != null ? `${rev.positiveRate}%` : null}
          icon={Star}
          color="teal"
        />
      </div>

      {/* Ratings */}
      <div className="bg-card rounded-xl border border-border p-6">
        <p className="text-sm font-semibold text-ink mb-5">Patient Ratings This Month</p>
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: ThumbsUp,   label: 'Excellent', value: rev.excellent ?? 0, cls: 'bg-emerald-50 text-emerald-500 ring-emerald-100', num: 'text-emerald-600' },
            { icon: Meh,        label: 'Okay',      value: rev.okay ?? 0,      cls: 'bg-amber-50 text-amber-500 ring-amber-100',       num: 'text-amber-600' },
            { icon: ThumbsDown, label: 'Not Great', value: rev.not_great ?? 0, cls: 'bg-red-50 text-red-500 ring-red-100',             num: 'text-red-600' },
          ].map(({ icon: Icon, label, value, cls, num }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center ${cls}`}>
                <Icon size={17} strokeWidth={2} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${num}`}>{value}</p>
                <p className="text-xs text-ink-muted mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
