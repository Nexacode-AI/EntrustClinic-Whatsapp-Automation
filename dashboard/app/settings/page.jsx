'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Check, Eye, EyeOff, Save, CheckCircle, XCircle, Settings, Zap } from 'lucide-react'

const INTEGRATION_KEYS = [
  {
    group: 'WhatsApp',
    items: [
      { key: 'twilio_account_sid', label: 'Twilio Account SID', type: 'text', provider: 'twilio' },
      { key: 'twilio_auth_token', label: 'Twilio Auth Token', type: 'password', provider: 'twilio' },
      { key: 'twilio_whatsapp_from', label: 'Twilio WhatsApp Number', type: 'text', provider: 'twilio', placeholder: 'whatsapp:+601XXXXXXXX' },
      { key: 'meta_access_token', label: 'Meta Cloud API Token', type: 'password', provider: 'meta' },
      { key: 'meta_phone_number_id', label: 'Meta Phone Number ID', type: 'text', provider: 'meta' },
    ],
  },
  {
    group: 'LHDN eInvoice (MyInvois)',
    items: [
      { key: 'lhdn_client_id', label: 'Client ID', type: 'text', provider: 'lhdn' },
      { key: 'lhdn_client_secret', label: 'Client Secret', type: 'password', provider: 'lhdn' },
      { key: 'lhdn_tin', label: 'Tax Identification Number (TIN)', type: 'text', provider: 'lhdn' },
    ],
  },
  {
    group: 'FOMEMA',
    items: [
      { key: 'fomema_username', label: 'FOMEMA Username', type: 'text', provider: 'fomema' },
      { key: 'fomema_password', label: 'FOMEMA Password', type: 'password', provider: 'fomema' },
      { key: 'fomema_clinic_code', label: 'Clinic Code', type: 'text', provider: 'fomema' },
    ],
  },
  {
    group: 'MIMS Drug Database',
    items: [
      { key: 'mims_api_key', label: 'MIMS API Key', type: 'password', provider: 'mims' },
      { key: 'mims_license_id', label: 'MIMS License ID', type: 'text', provider: 'mims' },
    ],
  },
  {
    group: 'Google Calendar',
    items: [
      { key: 'google_calendar_id', label: 'Calendar ID', type: 'text', provider: 'google' },
      { key: 'google_service_account', label: 'Service Account JSON', type: 'password', provider: 'google' },
    ],
  },
]

const CLINIC_SETTINGS = [
  { key: 'clinic_name', label: 'Clinic Name', type: 'text' },
  { key: 'clinic_address', label: 'Address', type: 'textarea' },
  { key: 'clinic_phone', label: 'Phone', type: 'text' },
  { key: 'clinic_email', label: 'Email', type: 'email' },
  { key: 'clinic_registration', label: 'Registration Number', type: 'text' },
  { key: 'currency', label: 'Currency', type: 'text' },
  { key: 'timezone', label: 'Timezone', type: 'text' },
  { key: 'queue_auto_advance', label: 'Queue Auto-Advance', type: 'boolean' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState({})
  const [integrations, setIntegrations] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})
  const [visible, setVisible] = useState({})
  const [activeTab, setActiveTab] = useState('Clinic')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [s, intg] = await Promise.all([api.settings(), api.integrations()])
      const settingsMap = {}
      ;(s || []).forEach(item => { settingsMap[item.key] = item.value })
      setSettings(settingsMap)
      setIntegrations(intg || {})
    } catch {}
    setLoading(false)
  }

  async function saveSetting(key, value) {
    setSaving(p => ({ ...p, [key]: true }))
    try {
      await api.updateSetting(key, { value })
      setSettings(p => ({ ...p, [key]: value }))
      setSaved(p => ({ ...p, [key]: true }))
      setTimeout(() => setSaved(p => ({ ...p, [key]: false })), 2000)
    } catch {}
    setSaving(p => ({ ...p, [key]: false }))
  }

  const tabs = ['Clinic', ...INTEGRATION_KEYS.map(g => g.group)]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Clinic configuration & integrations</p>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Sidebar nav */}
        <div className="w-56 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === t ? 'bg-brand text-white font-semibold' : 'text-ink-muted hover:bg-muted hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Settings panel */}
        <div className="flex-1 card card-padded space-y-6">
          {activeTab === 'Clinic' && (
            <div>
              <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2"><Settings size={16} /> Clinic Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {CLINIC_SETTINGS.map(({ key, label, type }) => (
                  <div key={key} className={`form-group ${type === 'textarea' ? 'col-span-2' : ''}`}>
                    <label className="form-label">{label}</label>
                    {type === 'textarea' ? (
                      <textarea className="form-textarea" rows={3} defaultValue={settings[key] || ''} onBlur={e => saveSetting(key, e.target.value)} />
                    ) : type === 'boolean' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => saveSetting(key, settings[key] === 'true' ? 'false' : 'true')}
                          className={`relative w-10 h-5 rounded-full transition-colors ${settings[key] === 'true' ? 'bg-brand' : 'bg-border'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] === 'true' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                        <span className="text-sm text-ink-muted">{settings[key] === 'true' ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type={type}
                          className="form-input pr-8"
                          defaultValue={settings[key] || ''}
                          onBlur={e => saveSetting(key, e.target.value)}
                        />
                        {saved[key] && <Check size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-success" />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {INTEGRATION_KEYS.map(group => activeTab === group.group && (
            <div key={group.group}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-ink flex items-center gap-2"><Zap size={16} /> {group.group}</h2>
                {integrations[group.items[0]?.provider] !== undefined && (
                  <div className="flex items-center gap-1.5">
                    {integrations[group.items[0]?.provider]
                      ? <><CheckCircle size={14} className="text-success" /><span className="text-xs text-success font-semibold">Connected</span></>
                      : <><XCircle size={14} className="text-ink-faint" /><span className="text-xs text-ink-muted">Not configured</span></>
                    }
                  </div>
                )}
              </div>

              <div className="p-3 bg-muted border border-border rounded-xl text-sm text-ink-muted mb-4">
                Credentials are stored securely. The integration will activate automatically once all required fields are filled.
              </div>

              <div className="space-y-3">
                {group.items.map(({ key, label, type, placeholder }) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <div className="relative">
                      <input
                        type={type === 'password' && !visible[key] ? 'password' : 'text'}
                        className="form-input pr-16"
                        defaultValue={settings[key] || ''}
                        placeholder={placeholder || ''}
                        onBlur={e => saveSetting(key, e.target.value)}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {type === 'password' && (
                          <button
                            type="button"
                            onClick={() => setVisible(p => ({ ...p, [key]: !p[key] }))}
                            className="text-ink-faint hover:text-ink p-0.5"
                          >
                            {visible[key] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        )}
                        {saving[key] && <div className="w-3 h-3 border border-brand border-t-transparent rounded-full animate-spin" />}
                        {saved[key] && <Check size={12} className="text-success" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
