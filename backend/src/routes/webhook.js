import { Router } from 'express'
import { handleWebhook, handleMetaWebhook, handleMetaVerify, sendManualMessage } from '../controllers/webhook.js'
import { apiAuth } from '../middleware/auth.js'
import twilio from 'twilio'
import { env } from '../config/env.js'

const router = Router()

function validateTwilioSignature(req, res, next) {
  if (!env.twilio.connected) return next()
  const signature = req.headers['x-twilio-signature'] || ''
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  if (!twilio.validateRequest(env.twilio.authToken, signature, url, req.body)) {
    return res.status(403).send('Forbidden')
  }
  next()
}

// Twilio route (existing)
router.post('/twilio', validateTwilioSignature, handleWebhook)

// Meta Cloud API routes
router.get('/meta', handleMetaVerify)
router.post('/meta', handleMetaWebhook)

// Staff sends manual message from dashboard
router.post('/send', apiAuth, sendManualMessage)

export default router
