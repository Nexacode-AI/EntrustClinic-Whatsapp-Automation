'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Plus, FileText, Check, Search } from 'lucide-react'
import dayjs from 'dayjs'

const TABS = ['Templates', 'Patient Consents']

export default function ConsentPage() {
  const [tab, setTab] = useState('Templates')
  const [templates, setTemplates] = useState([])
  const [consents, setConsents] = useState([])
  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [signOpen, setSignOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', category: 'general', is_required: false })
  const [signForm, setSignForm] = useState({ patient_id: '', template_id: '', signed_at: dayjs().format('YYYY-MM-DDTHH:mm'), signed_by: '', witness: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [t, c, p] = await Promise.all([
        api.settings(), // Replace with consent templates endpoint when available
        api.patients(),
        api.patients(),
      ])
      setTemplates([])
      setPatients(p || [])
    } catch {}
    setLoading(false)
  }

  // Mock templates from common clinic types
  const mockTemplates = [
    { id: 'tmpl-1', title: 'General Treatment Consent', category: 'general', is_required: true },
    { id: 'tmpl-2', title: 'Minor Surgical Procedure Consent', category: 'surgical', is_required: true },
    { id: 'tmpl-3', title: 'Photography & Recording Consent', category: 'media', is_required: false },
    { id: 'tmpl-4', title: 'Telemedicine Consultation Consent', category: 'telemedicine', is_required: false },
    { id: 'tmpl-5', title: 'Data Privacy & Sharing Consent (PDPA)', category: 'privacy', is_required: true },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Consent Forms</h1>
          <p className="page-subtitle">Digital consent management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSignOpen(true)} className="btn-secondary btn-sm"><Check size={13} /> Record Consent</button>
          <button onClick={() => setAddOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> New Template</button>
        </div>
      </div>

      <div className="card">
        <div className="tab-list border-b border-border px-4">
          {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'tab-active' : ''}`}>{t}</button>)}
        </div>

        {tab === 'Templates' && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockTemplates.map(tmpl => (
                <div key={tmpl.id} className="card-padded border border-border rounded-xl hover:shadow-card-hover transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                        <FileText size={14} className="text-brand" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-ink">{tmpl.title}</p>
                        <span className="badge badge-gray text-xs capitalize">{tmpl.category}</span>
                      </div>
                    </div>
                    {tmpl.is_required && <span className="badge badge-red text-xs">Required</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setSelectedTemplate(tmpl); setSignForm(f => ({ ...f, template_id: tmpl.id })); setSignOpen(true) }}
                      className="btn-primary btn-sm flex-1"
                    >
                      <Check size={12} /> Record Signature
                    </button>
                    <button className="btn-ghost btn-sm">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Patient Consents' && (
          <div>
            <div className="p-3 border-b border-border">
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input className="form-input pl-7 py-1.5 text-sm" placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>
            {consents.length === 0 ? (
              <EmptyState icon={FileText} title="No consent records" description="Recorded patient consents will appear here" />
            ) : (
              <div className="overflow-x-auto"><table className="data-table">
                <thead><tr><th>Patient</th><th>Consent Type</th><th>Signed At</th><th>Signed By</th><th>Witness</th></tr></thead>
                <tbody>
                  {consents.map(c => (
                    <tr key={c.id}>
                      <td className="font-semibold text-sm">{c.patients?.name}</td>
                      <td className="text-sm">{c.consent_templates?.title}</td>
                      <td className="text-sm text-ink-muted">{dayjs(c.signed_at).format('D MMM YYYY HH:mm')}</td>
                      <td className="text-sm text-ink-muted">{c.signed_by}</td>
                      <td className="text-sm text-ink-muted">{c.witness}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        )}
      </div>

      {/* Add Template Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Consent Template" size="lg" footer={
        <><button onClick={() => setAddOpen(false)} className="btn-secondary">Cancel</button><button onClick={async () => { setAddOpen(false) }} className="btn-primary">Save Template</button></>
      }>
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. General Treatment Consent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['general','surgical','anaesthesia','telemedicine','media','privacy'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div className="form-group flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={form.is_required} onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))} />
                <span className="form-label mb-0">Required for all patients</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Consent Content</label>
            <textarea className="form-textarea" rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Enter full consent text..." />
          </div>
        </div>
      </Modal>

      {/* Record Consent Modal */}
      <Modal open={signOpen} onClose={() => setSignOpen(false)} title={`Record Consent${selectedTemplate ? ` — ${selectedTemplate.title}` : ''}`} footer={
        <><button onClick={() => setSignOpen(false)} className="btn-secondary">Cancel</button><button onClick={async () => { setSignOpen(false) }} className="btn-primary"><Check size={13} /> Record</button></>
      }>
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label">Patient</label>
            <select className="form-select" value={signForm.patient_id} onChange={e => setSignForm(f => ({ ...f, patient_id: e.target.value }))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
            </select>
          </div>
          {!selectedTemplate && (
            <div className="form-group">
              <label className="form-label">Consent Type</label>
              <select className="form-select" value={signForm.template_id} onChange={e => setSignForm(f => ({ ...f, template_id: e.target.value }))}>
                <option value="">Select consent...</option>
                {mockTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Signed At</label>
            <input type="datetime-local" className="form-input" value={signForm.signed_at} onChange={e => setSignForm(f => ({ ...f, signed_at: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Signed By</label>
              <input className="form-input" placeholder="Patient or guardian name" value={signForm.signed_by} onChange={e => setSignForm(f => ({ ...f, signed_by: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Witness</label>
              <input className="form-input" placeholder="Staff witness name" value={signForm.witness} onChange={e => setSignForm(f => ({ ...f, witness: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
