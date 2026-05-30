const colorMap = {
  green:   { num: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '#10b981', iconBg: '#d1fae5' },
  blue:    { num: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', iconBg: '#dbeafe' },
  yellow:  { num: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '#f59e0b', iconBg: '#fef3c7' },
  red:     { num: '#dc2626', bg: '#fff1f2', border: '#fecaca', icon: '#ef4444', iconBg: '#fee2e2' },
  teal:    { num: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: '#0ea5e9', iconBg: '#e0f2fe' },
  purple:  { num: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', icon: '#8b5cf6', iconBg: '#ede9fe' },
  default: { num: '#374151', bg: '#f9fafb', border: '#e5e7eb', icon: '#6b7280', iconBg: '#f3f4f6' },
}

export default function StatsCard({ label, value, icon: Icon, color = 'default', sub }) {
  const c = colorMap[color] || colorMap.default

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.num, opacity: 0.7 }}>{label}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.iconBg }}>
            <Icon size={16} style={{ color: c.icon }} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight" style={{ color: c.num }}>
        {value ?? 0}
      </p>
      {sub && <p className="text-xs mt-2" style={{ color: c.num, opacity: 0.6 }}>{sub}</p>}
    </div>
  )
}
