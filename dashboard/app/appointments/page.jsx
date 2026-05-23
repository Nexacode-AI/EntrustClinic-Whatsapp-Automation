import { api } from '../../lib/api'
import AppointmentTable from '../../components/AppointmentTable'
import CalendarView from '../../components/CalendarView'
import { CalendarDays, List, Calendar } from 'lucide-react'

const TABS = [
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'no_show',   label: 'No-shows' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default async function AppointmentsPage({ searchParams }) {
  const status = searchParams?.status || 'upcoming'
  const view = searchParams?.view || 'list'
  let data = []
  try {
    const res = await api.appointments({ status, limit: 200 })
    data = res.data || []
  } catch {}

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={20} className="text-brand" />
          <h1 className="text-2xl font-bold text-ink">Appointments</h1>
        </div>
        <p className="text-sm text-ink-secondary ml-7">Manage and track all patient appointments</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        {/* Status tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit shadow-sm">
          {TABS.map(({ key, label }) => (
            <a
              key={key}
              href={`/appointments?status=${key}&view=${view}`}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all ${
                status === key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 shadow-sm">
          <a
            href={`/appointments?status=${status}&view=list`}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
              view === 'list'
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <List size={14} />
            List
          </a>
          <a
            href={`/appointments?status=${status}&view=calendar`}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
              view === 'calendar'
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Calendar size={14} />
            Calendar
          </a>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView appointments={data} />
      ) : (
        <AppointmentTable appointments={data} />
      )}
    </div>
  )
}
