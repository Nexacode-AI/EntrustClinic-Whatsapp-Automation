export default function StatsCard({ label, value, icon: Icon, color = 'default', sub }) {
  const colors = {
    green:   { num: 'text-emerald-600', bg: 'bg-emerald-50',  icon: 'text-emerald-500', ring: 'ring-emerald-100' },
    blue:    { num: 'text-blue-600',    bg: 'bg-blue-50',     icon: 'text-blue-500',    ring: 'ring-blue-100' },
    yellow:  { num: 'text-amber-600',   bg: 'bg-amber-50',    icon: 'text-amber-500',   ring: 'ring-amber-100' },
    red:     { num: 'text-red-600',     bg: 'bg-red-50',      icon: 'text-red-500',     ring: 'ring-red-100' },
    teal:    { num: 'text-brand',       bg: 'bg-brand-light', icon: 'text-brand',       ring: 'ring-cyan-100' },
    default: { num: 'text-ink',         bg: 'bg-slate-100',   icon: 'text-ink-secondary',ring: 'ring-slate-100' },
  }
  const c = colors[color] || colors.default

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-secondary font-medium">{label}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
            <Icon size={16} className={c.icon} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold tracking-tight ${c.num}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-ink-muted mt-2">{sub}</p>}
    </div>
  )
}
