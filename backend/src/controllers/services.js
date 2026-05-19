import { db } from '../config/database.js'

export async function listServices(req, res) {
  const { data, error } = await db.from('services').select('*').order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function createService(req, res) {
  const { name, duration_minutes = 30 } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  const { data, error } = await db.from('services').insert({ name, duration_minutes }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateService(req, res) {
  const { name, duration_minutes } = req.body
  const updates = {}
  if (name !== undefined) updates.name = name
  if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes
  const { data, error } = await db.from('services').update(updates).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function deleteService(req, res) {
  const { error } = await db.from('services').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
}
