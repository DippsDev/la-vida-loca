export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface JoinRequest {
  id: number
  first_name: string
  surname: string
  email: string
  phone: string
  age: number
  note: string | null
  ticket_code: string
  status: RequestStatus
  created_at: string
  decided_at: string | null
}

export type JoinRequestInsert = {
  first_name: string
  surname: string
  email: string
  phone: string
  age: number
  note?: string | null
}

export type JoinRequestUpdate = {
  status?: RequestStatus
}

export interface MinorFlag {
  email: string
  first_name: string | null
  surname: string | null
  age: number
  created_at: string
}

export type HouseNoteKind = 'feedback' | 'bug'

export interface HouseNote {
  id: number
  kind: HouseNoteKind
  body: string
  email: string | null
  created_at: string
}
