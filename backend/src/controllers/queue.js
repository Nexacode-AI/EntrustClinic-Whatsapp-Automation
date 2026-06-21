import { db as supabase } from '../config/database.js'
import dayjs from 'dayjs'

// Get today's queue
export async function getQueue(req, res) {
  const { branch_id, date, doctor_id } = req.query
  const targetDate = date || dayjs().format('YYYY-MM-DD')

  let query = supabase
    .from('queue_entries')
    .select(`
      *,
      patients (id, name, phone, language),
      doctors  (id, name)
    `)
    .gte('checked_in_at', `${targetDate}T00:00:00`)
    .lt('checked_in_at',  `${targetDate}T23:59:59`)
    .order('queue_number', { ascending: true })

  if (branch_id) query = query.eq('branch_id', branch_id)
  if (doctor_id) query = query.eq('doctor_id', doctor_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// Add walk-in patient to queue
export async function addToQueue(req, res) {
  const { patient_id, doctor_id, branch_id, triage = 'normal', reason, appointment_id } = req.body

  if (!patient_id) return res.status(400).json({ error: 'patient_id required' })

  const today = dayjs().format('YYYY-MM-DD')

  // Get next queue number for today
  const { count } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .gte('checked_in_at', `${today}T00:00:00`)
    .lt('checked_in_at',  `${today}T23:59:59`)

  const queueNumber = (count || 0) + 1

  const { data, error } = await supabase
    .from('queue_entries')
    .insert({ patient_id, doctor_id, branch_id, triage, reason, appointment_id, queue_number: queueNumber })
    .select(`*, patients(id, name, phone), doctors(id, name)`)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

// Update queue entry status
export async function updateQueueStatus(req, res) {
  const { id } = req.params
  const { status, doctor_id } = req.body

  const updates = { status }

  if (status === 'calling')          updates.called_at     = new Date().toISOString()
  if (status === 'in_consultation')  updates.consult_start = new Date().toISOString()
  if (status === 'done' || status === 'billing') updates.consult_end = new Date().toISOString()
  if (status === 'done')             updates.done_at       = new Date().toISOString()
  if (doctor_id)                     updates.doctor_id     = doctor_id

  const { data, error } = await supabase
    .from('queue_entries')
    .update(updates)
    .eq('id', id)
    .select(`*, patients(id, name, phone), doctors(id, name)`)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// Queue display screen (public — no auth, filtered data)
export async function getQueueDisplay(req, res) {
  const { branch_id } = req.query
  const today = dayjs().format('YYYY-MM-DD')

  let query = supabase
    .from('queue_entries')
    .select('queue_number, status, triage, doctor_id, doctors(name)')
    .gte('checked_in_at', `${today}T00:00:00`)
    .lt('checked_in_at',  `${today}T23:59:59`)
    .in('status', ['waiting','calling','in_consultation'])
    .order('queue_number')

  if (branch_id) query = query.eq('branch_id', branch_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// Queue analytics
export async function getQueueStats(req, res) {
  const { date } = req.query
  const targetDate = date || dayjs().format('YYYY-MM-DD')

  const { data, error } = await supabase
    .from('queue_entries')
    .select('status, triage, consult_start, consult_end, checked_in_at, called_at')
    .gte('checked_in_at', `${targetDate}T00:00:00`)
    .lt('checked_in_at',  `${targetDate}T23:59:59`)

  if (error) return res.status(500).json({ error: error.message })

  const total   = data.length
  const waiting = data.filter(q => q.status === 'waiting').length
  const active  = data.filter(q => q.status === 'in_consultation').length
  const done    = data.filter(q => q.status === 'done').length

  const waitTimes = data
    .filter(q => q.called_at && q.checked_in_at)
    .map(q => (new Date(q.called_at) - new Date(q.checked_in_at)) / 60000)
  const avgWait = waitTimes.length > 0
    ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
    : 0

  res.json({ total, waiting, active, done, avgWait })
}

// Delete queue entry
export async function removeFromQueue(req, res) {
  const { id } = req.params
  const { error } = await supabase.from('queue_entries').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
}
