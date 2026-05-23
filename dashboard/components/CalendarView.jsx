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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink">{dayjs(day).format('D MMMM YYYY')}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-lg leading-none">✕</button>
        </div>
        {appts.length === 0 ? (
          <p className="text-ink-muted text-sm text-center py-4">No appointments</p>
        ) : (
          <div className="space-y-2">
            {appts.map(a => {
              const color = STATUS_COLOR[a.status] || STATUS_COLOR.upcoming
              return (
                <div key={a.id} className={`p-3 rounded-xl border ${color.card}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <User size={12} />
                    <span className="font-semibold text-sm">{a.patients?.name || 'Unknown'}</span>
                  </div>
                  <p className="text-xs">{a.appointment_time?.slice(0, 5)} · {a.services?.name || '—'}</p>
                  <p className="text-xs font-mono mt-0.5 opacity-70">{a.patients?.phone}</p>
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
  const [current, setCurrent] = useState(
    firstAppt ? dayjs(firstAppt).startOf('month') : dayjs().startOf('month')
  )
  const [selected, setSelected] = useState(null)

  const prevMonth = () => setCurrent(c => c.subtract(1, 'month'))
  const nextMonth = () => setCurrent(c => c.add(1, 'month'))

  const startOfGrid = current.startOf('week')
  const days = Array.from({ length: 42 }, (_, i) => startOfGrid.add(i, 'day'))

  const apptsByDay = {}
  appointments.forEach(a => {
    const key = a.appointment_date
    if (!apptsByDay[key]) apptsByDay[key] = []
    apptsByDay[key].push(a)
  })

  const today = dayjs().format('YYYY-MM-DD')
  const selectedAppts = selected ? (apptsByDay[selected] || []) : []

  return (
    <>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-ink text-lg">{current.format('MMMM YYYY')}</h2>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft size={16} className="text-ink-secondary" />
            </button>
            <button onClick={() => setCurrent(dayjs().startOf('month'))} className="px-3 py-1 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-ink-secondary">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight size={16} className="text-ink-secondary" />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
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
                className={`min-h-[96px] p-2 border-b border-r border-border cursor-pointer transition-colors ${
                  isCurrentMonth ? 'bg-card hover:bg-muted/60' : 'bg-muted/30 hover:bg-muted/50'
                } ${isSelected ? 'ring-2 ring-inset ring-brand' : ''}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1.5 ${
                  isToday
                    ? 'bg-brand text-white'
                    : isCurrentMonth ? 'text-ink' : 'text-ink-muted'
                }`}>
                  {day.date()}
                </div>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 3).map(a => (
                    <AppointmentChip key={a.id} appt={a} />
                  ))}
                  {dayAppts.length > 3 && (
                    <p className="text-[10px] text-ink-muted pl-1">+{dayAppts.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-6 py-3 border-t border-border bg-muted/30">
          {Object.entries(STATUS_COLOR).map(([status, { dot }]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-xs text-ink-muted capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <DayModal
          day={selected}
          appts={selectedAppts.sort((a, b) => a.appointment_time > b.appointment_time ? 1 : -1)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
