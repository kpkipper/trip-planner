export interface Envelope<T> {
  code?: string
  message?: string
  data: T
}

export type ReportTargetType = 'user' | 'journey' | 'moment'
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'privacy' | 'other'

export interface ReportInput {
  target_type: ReportTargetType
  target: string
  reason: ReportReason
  note?: string
}

export interface ReportView {
  id: string
  target_type: ReportTargetType
  reason: ReportReason
  status: string
  created_at: string
}
