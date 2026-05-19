import { api } from '../../lib/api'
import AppointmentTable from '../../components/AppointmentTable'
import { CalendarDays } from 'lucide-react'

const TABS = [
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'no_show',   label: 'No-shows' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default async function AppointmentsPage({ searchParams }) {
  const status = searchParams?.status || 'upcoming'
  let data = []
  try {
    const res = await api.appointments({ status, limit: 100 })
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

      <div className="flex gap-1 mb-6 bg-card border border-border rounded-xl p-1 w-fit shadow-sm">
        {TABS.map(({ key, label }) => (
          <a
            key={key}
            href={`/appointments?status=${key}`}
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

      <AppointmentTable appointments={data} />
    </div>
  )
}
