import './config/env.js'
import app from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { startScheduler } from './services/scheduler.js'
import { mkdir } from 'fs/promises'

if (env.nodeEnv !== 'production') {
  await mkdir('logs', { recursive: true })
}

startScheduler()

app.listen(env.port, () => {
  logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`)
  logger.info(`Twilio: ${env.twilio.connected ? 'connected' : 'test mode (not connected)'}`)
})
