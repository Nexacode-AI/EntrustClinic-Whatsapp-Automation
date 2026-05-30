import { api } from '../../lib/api'
import StatsCard from '../../components/StatsCard'
import RatingsChart from '../../components/RatingsChart'
import {
  CalendarCheck, CalendarClock, UserX, XCircle,
  Users, AlertTriangle, Star,
} from 'lucide-react'

export default async function AnalyticsPage() {
  let stats = null
  try { stats = await api.analytics() } catch {}

  const appt = stats?.appointments || {}
  const rev  = stats?.reviews || {}

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time clinic performance snapshot</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard label="Completed"  value={appt.completed} icon={CalendarCheck} color="green"  />
        <StatsCard label="Upcoming"   value={appt.upcoming}  icon={CalendarClock} color="blue"   />
        <StatsCard label="No-shows"   value={appt.no_show}   icon={UserX}         color="yellow" />
        <StatsCard label="Cancelled"  value={appt.cancelled} icon={XCircle}       color="red"    />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard label="Total Patients"      value={stats?.totalPatients}     icon={Users}         color="blue" />
        <StatsCard label="Open Escalations"    value={stats?.escalations?.open} icon={AlertTriangle} color="red"  />
        <StatsCard
          label="Positive Review Rate"
          value={rev.positiveRate != null ? `${rev.positiveRate}%` : null}
          icon={Star}
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feedback breakdown */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <p className="text-sm font-semibold text-slate-800 mb-1">Patient Feedback</p>
          <p className="text-xs text-slate-400 mb-6">Sentiment from post-visit reviews</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Positive', value: rev.excellent ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
              { label: 'Neutral',  value: rev.okay ?? 0,      color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',   dot: 'bg-amber-400' },
              { label: 'Negative', value: rev.not_great ?? 0, color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100',     dot: 'bg-red-500' },
            ].map(({ label, value, color, bg, border, dot }) => (
              <div key={label} className={`rounded-xl border p-4 ${bg} ${border}`}>
                <div className={`w-2 h-2 rounded-full ${dot} mb-3`} />
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <p className="text-sm font-semibold text-slate-800 mb-1">Appointment Status</p>
          <p className="text-xs text-slate-400 mb-4">Distribution across all states</p>
          <RatingsChart
            data={[
              { name: 'Completed', value: appt.completed ?? 0, color: '#10B981' },
              { name: 'Upcoming',  value: appt.upcoming  ?? 0, color: '#3B82F6' },
              { name: 'No-show',   value: appt.no_show   ?? 0, color: '#F59E0B' },
              { name: 'Cancelled', value: appt.cancelled ?? 0, color: '#EF4444' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
