import { db } from '../config/database.js'

export async function listAppointments(req, res) {
  const { status, date_from, date_to, limit = 50, offset = 0 } = req.query

  let query = db
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, status, created_at,
      patients (id, name, phone, language),
      services (name, duration_minutes)
    `)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

  if (status) query = query.eq('status', status)
  if (date_from) query = query.gte('appointment_date', date_from)
  if (date_to) query = query.lte('appointment_date', date_to)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, count })
}

export async function getAppointment(req, res) {
  const { id } = req.params
  const { data, error } = await db
    .from('appointments')
    .select(`
      *, patients (id, name, phone, language), services (name, duration_minutes)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Not found' })
  res.json(data)
}

export async function updateAppointmentStatus(req, res) {
  const { id } = req.params
  const { status } = req.body
  const valid = ['upcoming', 'completed', 'cancelled', 'no_show']
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  const { data, error } = await db
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getMonthlyStats(req, res) {
  const { month } = req.query // 'YYYY-MM'
  const from = month ? `${month}-01` : new Date().toISOString().slice(0, 7) + '-01'
  const to = new Date(new Date(from).setMonth(new Date(from).getMonth() + 1)).toISOString().slice(0, 10)

  const { data, error } = await db
    .from('appointments')
    .select('status')
    .gte('appointment_date', from)
    .lt('appointment_date', to)

  if (error) return res.status(500).json({ error: error.message })

  const stats = { upcoming: 0, completed: 0, cancelled: 0, no_show: 0 }
  for (const row of data || []) stats[row.status] = (stats[row.status] || 0) + 1
  res.json(stats)
}
