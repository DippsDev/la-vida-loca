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
