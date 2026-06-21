export default function StatsCard({ label, value, icon: Icon, accent = '#0E7490', sub, trend, trendLabel }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">{label}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
            <Icon size={15} style={{ color: accent }} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className="text-3xl font-extrabold text-ink tracking-tight">{value ?? 0}</p>
      {sub && <p className="text-xs text-ink-faint">{sub}</p>}
      {trend != null && (
        <p className={`text-xs font-semibold ${trend >= 0 ? 'text-success-dark' : 'text-danger-dark'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% {trendLabel || 'vs yesterday'}
        </p>
      )}
    </div>
  )
}
