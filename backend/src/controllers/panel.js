import { db as supabase } from '../config/database.js'

export async function listPanels(req, res) {
  const { data, error } = await supabase.from('panel_companies').select('*, panel_fee_schedules(count)').eq('active', true).order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getPanel(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('panel_companies')
    .select(`*, panel_fee_schedules(*, services(name))`)
    .eq('id', id)
    .single()
  if (error) return res.status(404).json({ error: 'Panel not found' })
  res.json(data)
}

export async function createPanel(req, res) {
  const { data, error } = await supabase.from('panel_companies').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updatePanel(req, res) {
  const { id } = req.params
  const { data, error } = await supabase.from('panel_companies').update(req.body).eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function setPanelFees(req, res) {
  const { id: panel_id } = req.params
  const { fees = [] } = req.body // [{ service_id, fee }]

  // Delete old fees for this panel
  await supabase.from('panel_fee_schedules').delete().eq('panel_id', panel_id)

  if (fees.length > 0) {
    const rows = fees.map(f => ({ panel_id, service_id: f.service_id, fee: f.fee }))
    const { error } = await supabase.from('panel_fee_schedules').insert(rows)
    if (error) return res.status(500).json({ error: error.message })
  }

  const { data } = await supabase.from('panel_fee_schedules').select('*, services(name)').eq('panel_id', panel_id)
  res.json(data)
}

export async function listClaims(req, res) {
  const { panel_id, status, limit = 50, offset = 0 } = req.query
  let query = supabase
    .from('panel_claims')
    .select(`*, invoices(*, patients(name)), panel_companies(name)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (panel_id) query = query.eq('panel_id', panel_id)
  if (status)   query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, total: count })
}

export async function updateClaimStatus(req, res) {
  const { id } = req.params
  const { status, rejected_reason } = req.body
  const updates = { status }
  if (status === 'submitted')  updates.submitted_at = new Date().toISOString()
  if (status === 'paid')       updates.paid_at = new Date().toISOString()
  if (status === 'rejected')   updates.rejected_reason = rejected_reason
  const { data, error } = await supabase.from('panel_claims').update(updates).eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getClaimAging(req, res) {
  const { data, error } = await supabase
    .from('panel_claims')
    .select('amount, created_at, status, panel_companies(name)')
    .eq('status', 'outstanding')

  if (error) return res.status(500).json({ error: error.message })

  const now = Date.now()
  const aged = data.map(c => ({
    ...c,
    days: Math.floor((now - new Date(c.created_at).getTime()) / 86400000),
  }))

  const summary = {
    under30:    aged.filter(c => c.days < 30).reduce((s,c) => s + c.amount, 0),
    from30to60: aged.filter(c => c.days >= 30 && c.days < 60).reduce((s,c) => s + c.amount, 0),
    from60to90: aged.filter(c => c.days >= 60 && c.days < 90).reduce((s,c) => s + c.amount, 0),
    over90:     aged.filter(c => c.days >= 90).reduce((s,c) => s + c.amount, 0),
  }

  res.json({ claims: aged, summary })
}
