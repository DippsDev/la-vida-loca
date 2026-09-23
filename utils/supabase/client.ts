import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database'

let browserClient: SupabaseClient<Database> | null = null

export function createClient() {
  if (browserClient) return browserClient

  const config = useRuntimeConfig()
  browserClient = createBrowserClient<Database>(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )
  return browserClient
}
