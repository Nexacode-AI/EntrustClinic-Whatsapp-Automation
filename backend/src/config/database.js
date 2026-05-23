import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'
import ws from 'ws'

export const db = createClient(env.supabase.url, env.supabase.serviceKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
})
