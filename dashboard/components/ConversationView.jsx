'use client'
import { useState } from 'react'
import dayjs from 'dayjs'
import { api } from '../lib/api'
import { Send, AlertTriangle, Phone } from 'lucide-react'

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
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-full shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center">
            <Phone size={14} className="text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{phone}</p>
            <p className="text-xs text-slate-400">WhatsApp conversation</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          <AlertTriangle size={11} />
          24h window only
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ backgroundColor: '#F8FAFC' }}>
        {localMessages.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10">No messages yet</p>
        ) : localMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
              msg.direction === 'outbound'
                ? 'bg-teal-600 text-white rounded-br-sm'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
              <p className={`text-xs mt-1.5 ${msg.direction === 'outbound' ? 'text-teal-200' : 'text-slate-400'}`}>
                {dayjs(msg.created_at).format('h:mm A')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
        />
        <button type="submit" disabled={sending || !input.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm">
          <Send size={14} /> {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
