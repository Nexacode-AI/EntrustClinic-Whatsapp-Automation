import { db } from '../config/database.js'

export async function listEscalations(req, res) {
  const { resolved } = req.query

  let query = db
    .from('escalations')
    .select('id, phone, reason, resolved, resolved_by, resolved_at, created_at, patients(name)')
    .order('created_at', { ascending: false })

  if (resolved === 'false' || resolved === undefined) query = query.eq('resolved', false)
  if (resolved === 'true') query = query.eq('resolved', true)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function resolveEscalation(req, res) {
  const { id } = req.params
  const { resolved_by } = req.body

  const { data, error } = await db
    .from('escalations')
    .update({ resolved: true, resolved_by: resolved_by || 'staff', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Reset conversation state for the patient
  await db.from('conversations').update({ is_escalated: false, state: 'IDLE' }).eq('phone', data.phone)

  res.json(data)
}
