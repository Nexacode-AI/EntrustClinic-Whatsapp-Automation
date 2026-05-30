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
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
          <CalendarDays size={16} className="text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-sm text-slate-500">Manage and track all patient appointments</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        {/* Status tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {TABS.map(({ key, label }) => (
            <a
              key={key}
              href={`/appointments?status=${key}&view=${view}`}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all ${
                status === key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <a href={`/appointments?status=${status}&view=list`}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${view === 'list' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <List size={14} /> List
          </a>
          <a href={`/appointments?status=${status}&view=calendar`}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${view === 'calendar' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <Calendar size={14} /> Calendar
          </a>
        </div>
      </div>

      {view === 'calendar' ? <CalendarView appointments={data} /> : <AppointmentTable appointments={data} />}
    </div>
  )
}
