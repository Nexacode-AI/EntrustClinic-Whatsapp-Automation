import { parseTwilioWebhook, sendMessage, sendInteractiveMessage } from '../services/twilio.js'
import { parseMetaWebhook, sendMessage as metaSend, sendInteractiveMessage as metaSendInteractive } from '../services/meta.js'
import { processMessage } from '../services/bot.js'
import { logger } from '../config/logger.js'
import { env } from '../config/env.js'

async function dispatch(phone, text, buttonPayload, listId, sender) {
  try {
    const result = await processMessage(phone, text, buttonPayload, listId)
    if (!result) return
    if (result.interactive) {
      await sender.sendInteractive(phone, result.text, result.interactive)
    } else {
      await sender.send(phone, result.text)
    }
  } catch (err) {
    logger.error('Webhook: processing error', { phone, error: err.message, stack: err.stack })
    await sender.send(phone, 'Sorry, something went wrong. Please try again in a moment.').catch(() => {})
  }
}

// Twilio incoming messages
export async function handleWebhook(req, res) {
  res.status(200).send('<Response></Response>')

  const parsed = parseTwilioWebhook(req.body)
  if (!parsed) {
    logger.warn('Twilio webhook: invalid payload', { body: req.body })
    return
  }

  const { phone, text, buttonPayload, listId } = parsed
  logger.info('Inbound (Twilio)', { phone, text: text.slice(0, 80) })

  await dispatch(phone, text, buttonPayload, listId, {
    send: sendMessage,
    sendInteractive: sendInteractiveMessage,
  })
}

// Meta Cloud API — webhook verification (GET)
export function handleMetaVerify(req, res) {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === env.meta.webhookVerifyToken) {
    logger.info('Meta webhook verified')
    return res.status(200).send(challenge)
  }
  logger.warn('Meta webhook verification failed', { mode, token })
  res.sendStatus(403)
}

// Meta Cloud API — incoming messages (POST)
export async function handleMetaWebhook(req, res) {
  res.sendStatus(200)

  const parsed = parseMetaWebhook(req.body)
  if (!parsed) return

  const { phone, text, buttonPayload, listId } = parsed
  logger.info('Inbound (Meta)', { phone, text: text.slice(0, 80) })

  await dispatch(phone, text, buttonPayload, listId, {
    send: metaSend,
    sendInteractive: metaSendInteractive,
  })
}

// Staff sends a manual reply from the dashboard
export async function sendManualMessage(req, res) {
  const { phone, message } = req.body
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' })

  try {
    const sender = env.meta.connected ? metaSend : sendMessage
    await sender(phone, message)
    res.json({ ok: true })
  } catch (err) {
    logger.error('Manual message error', { error: err.message })
    res.status(500).json({ error: 'Failed to send message' })
  }
}
