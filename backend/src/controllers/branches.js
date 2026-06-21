import { db as supabase } from '../config/database.js'

export async function listBranches(req, res) {
  const { data, error } = await supabase.from('branches').select('*').order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function createBranch(req, res) {
  const { data, error } = await supabase.from('branches').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateBranch(req, res) {
  const { id } = req.params
  const { data, error } = await supabase.from('branches').update(req.body).eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
