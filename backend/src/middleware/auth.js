import { env } from '../config/env.js'

export function apiAuth(req, res, next) {
  const key = req.headers['x-api-key']
  if (!key || key !== env.dashboardApiKey) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
