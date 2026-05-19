import { parseTwilioWebhook, sendMessage } from '../services/twilio.js'
import { processMessage } from '../services/bot.js'
import { logger } from '../config/logger.js'

export async function handleWebhook(req, res) {
  // Twilio expects a 200 immediately, then we process async
  res.status(200).send('<Response></Response>')

  const parsed = parseTwilioWebhook(req.body)
  if (!parsed) {
    logger.warn('Webhook: invalid payload', { body: req.body })
    return
  }

  const { phone, text } = parsed
  logger.info('Inbound message', { phone, text: text.slice(0, 80) })

  try {
    const reply = await processMessage(phone, text)
    if (reply) await sendMessage(phone, reply)
  } catch (err) {
    logger.error('Webhook: processing error', { phone, error: err.message, stack: err.stack })
    await sendMessage(phone, "Sorry, something went wrong. Please try again in a moment.").catch(() => {})
  }
}

// Staff sends a manual reply from the dashboard
export async function sendManualMessage(req, res) {
  const { phone, message } = req.body
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' })

  try {
    await sendMessage(phone, message)
    res.json({ ok: true })
  } catch (err) {
    logger.error('Manual message error', { error: err.message })
    res.status(500).json({ error: 'Failed to send message' })
  }
}
