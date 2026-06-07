import { Inbox } from 'lucide-react'

export function EmptyState({ icon: Icon = Inbox, title = 'No data', description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={22} className="text-ink-faint" />
      </div>
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
