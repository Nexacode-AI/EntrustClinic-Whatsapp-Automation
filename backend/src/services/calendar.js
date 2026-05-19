import { google } from 'googleapis'
import dayjs from 'dayjs'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

// Clinic operating hours per day of week (0=Sunday)
const CLINIC_HOURS = {
  0: { open: '09:00', close: '13:00' }, // Sunday
  1: { open: '09:00', close: '21:00' },
  2: { open: '09:00', close: '21:00' },
  3: { open: '09:00', close: '21:00' },
  4: { open: '09:00', close: '21:00' },
  5: { open: '09:00', close: '21:00' },
  6: { open: '09:00', close: '21:00' }, // Saturday
}

const SLOT_DURATION = 30 // minutes

function getAuth() {
  const auth = new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret
  )
  auth.setCredentials({ refresh_token: env.google.refreshToken })
  return auth
}

/**
 * Get available booking slots for a given date.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string[]} - Array of 'HH:mm' strings
 */
export async function getAvailableSlots(dateStr) {
  const date = dayjs(dateStr)
  const dow = date.day()
  const hours = CLINIC_HOURS[dow]

  if (!hours) return []

  const timeMin = date.format('YYYY-MM-DD') + 'T' + hours.open + ':00+08:00'
  const timeMax = date.format('YYYY-MM-DD') + 'T' + hours.close + ':00+08:00'

  let busyPeriods = []
  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() })
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: 'Asia/Kuala_Lumpur',
        items: [{ id: env.google.calendarId }],
      },
    })
    busyPeriods = res.data.calendars?.[env.google.calendarId]?.busy || []
  } catch (err) {
    logger.error('Google Calendar freebusy error', { error: err.message })
    return []
  }

  // Generate all possible slots
  const allSlots = []
  let cursor = dayjs(`${dateStr}T${hours.open}`)
  const closeTime = dayjs(`${dateStr}T${hours.close}`)

  while (cursor.isBefore(closeTime)) {
    allSlots.push(cursor.format('HH:mm'))
    cursor = cursor.add(SLOT_DURATION, 'minute')
  }

  // Filter out busy slots
  const available = allSlots.filter((slot) => {
    const slotStart = dayjs(`${dateStr}T${slot}`)
    const slotEnd = slotStart.add(SLOT_DURATION, 'minute')
    return !busyPeriods.some((busy) => {
      const busyStart = dayjs(busy.start)
      const busyEnd = dayjs(busy.end)
      return slotStart.isBefore(busyEnd) && slotEnd.isAfter(busyStart)
    })
  })

  return available
}

/**
 * Create a calendar event for a confirmed appointment.
 * @returns {string} Google Calendar event ID
 */
export async function createCalendarEvent({ patientName, serviceName, dateStr, timeStr }) {
  const start = dayjs(`${dateStr}T${timeStr}`).format()
  const end = dayjs(`${dateStr}T${timeStr}`).add(SLOT_DURATION, 'minute').format()

  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() })
    const res = await calendar.events.insert({
      calendarId: env.google.calendarId,
      requestBody: {
        summary: `${patientName} — ${serviceName}`,
        start: { dateTime: start, timeZone: 'Asia/Kuala_Lumpur' },
        end: { dateTime: end, timeZone: 'Asia/Kuala_Lumpur' },
        description: `Booked via Entrust Clinic WhatsApp Bot`,
      },
    })
    return res.data.id
  } catch (err) {
    logger.error('Google Calendar create event error', { error: err.message })
    return null
  }
}

/**
 * Delete a calendar event when appointment is cancelled/rescheduled.
 */
export async function deleteCalendarEvent(eventId) {
  if (!eventId) return
  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() })
    await calendar.events.delete({ calendarId: env.google.calendarId, eventId })
  } catch (err) {
    logger.error('Google Calendar delete event error', { error: err.message })
  }
}

/**
 * Check if a date string is a valid future date (not in the past, not today).
 */
export function isValidFutureDate(dateStr) {
  const date = dayjs(dateStr)
  return date.isValid() && date.isAfter(dayjs(), 'day')
}
