/**
 * Google Calendar Push Service — ONE-WAY ONLY
 * Pushes appointment events TO doctor's Google Calendars.
 * Never reads from Google Calendar (slots come from our own DB).
 */
import { google } from 'googleapis'
import dayjs from 'dayjs'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

let calendar = null

function getCalendarClient() {
  if (calendar) return calendar

  if (!env.google.clientId || !env.google.clientSecret || !env.google.refreshToken) {
    logger.warn('Google Calendar not configured — push disabled')
    return null
  }

  const auth = new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret
  )
  auth.setCredentials({ refresh_token: env.google.refreshToken })
  calendar = google.calendar({ version: 'v3', auth })
  return calendar
}

/**
 * Create a Google Calendar event on a doctor's calendar.
 * @param {Object} params
 * @param {string} params.calendarId - Doctor's Google Calendar ID (e.g. doctor@gmail.com)
 * @param {string} params.patientName
 * @param {string} params.serviceName
 * @param {string} params.dateStr - 'YYYY-MM-DD'
 * @param {string} params.timeStr - 'HH:mm' or 'HH:mm:ss'
 * @param {number} params.durationMinutes
 * @param {string} params.patientPhone
 * @param {string} params.bookingId
 * @returns {string|null} Google Calendar event ID
 */
export async function pushAppointmentToCalendar({
  calendarId,
  patientName,
  serviceName,
  dateStr,
  timeStr,
  durationMinutes = 30,
  patientPhone,
  bookingId,
}) {
  const cal = getCalendarClient()
  if (!cal || !calendarId) return null

  try {
    const startDt = dayjs(`${dateStr}T${timeStr.slice(0, 5)}`)
    const endDt = startDt.add(durationMinutes, 'minute')

    const event = {
      summary: `${serviceName} — ${patientName}`,
      location: env.clinic.name,
      description: `Patient: ${patientName}\nPhone: ${patientPhone || 'N/A'}\nBooking ID: #${bookingId}\n\nBooked via ${env.clinic.name} WhatsApp Bot`,
      start: {
        dateTime: startDt.format('YYYY-MM-DDTHH:mm:ss'),
        timeZone: 'Asia/Kuala_Lumpur',
      },
      end: {
        dateTime: endDt.format('YYYY-MM-DDTHH:mm:ss'),
        timeZone: 'Asia/Kuala_Lumpur',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    }

    const response = await cal.events.insert({
      calendarId,
      resource: event,
    })

    logger.info('Calendar event created', { calendarId, eventId: response.data.id, patient: patientName })
    return response.data.id
  } catch (err) {
    logger.error('Failed to push event to Google Calendar', { calendarId, error: err.message })
    return null // Non-fatal — booking still proceeds
  }
}

/**
 * Update an existing Google Calendar event (e.g. after reschedule).
 */
export async function updateCalendarEvent({
  calendarId,
  eventId,
  dateStr,
  timeStr,
  durationMinutes = 30,
}) {
  const cal = getCalendarClient()
  if (!cal || !calendarId || !eventId) return

  try {
    const startDt = dayjs(`${dateStr}T${timeStr.slice(0, 5)}`)
    const endDt = startDt.add(durationMinutes, 'minute')

    await cal.events.patch({
      calendarId,
      eventId,
      resource: {
        start: {
          dateTime: startDt.format('YYYY-MM-DDTHH:mm:ss'),
          timeZone: 'Asia/Kuala_Lumpur',
        },
        end: {
          dateTime: endDt.format('YYYY-MM-DDTHH:mm:ss'),
          timeZone: 'Asia/Kuala_Lumpur',
        },
      },
    })

    logger.info('Calendar event updated', { calendarId, eventId })
  } catch (err) {
    logger.error('Failed to update Google Calendar event', { eventId, error: err.message })
  }
}

/**
 * Delete a Google Calendar event (e.g. after cancellation).
 */
export async function deleteCalendarEvent({ calendarId, eventId }) {
  const cal = getCalendarClient()
  if (!cal || !calendarId || !eventId) return

  try {
    await cal.events.delete({ calendarId, eventId })
    logger.info('Calendar event deleted', { calendarId, eventId })
  } catch (err) {
    logger.error('Failed to delete Google Calendar event', { eventId, error: err.message })
  }
}
