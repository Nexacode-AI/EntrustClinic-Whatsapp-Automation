'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import dayjs from 'dayjs'
import { Users, Search, MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react'

const LANG = { en: 'English', ms: 'BM', zh: '中文' }
const inputCls = 'bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all'

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
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Users size={16} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h1>
          <p className="text-sm text-slate-500">{patients.length} registered patient{patients.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">Name</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">Phone</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">Language</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">Registered</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <Users size={28} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">{search ? `No patients matching "${search}"` : 'No patients yet'}</p>
                </td>
              </tr>
            ) : patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                {editing === p.id ? (
                  <>
                    <td className="px-5 py-3">
                      <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={`${inputCls} w-full`} />
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{p.phone}</td>
                    <td className="px-5 py-3">
                      <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} className={inputCls}>
                        <option value="en">English</option>
                        <option value="ms">BM</option>
                        <option value="zh">中文</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{dayjs(p.created_at).format('D MMM YYYY')}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => saveEdit(p.id)} disabled={saving} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white font-semibold disabled:opacity-50">
                          <Check size={11} /> {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800">
                          <X size={11} /> Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-4 font-semibold text-slate-800">{p.name || <span className="text-slate-400 font-normal italic">No name</span>}</td>
                    <td className="px-5 py-4 text-slate-500 font-mono text-xs">{p.phone}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">{LANG[p.language] || 'English'}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{dayjs(p.created_at).format('D MMM YYYY')}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 justify-end">
                        <a href={`/conversations?phone=${encodeURIComponent(p.phone)}`} className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors px-2 py-1.5">
                          <MessageSquare size={11} /> Chat
                        </a>
                        <button onClick={() => startEdit(p)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => deletePatient(p)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium">
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
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border shadow-lg bg-white z-50 ${toast.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}`}>
          <span className="font-bold">{toast.ok ? '✓' : '✗'}</span> {toast.msg}
        </div>
      )}
    </div>
  )
}
