import { api } from '../../lib/api'
import ConversationView from '../../components/ConversationView'
import { MessageSquare } from 'lucide-react'

export default async function ConversationsPage({ searchParams }) {
  const selectedPhone = searchParams?.phone || null
  let conversations = []
  let messages = []

  try { conversations = await api.conversations({ limit: 50 }) } catch {}
  if (selectedPhone) {
    try { messages = await api.messages(selectedPhone) } catch {}
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left — list */}
      <div className="w-72 shrink-0 bg-card rounded-xl border border-border overflow-y-auto shadow-sm">
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-brand" />
            <p className="font-semibold text-sm text-ink">Conversations</p>
          </div>
        </div>
        {conversations.length === 0 ? (
          <p className="text-center text-ink-muted text-sm py-10">No conversations yet</p>
        ) : conversations.map((c) => (
          <a
            key={c.phone}
            href={`/conversations?phone=${encodeURIComponent(c.phone)}`}
            className={`block px-4 py-3 border-b border-border transition-colors ${
              selectedPhone === c.phone
                ? 'bg-brand/5 border-l-2 border-l-brand'
                : 'hover:bg-muted'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-sm font-semibold text-ink truncate">{c.patients?.name || c.phone}</p>
              {c.is_escalated && (
                <span className="text-xs bg-red-100 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full font-bold">!</span>
              )}
            </div>
            <p className="text-xs text-ink-muted font-mono truncate">{c.phone}</p>
            <p className="text-xs text-ink-muted mt-0.5 capitalize">{c.state?.toLowerCase().replace(/_/g, ' ')}</p>
          </a>
        ))}
      </div>

      {/* Right — chat */}
      <div className="flex-1 min-w-0">
        {selectedPhone
          ? <ConversationView phone={selectedPhone} messages={messages} />
          : (
            <div className="h-full flex flex-col items-center justify-center bg-card rounded-xl border border-border shadow-sm">
              <MessageSquare size={36} className="text-slate-300 mb-3" />
              <p className="text-ink-secondary font-medium">Select a conversation</p>
              <p className="text-sm text-ink-muted mt-1">Choose a patient from the left to view messages</p>
            </div>
          )
        }
      </div>
    </div>
  )
}
