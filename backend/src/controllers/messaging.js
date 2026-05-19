import dayjs from 'dayjs'
import { db } from '../config/database.js'
import { sendMessage } from '../services/twilio.js'
import { t } from '../services/bot.js'
import { logger } from '../config/logger.js'

export async function sendAppointmentReminder(req, res) {
  const { data: appt, error } = await db
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, patients(name, phone, language)')
    .eq('id', req.params.id)
    .single()

  if (error || !appt) return res.status(404).json({ error: 'Appointment not found' })
  if (appt.status !== 'upcoming') return res.status(400).json({ error: 'Appointment is not upcoming' })

  const patient = appt.patients
  const lang = patient.language || 'en'
  const d = {
    name: patient.name || 'there',
    date: dayjs(appt.appointment_date).format('D MMM YYYY'),
    time: appt.appointment_time.slice(0, 5),
  }

  try {
    await sendMessage(patient.phone, t('reminder24h', lang, d))
    await db.from('conversations').update({ last_reminder_appointment_id: appt.id }).eq('phone', patient.phone)
    logger.info('Manual reminder sent', { appointmentId: appt.id, phone: patient.phone })
    res.json({ ok: true })
  } catch (err) {
    logger.error('Manual reminder failed', { error: err.message })
    res.status(500).json({ error: 'Failed to send' })
  }
}

export async function sendReviewRequest(req, res) {
  const { data: appt, error } = await db
    .from('appointments')
    .select('id, status, patients(name, phone, language)')
    .eq('id', req.params.id)
    .single()

  if (error || !appt) return res.status(404).json({ error: 'Appointment not found' })

  const patient = appt.patients
  const lang = patient.language || 'en'

  try {
    await sendMessage(patient.phone, t('followUp', lang, patient.name || 'there'))
    await db.from('conversations').update({ state: 'AWAITING_RATING' }).eq('phone', patient.phone)
    logger.info('Manual review request sent', { appointmentId: appt.id, phone: patient.phone })
    res.json({ ok: true })
  } catch (err) {
    logger.error('Manual review failed', { error: err.message })
    res.status(500).json({ error: 'Failed to send' })
  }
}

export async function broadcastMessage(req, res) {
  const { message, filter = {} } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'message is required' })

  let query = db
    .from('appointments')
    .select('patients(name, phone)')
    .not('patients', 'is', null)

  if (filter.status) query = query.eq('status', filter.status)
  if (filter.date_from) query = query.gte('appointment_date', filter.date_from)
  if (filter.date_to) query = query.lte('appointment_date', filter.date_to)

  const { data: appts, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  // Deduplicate by phone
  const seen = new Set()
  const patients = []
  for (const a of appts || []) {
    if (a.patients?.phone && !seen.has(a.patients.phone)) {
      seen.add(a.patients.phone)
      patients.push(a.patients)
    }
  }

  if (!patients.length) return res.json({ sent: 0, failed: 0, total: 0 })

  let sent = 0
  let failed = 0
  for (const patient of patients) {
    try {
      await sendMessage(patient.phone, message.trim())
      sent++
      // Small delay to avoid Twilio rate limits
      await new Promise((r) => setTimeout(r, 200))
    } catch {
      failed++
    }
  }

  logger.info('Broadcast complete', { sent, failed, total: patients.length })
  res.json({ sent, failed, total: patients.length })
}
