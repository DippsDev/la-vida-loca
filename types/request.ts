export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface JoinRequest {
  id: string
  name: string
  email: string
  note: string | null
  status: RequestStatus
  created_at: string
}

export type JoinRequestInsert = {
  name: string
  email: string
  note?: string | null
  status?: RequestStatus
}

export type JoinRequestUpdate = {
  status?: RequestStatus
}
