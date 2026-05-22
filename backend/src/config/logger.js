import winston from 'winston'
import { env } from './env.js'

export const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.nodeEnv === 'production'
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
          return `${timestamp} [${level.toUpperCase()}] ${message}${extra}`
        })
  ),
  transports: [
    new winston.transports.Console(),
    ...(env.nodeEnv !== 'production' ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ] : []),
  ],
})
