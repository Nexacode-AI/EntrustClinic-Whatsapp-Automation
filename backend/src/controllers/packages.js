import { db as supabase } from '../config/database.js'
import dayjs from 'dayjs'

// ── PACKAGE PLANS ─────────────────────────────────────────────────────────────

export async function listPlans(req, res) {
  const { data, error } = await supabase
    .from('package_plans')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function createPlan(req, res) {
  const { data, error } = await supabase.from('package_plans').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updatePlan(req, res) {
  const { id } = req.params
  const { data, error } = await supabase.from('package_plans').update(req.body).eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// ── PATIENT PACKAGES ──────────────────────────────────────────────────────────

export async function getPatientPackages(req, res) {
  const { patient_id } = req.params
  const { data, error } = await supabase
    .from('patient_packages')
    .select(`*, package_plans(name, sessions, price, validity_days), package_redemptions(redeemed_at, branch_id)`)
    .eq('patient_id', patient_id)
    .order('purchased_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function sellPackage(req, res) {
  const { patient_id, plan_id, invoice_id } = req.body

  const { data: plan } = await supabase.from('package_plans').select('*').eq('id', plan_id).single()
  if (!plan) return res.status(404).json({ error: 'Plan not found' })

  const expires_at = plan.validity_days
    ? dayjs().add(plan.validity_days, 'day').toISOString()
    : null

  const { data, error } = await supabase
    .from('patient_packages')
    .insert({ patient_id, plan_id, invoice_id, sessions_total: plan.sessions, expires_at, status: 'active' })
    .select(`*, package_plans(name, sessions, price)`)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function redeemSession(req, res) {
  const { id } = req.params
  const { invoice_id, branch_id } = req.body

  const { data: pkg } = await supabase
    .from('patient_packages')
    .select('id, sessions_total, sessions_used, status, expires_at')
    .eq('id', id)
    .single()

  if (!pkg) return res.status(404).json({ error: 'Package not found' })
  if (pkg.status !== 'active') return res.status(400).json({ error: 'Package is not active' })
  if (pkg.sessions_used >= pkg.sessions_total) return res.status(400).json({ error: 'No sessions remaining' })
  if (pkg.expires_at && dayjs().isAfter(dayjs(pkg.expires_at))) return res.status(400).json({ error: 'Package expired' })

  const sessions_used = pkg.sessions_used + 1
  const newStatus = sessions_used >= pkg.sessions_total ? 'exhausted' : 'active'

  await supabase.from('patient_packages').update({ sessions_used, status: newStatus }).eq('id', id)
  await supabase.from('package_redemptions').insert({
    patient_package_id: id, invoice_id, branch_id, session_number: sessions_used,
  })

  res.json({ ok: true, sessions_used, sessions_total: pkg.sessions_total, status: newStatus })
}

// ── PACKAGE ANALYTICS ─────────────────────────────────────────────────────────

export async function getPackageStats(req, res) {
  const { data, error } = await supabase
    .from('patient_packages')
    .select('status, plan_id, package_plans(name)')

  if (error) return res.status(500).json({ error: error.message })

  const stats = { total: data.length, active: 0, exhausted: 0, expired: 0, cancelled: 0 }
  data.forEach(p => { if (stats[p.status] !== undefined) stats[p.status]++ })
  res.json(stats)
}
