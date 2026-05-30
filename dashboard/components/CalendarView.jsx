'use client'
import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'

const STATUS_COLOR = {
  upcoming:  { dot: 'bg-blue-500',    card: 'bg-blue-50 border-blue-200 text-blue-700' },
  completed: { dot: 'bg-emerald-500', card: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  cancelled: { dot: 'bg-slate-400',   card: 'bg-slate-50 border-slate-200 text-slate-500' },
  no_show:   { dot: 'bg-amber-500',   card: 'bg-amber-50 border-amber-200 text-amber-700' },
}

function AppointmentChip({ appt }) {
  const color = STATUS_COLOR[appt.status] || STATUS_COLOR.upcoming
  return (
    <div className={`text-[10px] px-1.5 py-0.5 rounded border font-medium truncate leading-tight ${color.card}`}>
      {appt.appointment_time?.slice(0, 5)} {appt.patients?.name || 'Patient'}
    </div>
  )
}

function DayModal({ day, appts, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800">{dayjs(day).format('D MMMM YYYY')}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-lg leading-none">✕</button>
        </div>
        {appts.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No appointments</p>
        ) : (
          <div className="space-y-2">
            {appts.map((a) => {
              const color = STATUS_COLOR[a.status] || STATUS_COLOR.upcoming
              return (
                <div key={a.id} className={`p-4 rounded-xl border ${color.card}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <User size={12} />
                    <span className="font-semibold text-sm">{a.patients?.name || 'Unknown'}</span>
                  </div>
                  <p className="text-xs">{a.appointment_time?.slice(0, 5)} · {a.services?.name || '—'}</p>
                  <p className="text-xs font-mono mt-0.5 opacity-60">{a.patients?.phone}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalendarView({ appointments }) {
  const firstAppt = appointments[0]?.appointment_date
  const [current, setCurrent] = useState(firstAppt ? dayjs(firstAppt).startOf('month') : dayjs().startOf('month'))
  const [selected, setSelected] = useState(null)

  const startOfGrid = current.startOf('week')
  const days = Array.from({ length: 42 }, (_, i) => startOfGrid.add(i, 'day'))

  const apptsByDay = {}
  appointments.forEach((a) => {
    const key = a.appointment_date
    if (!apptsByDay[key]) apptsByDay[key] = []
    apptsByDay[key].push(a)
  })

  const today = dayjs().format('YYYY-MM-DD')

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-lg">{current.format('MMMM YYYY')}</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrent((c) => c.subtract(1, 'month'))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft size={16} className="text-slate-500" />
            </button>
            <button onClick={() => setCurrent(dayjs().startOf('month'))} className="px-3 py-1 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
              Today
            </button>
            <button onClick={() => setCurrent((c) => c.add(1, 'month'))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronRight size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = day.format('YYYY-MM-DD')
            const isCurrentMonth = day.month() === current.month()
            const isToday = key === today
            const dayAppts = apptsByDay[key] || []
            const isSelected = selected === key
            return (
              <div
                key={i}
                onClick={() => setSelected(isSelected ? null : key)}
                className={`min-h-24 p-2 border-b border-r border-slate-100 cursor-pointer transition-colors ${
                  isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'
                } ${isSelected ? 'ring-2 ring-inset ring-teal-500' : ''}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1.5 ${
                  isToday ? 'bg-teal-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  {day.date()}
                </div>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 3).map((a) => <AppointmentChip key={a.id} appt={a} />)}
                  {dayAppts.length > 3 && <p className="text-[10px] text-slate-400 pl-1">+{dayAppts.length - 3} more</p>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          {Object.entries(STATUS_COLOR).map(([status, { dot }]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-xs text-slate-400 capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <DayModal
          day={selected}
          appts={(apptsByDay[selected] || []).sort((a, b) => a.appointment_time > b.appointment_time ? 1 : -1)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
