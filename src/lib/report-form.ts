import type { ReportReason } from '@/api/safety/type'

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'สแปม' },
  { value: 'harassment', label: 'คุกคาม' },
  { value: 'inappropriate', label: 'ไม่เหมาะสม' },
  { value: 'privacy', label: 'ละเมิดความเป็นส่วนตัว' },
  { value: 'other', label: 'อื่น ๆ' },
]

export const MAX_NOTE = 500

export const validateReport = (form: { reason: string; note: string }): string | null => {
  if (!REPORT_REASONS.some((r) => r.value === form.reason)) return 'เลือกเหตุผลก่อน'
  if ([...form.note].length > MAX_NOTE) return `รายละเอียดต้องไม่เกิน ${MAX_NOTE} ตัวอักษร`
  return null
}

export const reportErrorMessage = (err: unknown): string => {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status === 404) return 'ไม่พบสิ่งที่ต้องการรายงาน'
  if (status === 429) return 'รายงานบ่อยเกินไป ลองใหม่ภายหลัง'
  return 'ส่งรายงานไม่สำเร็จ'
}
