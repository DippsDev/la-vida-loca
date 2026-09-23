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
