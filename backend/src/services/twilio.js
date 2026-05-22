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

export async function sendMessage(to, body) {
  const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  await db.from('messages').insert({ phone: to, direction: 'outbound', body })

  if (twilioClient) {
    await twilioClient.messages.create({ from: env.twilio.whatsappNumber, to: toWhatsapp, body })
    logger.debug('Message sent', { to, body: body.slice(0, 60) })
  } else {
    logger.info(`[TEST MODE] → ${to}: ${body}`)
  }
}

// Sends a WhatsApp interactive message (buttons or list). Falls back to plain text if Twilio rejects it.
export async function sendInteractiveMessage(to, fallbackText, interactiveData) {
  const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  await db.from('messages').insert({ phone: to, direction: 'outbound', body: fallbackText })

  if (!twilioClient) {
    logger.info(`[TEST MODE] → ${to}: [Interactive] ${fallbackText.slice(0, 60)}`)
    return
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${env.twilio.accountSid}/Messages.json`
    const params = new URLSearchParams({
      From: env.twilio.whatsappNumber,
      To: toWhatsapp,
      Body: fallbackText,
      InteractiveData: JSON.stringify(interactiveData),
    })
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${env.twilio.accountSid}:${env.twilio.authToken}`).toString('base64'),
      },
      body: params.toString(),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      logger.warn('Interactive message failed — falling back to plain text', { code: err.code, msg: err.message })
      await twilioClient.messages.create({ from: env.twilio.whatsappNumber, to: toWhatsapp, body: fallbackText })
    } else {
      logger.debug('Interactive message sent', { to })
    }
  } catch (err) {
    logger.error('sendInteractiveMessage error', { error: err.message })
    await twilioClient.messages.create({ from: env.twilio.whatsappNumber, to: toWhatsapp, body: fallbackText }).catch(() => {})
  }
}

// Parse incoming Twilio webhook. Also captures button/list payloads from interactive replies.
export function parseTwilioWebhook(body) {
  const from = body.From?.replace('whatsapp:', '') || ''
  const text = (body.Body || '').trim()
  if (!from || !text) return null
  // ButtonPayload = quick reply button ID, ListId = list selection row ID
  const buttonPayload = body.ButtonPayload || null
  const listId = body.ListId || null
  return { phone: from, text, buttonPayload, listId }
}
