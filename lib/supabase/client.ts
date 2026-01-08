import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://xqhbfpeonoeamforfeyn.supabase.co'
const supabaseAnonKey = 'sb_publishable_PccM74U9qHlfSmMwTnLWmA_aDb4pqrK'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
