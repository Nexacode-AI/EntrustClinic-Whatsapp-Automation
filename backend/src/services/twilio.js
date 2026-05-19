/**
 * Twilio WhatsApp service.
 * Connect by filling TWILIO_* env vars — no code changes needed.
 * When not connected, messages are logged to console for testing.
 */
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { db } from '../config/database.js'

let twilioClient = null

if (env.twilio.connected) {
  const { default: Twilio } = await import('twilio')
  twilioClient = new Twilio(env.twilio.accountSid, env.twilio.authToken)
  logger.info('Twilio connected')
} else {
  logger.warn('Twilio not connected — messages will be logged only (test mode)')
}

/**
 * Send a WhatsApp message to a patient.
 * @param {string} to - E.164 phone number e.g. +601XXXXXXXXX
 * @param {string} body - Message text
 */
export async function sendMessage(to, body) {
  const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  // Always persist outbound message for chat history
  await db.from('messages').insert({ phone: to, direction: 'outbound', body })

  if (twilioClient) {
    await twilioClient.messages.create({
      from: env.twilio.whatsappNumber,
      to: toWhatsapp,
      body,
    })
    logger.debug('Message sent', { to, body: body.slice(0, 60) })
  } else {
    logger.info(`[TEST MODE] → ${to}: ${body}`)
  }
}

/**
 * Parse incoming Twilio webhook body into a standard object.
 * Returns null if the payload is not a valid WhatsApp message.
 */
export function parseTwilioWebhook(body) {
  const from = body.From?.replace('whatsapp:', '') || ''
  const text = (body.Body || '').trim()
  if (!from || !text) return null
  return { phone: from, text }
}
