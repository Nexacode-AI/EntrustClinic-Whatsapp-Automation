'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import dayjs from 'dayjs'
import { Users, Search, MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react'

const LANG = { en: 'English', ms: 'BM', zh: '中文' }
const inputCls = 'bg-white border border-border rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all'

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', language: 'en' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [search])

  async function load() {
    try { setPatients(await api.patients({ search, limit: 100 })) } catch {}
  }

  function startEdit(p) {
    setEditing(p.id)
    setForm({ name: p.name || '', language: p.language || 'en' })
  }

  async function saveEdit(id) {
    if (!form.name.trim()) return showToast('Name is required', false)
    setSaving(true)
    try {
      await api.updatePatient(id, { name: form.name.trim(), language: form.language })
      setPatients((prev) => prev.map((p) => p.id === id ? { ...p, name: form.name.trim(), language: form.language } : p))
      setEditing(null)
      showToast('Saved!')
    } catch { showToast('Save failed', false) }
    finally { setSaving(false) }
  }

  async function deletePatient(p) {
    if (!confirm(`Delete ${p.name || p.phone}? This removes all their messages and conversation history.`)) return
    try {
      await api.deletePatient(p.id)
      setPatients((prev) => prev.filter((x) => x.id !== p.id))
      showToast('Patient deleted')
    } catch { showToast('Delete failed', false) }
  }

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={20} className="text-brand" />
          <h1 className="text-2xl font-bold text-ink">Patients</h1>
        </div>
        <p className="text-sm text-ink-secondary ml-7">{patients.length} registered patient{patients.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="relative max-w-sm mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Name</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Phone</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Language</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Registered</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-ink-secondary">
                  {search ? `No patients matching "${search}"` : 'No patients yet'}
                </td>
              </tr>
            ) : patients.map((p) => (
              <tr key={p.id} className="hover:bg-muted/60 transition-colors">
                {editing === p.id ? (
                  <>
                    <td className="px-5 py-3">
                      <input
                        type="text" value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className={`${inputCls} w-full`}
                      />
                    </td>
                    <td className="px-5 py-3 text-ink-secondary font-mono text-xs">{p.phone}</td>
                    <td className="px-5 py-3">
                      <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} className={inputCls}>
                        <option value="en">English</option>
                        <option value="ms">BM</option>
                        <option value="zh">中文</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-ink-secondary">{dayjs(p.created_at).format('D MMM YYYY')}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => saveEdit(p.id)} disabled={saving}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-brand text-white font-semibold disabled:opacity-50 transition-colors">
                          <Check size={11} /> {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:text-ink transition-colors">
                          <X size={11} /> Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3.5 font-semibold text-ink">{p.name || <span className="text-ink-muted font-normal italic">No name</span>}</td>
                    <td className="px-5 py-3.5 text-ink-secondary font-mono text-xs">{p.phone}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-ink-secondary border border-border font-medium">
                        {LANG[p.language] || 'English'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-ink-secondary">{dayjs(p.created_at).format('D MMM YYYY')}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 justify-end">
                        <a href={`/conversations?phone=${encodeURIComponent(p.phone)}`}
                          className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark font-semibold transition-colors px-2 py-1.5">
                          <MessageSquare size={12} /> Chat
                        </a>
                        <button onClick={() => startEdit(p)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:text-ink hover:bg-muted transition-colors font-medium">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => deletePatient(p)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
