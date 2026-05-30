'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import ConversationView from '../../components/ConversationView'
import { MessageSquare, Trash2 } from 'lucide-react'

function ConversationsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedPhone = searchParams.get('phone')

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.conversations({ limit: 50 }).then(setConversations).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedPhone) {
      api.messages(selectedPhone).then(setMessages).catch(() => {})
    } else {
      setMessages([])
    }
  }, [selectedPhone])

  async function deleteConversation(phone, e) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this conversation and all messages? Patient record is kept.')) return
    try {
      await api.deleteConversation(phone)
      setConversations((prev) => prev.filter((c) => c.phone !== phone))
      if (selectedPhone === phone) router.push('/conversations')
      showToast('Conversation deleted')
    } catch { showToast('Delete failed', false) }
  }

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
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
            className={`group flex items-start justify-between px-4 py-3 border-b border-border transition-colors ${
              selectedPhone === c.phone
                ? 'bg-brand/5 border-l-2 border-l-brand'
                : 'hover:bg-muted'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-semibold text-ink truncate">{c.patients?.name || c.phone}</p>
                {c.is_escalated && (
                  <span className="text-xs bg-red-100 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full font-bold ml-1">!</span>
                )}
              </div>
              <p className="text-xs text-ink-muted font-mono truncate">{c.phone}</p>
              <p className="text-xs text-ink-muted mt-0.5 capitalize">{c.state?.toLowerCase().replace(/_/g, ' ')}</p>
            </div>
            <button
              onClick={(e) => deleteConversation(c.phone, e)}
              className="opacity-0 group-hover:opacity-100 ml-2 mt-0.5 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
              title="Delete conversation"
            >
              <Trash2 size={13} />
            </button>
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

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border shadow-lg bg-card z-50 ${
          toast.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'
        }`}>
          <span className="font-bold">{toast.ok ? '✓' : '✗'}</span> {toast.msg}
        </div>
      )}
    </div>
  )
}

export default function ConversationsPage() {
  return (
    <Suspense>
      <ConversationsInner />
    </Suspense>
  )
}
