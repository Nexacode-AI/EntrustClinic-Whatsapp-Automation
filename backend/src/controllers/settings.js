import { db as supabase } from '../config/database.js'

// Get all settings
export async function getSettings(req, res) {
  const { data, error } = await supabase.from('clinic_settings').select('key, value')
  if (error) return res.status(500).json({ error: error.message })
  // Convert array to object, hide sensitive fields
  const settings = {}
  ;(data || []).forEach(row => {
    const val = { ...row.value }
    // Mask API keys
    if (val.api_key) val.api_key = val.api_key ? '••••••••' + val.api_key.slice(-4) : ''
    if (val.auth_token) val.auth_token = val.auth_token ? '••••' : ''
    settings[row.key] = val
  })
  res.json(settings)
}

// Update a setting key
export async function updateSetting(req, res) {
  const { key } = req.params
  const value = req.body

  const { data, error } = await supabase
    .from('clinic_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true, key })
}

// Get clinic profile
export async function getClinicProfile(req, res) {
  const { data } = await supabase.from('clinic_settings').select('value').eq('key', 'clinic_profile').maybeSingle()
  res.json(data?.value || {})
}

// Check which external services are connected
export async function getIntegrationStatus(req, res) {
  const keys = ['twilio', 'meta', 'google_calendar', 'mims', 'lhdn', 'medilink', 'fomema_credentials', 'payment_gateway']
  const { data } = await supabase.from('clinic_settings').select('key, value').in('key', keys)

  const status = {}
  ;(data || []).forEach(row => {
    const val = row.value
    status[row.key] = !!(val && (val.api_key || val.account_sid || val.client_id || val.connected))
  })

  res.json(status)
}
