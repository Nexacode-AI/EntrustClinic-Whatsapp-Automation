/**
 * Scheduler — runs every minute, checks DB for pending reminders and follow-ups.
 * Using DB flags (sent=false) ensures no double-sends even if server restarts.
 */
import cron from 'node-cron'
import dayjs from 'dayjs'
import { db } from '../config/database.js'
import { sendMessage } from './twilio.js'
import { t } from './bot.js'
import { sendDailySummaries } from './doctorNotifier.js'
import { logger } from '../config/logger.js'

async function sendPendingReminders() {
  const now = dayjs().toISOString()

  // Fetch all unsent reminders due now or in the past
  const { data: reminders, error } = await db
    .from('reminders')
    .select(`
      id, type,
      appointments (
        id, appointment_date, appointment_time, status,
        patients (name, phone, language)
      )
    `)
    .eq('sent', false)
    .lte('scheduled_at', now)

  if (error) {
    logger.error('Scheduler: fetch reminders error', { error: error.message })
    return
  }

  for (const reminder of reminders || []) {
    const appt = reminder.appointments
    if (!appt || appt.status !== 'upcoming') {
      // Appointment no longer upcoming — mark sent to skip
      await db.from('reminders').update({ sent: true, sent_at: now }).eq('id', reminder.id)
      continue
    }

    const patient = appt.patients
    const lang = patient.language || 'en'
    const d = {
      name: patient.name || 'there',
      date: dayjs(appt.appointment_date).format('D MMM YYYY'),
      time: appt.appointment_time.slice(0, 5),
    }

    const message = reminder.type === '24h'
      ? t('reminder24h', lang, d)
      : t('reminder1h', lang, d)

    try {
      // Atomically claim the reminder — prevents double-send if two instances run concurrently
      const { data: claimed } = await db
        .from('reminders')
        .update({ sent: true, sent_at: now })
        .eq('id', reminder.id)
        .eq('sent', false)
        .select('id')

      if (!claimed || claimed.length === 0) continue

      await sendMessage(patient.phone, message)

      // Track which appointment the reminder was for (for reply handling)
      await db.from('conversations').update({
        last_reminder_appointment_id: appt.id,
      }).eq('phone', patient.phone)

      logger.info(`Reminder sent: ${reminder.type} to ${patient.phone}`)
    } catch (err) {
      logger.error('Scheduler: send reminder error', { error: err.message, phone: patient.phone })
    }
  }
}

async function sendPendingFollowUps() {
  const now = dayjs().toISOString()

  const { data: followUps, error } = await db
    .from('follow_ups')
    .select(`
      id,
      appointments (
        id, appointment_date, appointment_time, status,
        patients (name, phone, language)
      )
    `)
    .eq('sent', false)
    .lte('scheduled_at', now)

  if (error) {
    logger.error('Scheduler: fetch follow_ups error', { error: error.message })
    return
  }

  for (const fu of followUps || []) {
    const appt = fu.appointments
    if (!appt) continue

    // Mark appointment as completed if still "upcoming" after scheduled time
    if (appt.status === 'upcoming') {
      await db.from('appointments').update({ status: 'completed' }).eq('id', appt.id)
    }

    if (appt.status === 'cancelled' || appt.status === 'no_show') {
      await db.from('follow_ups').update({ sent: true, sent_at: now }).eq('id', fu.id)
      continue
    }

    const patient = appt.patients
    const lang = patient.language || 'en'
    const message = t('followUp', lang, patient.name || 'there')

    try {
      // Atomically claim the follow-up
      const { data: claimed } = await db
        .from('follow_ups')
        .update({ sent: true, sent_at: now })
        .eq('id', fu.id)
        .eq('sent', false)
        .select('id')

      if (!claimed || claimed.length === 0) continue

      await sendMessage(patient.phone, message)

      // Set conversation state to AWAITING_RATING
      await db.from('conversations').update({ state: 'AWAITING_RATING' }).eq('phone', patient.phone)

      logger.info(`Follow-up sent to ${patient.phone}`)
    } catch (err) {
      logger.error('Scheduler: send follow_up error', { error: err.message, phone: patient.phone })
    }
  }
}

export function startScheduler() {
  // Patient reminders + follow-ups — every minute
  cron.schedule('* * * * *', async () => {
    await Promise.allSettled([sendPendingReminders(), sendPendingFollowUps()])
  })

  // Doctor daily summary — every day at 8:00 AM MYT (UTC+8 = 00:00 UTC)
  cron.schedule('0 0 * * *', async () => {
    logger.info('Sending daily summaries to doctors...')
    await sendDailySummaries().catch((err) =>
      logger.error('Daily summary job failed', { error: err.message })
    )
  })

  logger.info('Scheduler started')
}
