import { api } from '../../lib/api'
import StatsCard from '../../components/StatsCard'
import RatingsChart from '../../components/RatingsChart'
import {
  CalendarCheck, CalendarClock, UserX, XCircle,
  Users, AlertTriangle, Star, TrendingUp,
} from 'lucide-react'

export default async function AnalyticsPage() {
  let stats = null
  try { stats = await api.analytics() } catch {}

  const appt = stats?.appointments || {}
  const rev  = stats?.reviews || {}

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0f172a' }}>Overview</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Real-time clinic performance snapshot</p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard label="Completed"  value={appt.completed} icon={CalendarCheck} color="green"  />
        <StatsCard label="Upcoming"   value={appt.upcoming}  icon={CalendarClock} color="blue"   />
        <StatsCard label="No-shows"   value={appt.no_show}   icon={UserX}         color="yellow" />
        <StatsCard label="Cancelled"  value={appt.cancelled} icon={XCircle}       color="red"    />
      </div>

      {/* Second stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard label="Total Patients"      value={stats?.totalPatients}     icon={Users}         color="teal"   />
        <StatsCard label="Open Escalations"    value={stats?.escalations?.open} icon={AlertTriangle} color="red"    />
        <StatsCard
          label="Positive Review Rate"
          value={rev.positiveRate != null ? `${rev.positiveRate}%` : null}
          icon={Star}
          color="purple"
        />
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Feedback breakdown — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} style={{ color: '#0ea5e9' }} />
            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Patient Feedback</p>
          </div>
          <p className="text-xs mb-6" style={{ color: '#94a3b8' }}>Sentiment from post-visit reviews</p>

          <div className="space-y-3">
            {[
              { label: 'Positive', value: rev.excellent ?? 0, color: '#059669', bg: '#ecfdf5', bar: '#10b981' },
              { label: 'Neutral',  value: rev.okay ?? 0,      color: '#d97706', bg: '#fffbeb', bar: '#f59e0b' },
              { label: 'Negative', value: rev.not_great ?? 0, color: '#dc2626', bg: '#fff1f2', bar: '#ef4444' },
            ].map(({ label, value, color, bg, bar }) => {
              const total = (rev.excellent ?? 0) + (rev.okay ?? 0) + (rev.not_great ?? 0)
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={label} className="p-4 rounded-xl" style={{ backgroundColor: bg }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold" style={{ color }}>{label}</p>
                    <p className="text-xl font-bold" style={{ color }}>{value}</p>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: `${bar}30` }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: bar }} />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color, opacity: 0.7 }}>{pct}% of total</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chart — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck size={15} style={{ color: '#0ea5e9' }} />
            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Appointment Status</p>
          </div>
          <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>Distribution across all states</p>

          <RatingsChart
            data={[
              { name: 'Completed', value: appt.completed ?? 0, color: '#10b981' },
              { name: 'Upcoming',  value: appt.upcoming  ?? 0, color: '#3b82f6' },
              { name: 'No-show',   value: appt.no_show   ?? 0, color: '#f59e0b' },
              { name: 'Cancelled', value: appt.cancelled ?? 0, color: '#ef4444' },
            ]}
          />

          {/* Quick stats below chart */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Completed', value: appt.completed ?? 0, color: '#10b981', bg: '#ecfdf5' },
              { label: 'Upcoming',  value: appt.upcoming  ?? 0, color: '#3b82f6', bg: '#eff6ff' },
              { label: 'No-show',   value: appt.no_show   ?? 0, color: '#f59e0b', bg: '#fffbeb' },
              { label: 'Cancelled', value: appt.cancelled ?? 0, color: '#ef4444', bg: '#fff1f2' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: bg }}>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color, opacity: 0.7 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
