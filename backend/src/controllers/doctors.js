import { db } from '../config/database.js'
import { logger } from '../config/logger.js'

export async function listDoctors(req, res) {
  const { data, error } = await db
    .from('doctors')
    .select(`
      id, name, whatsapp_phone, google_calendar_id, active, created_at,
      doctor_services ( service_id, services(name) ),
      doctor_availability ( day_of_week, start_time, end_time, active )
    `)
    .order('name')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getDoctor(req, res) {
  const { data, error } = await db
    .from('doctors')
    .select(`
      id, name, whatsapp_phone, google_calendar_id, active, created_at,
      doctor_services ( service_id, services(name) ),
      doctor_availability ( id, day_of_week, start_time, end_time, active )
    `)
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Doctor not found' })
  res.json(data)
}

export async function createDoctor(req, res) {
  const { name, whatsapp_phone, google_calendar_id, active = true } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  const { data, error } = await db
    .from('doctors')
    .insert({ name, whatsapp_phone: whatsapp_phone || null, google_calendar_id: google_calendar_id || null, active })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  logger.info('Doctor created', { name })
  res.status(201).json(data)
}

export async function updateDoctor(req, res) {
  const { name, whatsapp_phone, google_calendar_id, active } = req.body
  const updates = {}
  if (name !== undefined) updates.name = name
  if (whatsapp_phone !== undefined) updates.whatsapp_phone = whatsapp_phone || null
  if (google_calendar_id !== undefined) updates.google_calendar_id = google_calendar_id || null
  if (active !== undefined) updates.active = active

  const { data, error } = await db
    .from('doctors')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  logger.info('Doctor updated', { id: req.params.id })
  res.json(data)
}

export async function deleteDoctor(req, res) {
  const { error } = await db.from('doctors').delete().eq('id', req.params.id)
  if (error) {
    if (error.code === '23503') return res.status(409).json({ error: 'Doctor has existing appointments and cannot be deleted.' })
    return res.status(500).json({ error: error.message })
  }
  logger.info('Doctor deleted', { id: req.params.id })
  res.status(204).send()
}

// ─── Doctor Services ──────────────────────────────────────────────────────────

export async function setDoctorServices(req, res) {
  const { service_ids } = req.body
  if (!Array.isArray(service_ids)) return res.status(400).json({ error: 'service_ids must be an array' })

  const doctorId = req.params.id

  // Replace all service assignments
  await db.from('doctor_services').delete().eq('doctor_id', doctorId)

  if (service_ids.length > 0) {
    const rows = service_ids.map((sid) => ({ doctor_id: doctorId, service_id: sid }))
    const { error } = await db.from('doctor_services').insert(rows)
    if (error) return res.status(500).json({ error: error.message })
  }

  res.json({ ok: true })
}

// ─── Doctor Availability ──────────────────────────────────────────────────────

export async function getDoctorAvailability(req, res) {
  const { data, error } = await db
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', req.params.id)
    .order('day_of_week')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function setDoctorAvailability(req, res) {
  // Expects array: [{ day_of_week, start_time, end_time, active }]
  const { slots } = req.body
  if (!Array.isArray(slots)) return res.status(400).json({ error: 'slots must be an array' })

  const doctorId = req.params.id

  // Replace all availability for this doctor
  await db.from('doctor_availability').delete().eq('doctor_id', doctorId)

  if (slots.length > 0) {
    const rows = slots.map((s) => ({
      doctor_id: doctorId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      active: s.active !== false,
    }))
    const { error } = await db.from('doctor_availability').insert(rows)
    if (error) return res.status(500).json({ error: error.message })
  }

  res.json({ ok: true })
}

// ─── Blocked Slots ────────────────────────────────────────────────────────────

export async function listBlockedSlots(req, res) {
  const { from, to } = req.query
  let query = db
    .from('blocked_slots')
    .select('*')
    .order('blocked_date')

  if (from) query = query.gte('blocked_date', from)
  if (to) query = query.lte('blocked_date', to)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function createBlockedSlot(req, res) {
  const { doctor_id, blocked_date, start_time, end_time, reason } = req.body
  if (!blocked_date) return res.status(400).json({ error: 'blocked_date is required' })

  const { data, error } = await db
    .from('blocked_slots')
    .insert({
      doctor_id: doctor_id || null,
      blocked_date,
      start_time: start_time || null,
      end_time: end_time || null,
      reason: reason || null,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function deleteBlockedSlot(req, res) {
  const { error } = await db.from('blocked_slots').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
}
