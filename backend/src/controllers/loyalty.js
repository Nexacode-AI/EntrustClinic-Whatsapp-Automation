import { db as supabase } from '../config/database.js'

export async function getPatientLoyalty(req, res) {
  const { patient_id } = req.params
  const { data, error } = await supabase
    .from('patient_loyalty')
    .select(`*, loyalty_programs(name, type, points_per_rm)`)
    .eq('patient_id', patient_id)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data || { points: 0, stamps: 0, tier: 'bronze' })
}

export async function earnPoints(req, res) {
  const { patient_id, invoice_id, amount } = req.body

  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('id, points_per_rm')
    .eq('active', true)
    .limit(1)
    .single()

  if (!program) return res.json({ ok: true, points_earned: 0 })

  const points_earned = Math.floor(amount * program.points_per_rm)
  if (points_earned <= 0) return res.json({ ok: true, points_earned: 0 })

  const { data: existing } = await supabase
    .from('patient_loyalty')
    .select('id, points, lifetime_points')
    .eq('patient_id', patient_id)
    .maybeSingle()

  if (existing) {
    const newPoints   = existing.points + points_earned
    const newLifetime = (existing.lifetime_points || 0) + points_earned
    const tier = newLifetime >= 5000 ? 'platinum' : newLifetime >= 2000 ? 'gold' : newLifetime >= 500 ? 'silver' : 'bronze'
    await supabase.from('patient_loyalty').update({ points: newPoints, lifetime_points: newLifetime, tier, last_visit: new Date().toISOString().split('T')[0] }).eq('id', existing.id)
  } else {
    await supabase.from('patient_loyalty').insert({ patient_id, program_id: program.id, points: points_earned, lifetime_points: points_earned, last_visit: new Date().toISOString().split('T')[0] })
  }

  await supabase.from('loyalty_transactions').insert({ patient_id, type: 'earn', points: points_earned, invoice_id, description: `Earned for RM${amount} purchase` })

  res.json({ ok: true, points_earned })
}

export async function redeemPoints(req, res) {
  const { patient_id, reward_id, invoice_id } = req.body

  const { data: reward } = await supabase.from('rewards').select('*').eq('id', reward_id).single()
  if (!reward) return res.status(404).json({ error: 'Reward not found' })

  const { data: loyalty } = await supabase.from('patient_loyalty').select('id, points').eq('patient_id', patient_id).single()
  if (!loyalty || loyalty.points < reward.points_cost) return res.status(400).json({ error: 'Insufficient points' })

  await supabase.from('patient_loyalty').update({ points: loyalty.points - reward.points_cost }).eq('id', loyalty.id)
  await supabase.from('reward_redemptions').insert({ patient_id, reward_id, invoice_id })
  await supabase.from('loyalty_transactions').insert({ patient_id, type: 'redeem', points: -reward.points_cost, invoice_id, description: `Redeemed: ${reward.name}` })

  res.json({ ok: true, reward, points_deducted: reward.points_cost })
}

export async function listRewards(req, res) {
  const { data, error } = await supabase.from('rewards').select('*').eq('active', true).order('points_cost')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function createReward(req, res) {
  const { data, error } = await supabase.from('rewards').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function getTransactions(req, res) {
  const { patient_id, limit = 30 } = req.query
  let query = supabase.from('loyalty_transactions').select('*').order('created_at', { ascending: false }).limit(Number(limit))
  if (patient_id) query = query.eq('patient_id', patient_id)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
