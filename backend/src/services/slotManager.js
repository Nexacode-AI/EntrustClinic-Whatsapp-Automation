/**
 * Slot Manager — generates available appointment slots from our own DB.
 * Replaces Google Calendar reading entirely.
 * Reads: doctor_availability, appointments, blocked_slots
 */
import dayjs from 'dayjs'
import { db } from '../config/database.js'
import { logger } from '../config/logger.js'

/**
 * Get all active doctors who handle a given service.
 * @param {string} serviceId - UUID
 * @returns {Array} doctors
 */
export async function getDoctorsForService(serviceId) {
  const { data, error } = await db
    .from('doctor_services')
    .select('doctors(id, name, active)')
    .eq('service_id', serviceId)

  if (error) {
    logger.error('getDoctorsForService error', { error: error.message })
    return []
  }

  return data
    .map((r) => r.doctors)
    .filter((d) => d?.active)
}

/**
 * Get all active doctors.
 */
export async function getAllDoctors() {
  const { data } = await db
    .from('doctors')
    .select('*')
    .eq('active', true)
    .order('name')
  return data || []
}

/**
 * Generate available 30-min time slots for a given doctor on a given date.
 * Excludes: existing appointments, blocked slots, outside working hours.
 *
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} doctorId - UUID (null = any doctor, returns union of all available)
 * @param {number} durationMinutes - slot duration
 * @returns {Array<string>} - available times in 'HH:mm' format
 */
export async function getAvailableSlots(dateStr, doctorId = null, durationMinutes = 30) {
  const date = dayjs(dateStr)
  const dayOfWeek = date.day() // 0=Sun, 6=Sat

  if (doctorId) {
    return getSlotsForDoctor(dateStr, dayOfWeek, doctorId, durationMinutes)
  }

  // No doctor preference — get union of slots across all active doctors
  const doctors = await getAllDoctors()
  const slotSets = await Promise.all(
    doctors.map((d) => getSlotsForDoctor(dateStr, dayOfWeek, d.id, durationMinutes))
  )

  // Union all slots, deduplicate and sort
  const allSlots = [...new Set(slotSets.flat())].sort()
  return allSlots
}

async function getSlotsForDoctor(dateStr, dayOfWeek, doctorId, durationMinutes) {
  // 1. Get working hours for this doctor on this day of week
  const { data: avail } = await db
    .from('doctor_availability')
    .select('start_time, end_time')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dayOfWeek)
    .eq('active', true)
    .single()

  if (!avail) return [] // Doctor not working this day

  // 2. Get existing appointments for this doctor on this date
  const { data: appts } = await db
    .from('appointments')
    .select('appointment_time, services(duration_minutes)')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', dateStr)
    .in('status', ['upcoming'])

  // 3. Get blocked slots for this doctor on this date
  const { data: blocks } = await db
    .from('blocked_slots')
    .select('start_time, end_time')
    .eq('blocked_date', dateStr)
    .or(`doctor_id.eq.${doctorId},doctor_id.is.null`)

  // 4. Build busy intervals
  const busyIntervals = []

  for (const appt of appts || []) {
    const duration = appt.services?.duration_minutes || durationMinutes
    const start = timeToMinutes(appt.appointment_time)
    busyIntervals.push({ start, end: start + duration })
  }

  for (const block of blocks || []) {
    if (!block.start_time) {
      // Full day block
      busyIntervals.push({ start: 0, end: 24 * 60 })
    } else {
      busyIntervals.push({
        start: timeToMinutes(block.start_time),
        end: timeToMinutes(block.end_time),
      })
    }
  }

  // 5. Generate slots
  const workStart = timeToMinutes(avail.start_time)
  const workEnd = timeToMinutes(avail.end_time)
  const nowMinutes = dayjs().isSame(dateStr, 'day')
    ? dayjs().hour() * 60 + dayjs().minute() + 60 // at least 1h from now
    : 0

  const slots = []
  let cursor = workStart

  while (cursor + durationMinutes <= workEnd) {
    const slotEnd = cursor + durationMinutes

    // Skip slots in the past (for today)
    if (cursor < nowMinutes) {
      cursor += durationMinutes
      continue
    }

    // Check if slot overlaps any busy interval
    const isBusy = busyIntervals.some(
      (b) => cursor < b.end && slotEnd > b.start
    )

    if (!isBusy) {
      slots.push(minutesToTime(cursor))
    }

    cursor += durationMinutes
  }

  return slots
}

/**
 * Get slots with doctor info — returns which doctor is available at each slot.
 * Used when patient selects "No preference" doctor.
 */
export async function getSlotsWithDoctors(dateStr, serviceId, durationMinutes = 30) {
  const doctors = await getDoctorsForService(serviceId)
  const date = dayjs(dateStr)
  const dayOfWeek = date.day()

  const result = {} // { 'HH:mm': [doctorId, ...] }

  for (const doctor of doctors) {
    const slots = await getSlotsForDoctor(dateStr, dayOfWeek, doctor.id, durationMinutes)
    for (const slot of slots) {
      if (!result[slot]) result[slot] = []
      result[slot].push(doctor.id)
    }
  }

  // Return sorted array of { time, doctorIds }
  return Object.entries(result)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, doctorIds]) => ({ time, doctorIds }))
}

/**
 * Check if a specific slot is still available for a doctor.
 * Used to validate before confirming booking.
 */
export async function isSlotAvailable(dateStr, timeStr, doctorId, durationMinutes = 30) {
  const slots = await getSlotsForDoctor(
    dateStr,
    dayjs(dateStr).day(),
    doctorId,
    durationMinutes
  )
  return slots.includes(timeStr)
}

/**
 * Block a slot (lunch, leave, holiday).
 */
export async function blockSlot({ doctorId, date, startTime, endTime, reason }) {
  const { error } = await db.from('blocked_slots').insert({
    doctor_id: doctorId || null,
    blocked_date: date,
    start_time: startTime || null,
    end_time: endTime || null,
    reason,
  })
  if (error) throw new Error(error.message)
}

/**
 * Validate that a date is a future working date.
 */
export function isValidFutureDate(dateStr) {
  const date = dayjs(dateStr)
  if (!date.isValid()) return false
  if (date.isBefore(dayjs(), 'day')) return false
  return true
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutes(timeStr) {
  // handles 'HH:mm:ss' or 'HH:mm'
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
