import { Router } from 'express'
import { handleWebhook, sendManualMessage } from '../controllers/webhook.js'
import { apiAuth } from '../middleware/auth.js'

const router = Router()

// Twilio posts here for every incoming WhatsApp message
router.post('/twilio', handleWebhook)

// Staff sends manual message from dashboard
router.post('/send', apiAuth, sendManualMessage)

export default router
