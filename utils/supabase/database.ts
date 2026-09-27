import type { HouseNote, HouseNoteKind, JoinRequest, JoinRequestInsert, JoinRequestUpdate, MinorFlag } from '~/types/request'

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
      house_notes: {
        Row: HouseNote
        Insert: {
          kind: HouseNoteKind
          body: string
          email?: string | null
        }
        Update: {
          kind?: HouseNoteKind
          body?: string
          email?: string | null
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
