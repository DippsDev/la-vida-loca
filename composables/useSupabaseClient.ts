import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { JoinRequest, JoinRequestInsert, JoinRequestUpdate } from '~/types/request'

export type Database = {
  public: {
    Tables: {
      requests: {
        Row: JoinRequest
        Insert: JoinRequestInsert
        Update: JoinRequestUpdate
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

let client: SupabaseClient<Database> | null = null

export function useSupabaseClient() {
  if (import.meta.server) {
    const config = useRuntimeConfig()
    return createClient<Database>(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey,
    )
  }

  if (client) return client

  const config = useRuntimeConfig()
  client = createClient<Database>(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )
  return client
}
