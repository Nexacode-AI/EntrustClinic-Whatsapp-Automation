'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import ConversationView from '../../components/ConversationView'
import { MessageSquare, Trash2, Search } from 'lucide-react'

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
      <div className="w-72 shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-teal-600" />
            <p className="font-semibold text-sm text-slate-800">Conversations</p>
            <span className="ml-auto text-xs text-slate-400">{conversations.length}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Search size={20} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No conversations yet</p>
            </div>
          ) : conversations.map((c) => (
            <a
              key={c.phone}
              href={`/conversations?phone=${encodeURIComponent(c.phone)}`}
              className={`group flex items-start justify-between px-4 py-3.5 border-b border-slate-100 transition-colors outline-none ${
                selectedPhone === c.phone
                  ? 'bg-teal-50 border-l-2 border-l-teal-500'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.patients?.name || c.phone}</p>
                  {c.is_escalated && (
                    <span className="text-xs bg-red-100 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full font-bold ml-1 shrink-0">!</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono truncate">{c.phone}</p>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">{c.state?.toLowerCase().replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={(e) => deleteConversation(c.phone, e)}
                className="opacity-0 group-hover:opacity-100 ml-2 mt-0.5 p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                title="Delete conversation"
              >
                <Trash2 size={12} />
              </button>
            </a>
          ))}
        </div>
      </div>

      {/* Right — chat */}
      <div className="flex-1 min-w-0">
        {selectedPhone
          ? <ConversationView phone={selectedPhone} messages={messages} />
          : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <MessageSquare size={22} className="text-slate-400" />
              </div>
              <p className="text-slate-700 font-semibold">Select a conversation</p>
              <p className="text-sm text-slate-400 mt-1">Choose a patient from the left to view messages</p>
            </div>
          )
        }
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border shadow-lg bg-white z-50 ${toast.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}`}>
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
