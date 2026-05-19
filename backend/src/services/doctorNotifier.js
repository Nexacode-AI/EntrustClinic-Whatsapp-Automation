/**
 * Doctor Notification Service
 * Sends WhatsApp messages to doctors via Twilio when appointments are booked,
 * cancelled, or rescheduled. Also handles the 8AM daily schedule summary.
 */
import dayjs from 'dayjs'
import { sendMessage } from './twilio.js'
import { db } from '../config/database.js'
import { logger } from '../config/logger.js'
import { env } from '../config/env.js'

// ─── Notification Templates ───────────────────────────────────────────────────

function newBookingMsg({ doctorName, patientName, service, date, time, bookingId }) {
  return `📅 *New Appointment* — ${env.clinic.name}

👤 Patient: ${patientName}
🏥 Service: ${service}
📆 Date: ${date}
⏰ Time: ${time}
🔖 Booking ID: #${bookingId}

This appointment has been added to your calendar.`
}

function cancellationMsg({ doctorName, patientName, service, date, time }) {
  return `❌ *Appointment Cancelled* — ${env.clinic.name}

👤 Patient: ${patientName}
🏥 Service: ${service}
📆 Date: ${date}
⏰ Time: ${time}

This slot is now free.`
}

function rescheduleMsg({ patientName, service, oldDate, oldTime, newDate, newTime }) {
  return `🔄 *Appointment Rescheduled* — ${env.clinic.name}

👤 Patient: ${patientName}
🏥 Service: ${service}

Old: ${oldDate} at ${oldTime}
New: *${newDate} at ${newTime}*

Your calendar has been updated.`
}

function dailySummaryMsg({ doctorName, date, appointments }) {
  if (!appointments.length) {
    return `☀️ Good morning, ${doctorName}!\n\nNo appointments scheduled for today (${date}). Enjoy the day! 😊`
  }

  const list = appointments
    .map((a, i) => `${i + 1}. ${a.time} — ${a.patientName} (${a.service})`)
    .join('\n')

  return `☀️ Good morning, ${doctorName}!

Your schedule for *${date}*:

${list}

Total: *${appointments.length} appointment${appointments.length > 1 ? 's' : ''}*

— ${env.clinic.name}`
}

// ─── Notification Senders ─────────────────────────────────────────────────────

/**
 * Notify doctor of a new booking.
 */
export async function notifyNewBooking({ doctorId, appointmentId, patientName, serviceName, dateStr, timeStr, bookingId }) {
  const doctor = await getDoctorById(doctorId)
  if (!doctor?.whatsapp_phone) {
    logger.warn('Doctor has no WhatsApp number — skipping notification', { doctorId })
    return
  }

  const msg = newBookingMsg({
    doctorName: doctor.name,
    patientName,
    service: serviceName,
    date: dayjs(dateStr).format('D MMM YYYY (ddd)'),
    time: formatTime(timeStr),
    bookingId,
  })

  await sendMessage(doctor.whatsapp_phone, msg)
  await logNotification({ doctorId, type: 'new_booking', appointmentId })
  logger.info('Doctor notified — new booking', { doctor: doctor.name, patientName })
}

/**
 * Notify doctor of a cancellation.
 */
export async function notifyCancellation({ doctorId, appointmentId, patientName, serviceName, dateStr, timeStr }) {
  const doctor = await getDoctorById(doctorId)
  if (!doctor?.whatsapp_phone) return

  const msg = cancellationMsg({
    doctorName: doctor.name,
    patientName,
    service: serviceName,
    date: dayjs(dateStr).format('D MMM YYYY (ddd)'),
    time: formatTime(timeStr),
  })

  await sendMessage(doctor.whatsapp_phone, msg)
  await logNotification({ doctorId, type: 'cancellation', appointmentId })
  logger.info('Doctor notified — cancellation', { doctor: doctor.name })
}

/**
 * Notify doctor of a reschedule.
 */
export async function notifyReschedule({ doctorId, appointmentId, patientName, serviceName, oldDateStr, oldTimeStr, newDateStr, newTimeStr }) {
  const doctor = await getDoctorById(doctorId)
  if (!doctor?.whatsapp_phone) return

  const msg = rescheduleMsg({
    patientName,
    service: serviceName,
    oldDate: dayjs(oldDateStr).format('D MMM YYYY'),
    oldTime: formatTime(oldTimeStr),
    newDate: dayjs(newDateStr).format('D MMM YYYY (ddd)'),
    newTime: formatTime(newTimeStr),
  })

  await sendMessage(doctor.whatsapp_phone, msg)
  await logNotification({ doctorId, type: 'reschedule', appointmentId })
  logger.info('Doctor notified — reschedule', { doctor: doctor.name })
}

/**
 * Send daily 8AM schedule summary to all active doctors.
 * Called by the scheduler every morning.
 */
export async function sendDailySummaries() {
  const today = dayjs().format('YYYY-MM-DD')
  const dateLabel = dayjs().format('D MMM YYYY (ddd)')

  const { data: doctors } = await db
    .from('doctors')
    .select('*')
    .eq('active', true)
    .not('whatsapp_phone', 'is', null)

  if (!doctors?.length) return

  for (const doctor of doctors) {
    try {
      const { data: appts } = await db
        .from('appointments')
        .select('appointment_time, patients(name), services(name)')
        .eq('doctor_id', doctor.id)
        .eq('appointment_date', today)
        .eq('status', 'upcoming')
        .order('appointment_time', { ascending: true })

      const appointments = (appts || []).map((a) => ({
        time: formatTime(a.appointment_time),
        patientName: a.patients?.name || 'Unknown',
        service: a.services?.name || 'Consultation',
      }))

      const msg = dailySummaryMsg({
        doctorName: doctor.name,
        date: dateLabel,
        appointments,
      })

      await sendMessage(doctor.whatsapp_phone, msg)
      await logNotification({ doctorId: doctor.id, type: 'daily_summary', appointmentId: null })
      logger.info('Daily summary sent', { doctor: doctor.name, count: appointments.length })
    } catch (err) {
      logger.error('Daily summary failed for doctor', { doctor: doctor.name, error: err.message })
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getDoctorById(id) {
  const { data } = await db.from('doctors').select('*').eq('id', id).single()
  return data
}

async function logNotification({ doctorId, type, appointmentId }) {
  await db.from('doctor_notifications').insert({
    doctor_id: doctorId,
    type,
    appointment_id: appointmentId || null,
    sent: true,
    sent_at: new Date().toISOString(),
  }).catch(() => {}) // non-critical
}

function formatTime(timeStr) {
  // '14:30:00' → '2:30 PM'
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}
