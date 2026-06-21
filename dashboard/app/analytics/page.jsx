import { api } from '../../lib/api'
import {
  CalendarCheck, Users, Clock, DollarSign,
  TrendingUp, Activity, AlertTriangle, CheckCircle,
} from 'lucide-react'
import dayjs from 'dayjs'

export default async function AnalyticsPage() {
  let stats = null, queue = null, appointments = null, revenue = null

  try {
    ;[stats, queue, appointments, revenue] = await Promise.allSettled([
      api.analytics(),
      api.queue(),
      api.appointments({ date: dayjs().format('YYYY-MM-DD'), limit: 8 }),
      api.revenueStats(),
    ]).then(r => r.map(r => r.status === 'fulfilled' ? r.value : null))
  } catch {}

  const appt   = stats?.appointments  || {}
  const today  = dayjs().format('dddd, D MMMM YYYY')
  const qList  = Array.isArray(queue) ? queue : []
  const aList  = Array.isArray(appointments) ? appointments : []

  const waiting      = qList.filter(q => q.status === 'waiting').length
  const inConsult    = qList.filter(q => q.status === 'in_consultation').length
  const todayRevenue = revenue?.today ?? 0

  const KPI = [
    {
      label: 'Today\'s Revenue',
      value: `RM ${parseFloat(todayRevenue).toFixed(2)}`,
      icon: DollarSign,
      accent: '#059669',
    },
    {
      label: 'Patients Today',
      value: qList.length,
      icon: Users,
      accent: '#0E7490',
    },
    {
      label: 'Waiting',
      value: waiting,
      icon: Clock,
      accent: '#D97706',
    },
    {
      label: 'In Consultation',
      value: inConsult,
      icon: Activity,
      accent: '#7C3AED',
    },
    {
      label: 'Completed Today',
      value: qList.filter(q => q.status === 'done').length,
      icon: CheckCircle,
      accent: '#059669',
    },
    {
      label: 'Appointments',
      value: appt.upcoming ?? 0,
      icon: CalendarCheck,
      accent: '#0E7490',
    },
    {
      label: 'Total Patients',
      value: stats?.totalPatients ?? 0,
      icon: Users,
      accent: '#0369A1',
    },
    {
      label: 'Open Escalations',
      value: stats?.escalations?.open ?? 0,
      icon: AlertTriangle,
      accent: '#DC2626',
    },
  ]

  const STATUS_BADGE = {
    confirmed:  { label: 'Confirmed',  cls: 'bg-blue-50 text-blue-700' },
    completed:  { label: 'Completed',  cls: 'bg-green-50 text-green-700' },
    cancelled:  { label: 'Cancelled',  cls: 'bg-red-50 text-red-700' },
    no_show:    { label: 'No Show',    cls: 'bg-red-50 text-red-700' },
    pending:    { label: 'Pending',    cls: 'bg-yellow-50 text-yellow-700' },
    rescheduled:{ label: 'Rescheduled',cls: 'bg-purple-50 text-purple-700' },
  }

  const QUEUE_BADGE = {
    waiting:         { label: 'Waiting',     cls: 'bg-yellow-50 text-yellow-700' },
    in_consultation: { label: 'In Consult',  cls: 'bg-teal-50 text-teal-700' },
    billing:         { label: 'Billing',     cls: 'bg-blue-50 text-blue-700' },
    done:            { label: 'Done',        cls: 'bg-green-50 text-green-700' },
    no_show:         { label: 'No Show',     cls: 'bg-red-50 text-red-700' },
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-success-dark font-semibold">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            System Live
          </span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {KPI.slice(0, 8).map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
                <Icon size={15} style={{ color: accent }} strokeWidth={2} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-ink tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Main content: queue + appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Today's Queue */}
        <div className="bg-white rounded-xl border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <p className="text-sm font-bold text-ink">Today&apos;s Queue</p>
              <p className="text-xs text-ink-muted mt-0.5">{qList.length} patients checked in</p>
            </div>
            <a href="/queue" className="text-xs font-semibold text-brand hover:underline">View all →</a>
          </div>

          {qList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Users size={18} className="text-ink-faint" />
              </div>
              <p className="text-sm font-semibold text-ink">No patients in queue</p>
              <p className="text-xs text-ink-muted mt-1">Walk-ins will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {qList.slice(0, 7).map(entry => {
                const badge = QUEUE_BADGE[entry.status] || { label: entry.status, cls: 'bg-muted text-ink-muted' }
                return (
                  <div key={entry.id} className="flex items-center px-5 py-3 hover:bg-muted/40 transition-colors">
                    <span className="text-base font-black text-brand w-10 flex-shrink-0">#{entry.queue_number}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{entry.patients?.name || 'Walk-in'}</p>
                      <p className="text-xs text-ink-faint">{entry.doctors?.name || '—'}</p>
                    </div>
                    <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                )
              })}
              {qList.length > 7 && (
                <div className="px-5 py-3 text-xs text-ink-faint text-center">+{qList.length - 7} more</div>
              )}
            </div>
          )}
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-xl border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <p className="text-sm font-bold text-ink">Today&apos;s Appointments</p>
              <p className="text-xs text-ink-muted mt-0.5">{aList.length} scheduled</p>
            </div>
            <a href="/appointments" className="text-xs font-semibold text-brand hover:underline">View all →</a>
          </div>

          {aList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                <CalendarCheck size={18} className="text-ink-faint" />
              </div>
              <p className="text-sm font-semibold text-ink">No appointments today</p>
              <p className="text-xs text-ink-muted mt-1">Scheduled appointments will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {aList.slice(0, 7).map(appt => {
                const badge = STATUS_BADGE[appt.status] || { label: appt.status, cls: 'bg-muted text-ink-muted' }
                return (
                  <div key={appt.id} className="flex items-center px-5 py-3 hover:bg-muted/40 transition-colors">
                    <div className="w-12 flex-shrink-0">
                      <p className="text-xs font-bold text-ink">{appt.time ? dayjs(`2000-01-01 ${appt.time}`).format('h:mm') : '—'}</p>
                      <p className="text-2xs text-ink-faint">{appt.time ? dayjs(`2000-01-01 ${appt.time}`).format('A') : ''}</p>
                    </div>
                    <div className="flex-1 min-w-0 ml-3">
                      <p className="text-sm font-semibold text-ink truncate">{appt.patients?.name || appt.patient_name || '—'}</p>
                      <p className="text-xs text-ink-faint">{appt.doctors?.name || appt.doctor_name || '—'}</p>
                    </div>
                    <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                )
              })}
              {aList.length > 7 && (
                <div className="px-5 py-3 text-xs text-ink-faint text-center">+{aList.length - 7} more</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Revenue summary row */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: 'Today', value: revenue?.today ?? 0 },
          { label: 'This Week', value: revenue?.week ?? 0 },
          { label: 'This Month', value: revenue?.month ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-border shadow-card px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-1">{label}</p>
              <p className="text-xl font-extrabold text-ink">RM {parseFloat(value).toFixed(2)}</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0E749018' }}>
              <TrendingUp size={15} style={{ color: '#0E7490' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
