'use client'
import { useState } from 'react'
import dayjs from 'dayjs'
import { api } from '../lib/api'
import { Send, AlertTriangle } from 'lucide-react'

export default function ConversationView({ phone, messages }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [localMessages, setLocalMessages] = useState(messages)

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await api.sendMessage(phone, input.trim())
      setLocalMessages((prev) => [...prev, {
        id: Date.now(),
        direction: 'outbound',
        body: input.trim(),
        created_at: new Date().toISOString(),
      }])
      setInput('')
    } catch { alert('Failed to send message') }
    finally { setSending(false) }
  }

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">{phone}</p>
          <p className="text-xs text-ink-muted">WhatsApp conversation</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          <AlertTriangle size={12} />
          Free-form messages only within 24h of patient's last message
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50">
        {localMessages.length === 0 ? (
          <p className="text-center text-ink-muted text-sm py-10">No messages yet</p>
        ) : localMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
              msg.direction === 'outbound'
                ? 'bg-brand text-white rounded-br-sm'
                : 'bg-white border border-border text-ink rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.body}</p>
              <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-white/70' : 'text-ink-muted'}`}>
                {dayjs(msg.created_at).format('h:mm A')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-5 py-4 border-t border-border flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message to this patient..."
          className="flex-1 bg-white border border-border rounded-xl px-4 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
        <button type="submit" disabled={sending || !input.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-40 rounded-xl text-white text-sm font-semibold transition-colors">
          <Send size={14} /> {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
