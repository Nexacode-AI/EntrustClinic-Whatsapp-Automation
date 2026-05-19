import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

export const db = createClient(env.supabase.url, env.supabase.serviceKey, {
  auth: { persistSession: false },
})
