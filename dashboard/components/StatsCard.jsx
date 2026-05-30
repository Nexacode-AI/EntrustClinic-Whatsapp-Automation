import { cn } from '../lib/utils'

const colorMap = {
  green:  { num: 'text-emerald-600', bg: 'bg-emerald-50',  icon: 'text-emerald-500', border: 'border-emerald-100' },
  blue:   { num: 'text-blue-600',    bg: 'bg-blue-50',     icon: 'text-blue-500',    border: 'border-blue-100' },
  yellow: { num: 'text-amber-600',   bg: 'bg-amber-50',    icon: 'text-amber-500',   border: 'border-amber-100' },
  red:    { num: 'text-red-600',     bg: 'bg-red-50',      icon: 'text-red-500',     border: 'border-red-100' },
  teal:   { num: 'text-teal-600',    bg: 'bg-teal-50',     icon: 'text-teal-500',    border: 'border-teal-100' },
  purple: { num: 'text-purple-600',  bg: 'bg-purple-50',   icon: 'text-purple-500',  border: 'border-purple-100' },
  default:{ num: 'text-slate-700',   bg: 'bg-slate-100',   icon: 'text-slate-500',   border: 'border-slate-100' },
}

export default function StatsCard({ label, value, icon: Icon, color = 'default', sub, trend }) {
  const c = colorMap[color] || colorMap.default

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 group">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', c.bg, c.border)}>
            <Icon size={15} className={c.icon} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className={cn('text-3xl font-bold tracking-tight', c.num)}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
      {trend !== undefined && (
        <p className={cn('text-xs mt-2 font-medium', trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  )
}
