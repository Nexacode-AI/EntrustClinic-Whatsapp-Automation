import { db } from '../config/database.js'

export async function listConversations(req, res) {
  const { escalated, limit = 50, offset = 0 } = req.query

  let query = db
    .from('conversations')
    .select('phone, state, is_escalated, updated_at, patients(name)')
    .order('updated_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

  if (escalated === 'true') query = query.eq('is_escalated', true)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getMessages(req, res) {
  const { phone } = req.params
  const { limit = 100 } = req.query

  const { data, error } = await db
    .from('messages')
    .select('id, direction, body, created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: true })
    .limit(parseInt(limit))

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function resolveEscalation(req, res) {
  const { phone } = req.params
  const { resolved_by } = req.body

  await Promise.all([
    db.from('conversations').update({ is_escalated: false, state: 'IDLE' }).eq('phone', phone),
    db.from('escalations').update({
      resolved: true,
      resolved_by: resolved_by || 'staff',
      resolved_at: new Date().toISOString(),
    }).eq('phone', phone).eq('resolved', false),
  ])

  res.json({ ok: true })
}
