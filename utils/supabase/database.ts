import type { JoinRequest, JoinRequestInsert, JoinRequestUpdate, MinorFlag } from '~/types/request'

export type Database = {
  public: {
    Tables: {
      requests: {
        Row: JoinRequest
        Insert: JoinRequestInsert
        Update: JoinRequestUpdate
        Relationships: []
      }
      minor_flags: {
        Row: MinorFlag
        Insert: {
          email: string
          first_name?: string | null
          surname?: string | null
          age: number
          created_at?: string
        }
        Update: {
          email?: string
          first_name?: string | null
          surname?: string | null
          age?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
