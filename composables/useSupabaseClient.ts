import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from '~/utils/supabase/client'
import { createClient as createServerClient } from '~/utils/supabase/server'
import type { Database } from '~/utils/supabase/database'

export type { Database }

export function useSupabaseClient(): SupabaseClient<Database> | null {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) return null
  if (import.meta.server) return createServerClient()
  return createBrowserClient()
}
