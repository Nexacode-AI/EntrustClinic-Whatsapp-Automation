import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import webhookRouter from './routes/webhook.js'
import apiRouter from './routes/api.js'
import { logger } from './config/logger.js'

const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(cors())

// Twilio sends URL-encoded body
app.use('/webhook', express.urlencoded({ extended: false }))
app.use('/api', express.json())

// Rate limit the API — generous for dashboard use
app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }))

// Webhook has a higher limit (Twilio can send bursts)
app.use('/webhook', rateLimit({ windowMs: 60_000, max: 1000 }))

app.use('/webhook', webhookRouter)
app.use('/api', apiRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ error: 'Internal server error' })
})

export default app
