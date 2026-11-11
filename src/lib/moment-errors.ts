interface FailedRequest {
  response?: { status?: number; data?: { message?: unknown } }
}

const GENERIC = 'อัปโหลดไม่สำเร็จ'

const BY_MESSAGE: Record<string, string> = {
  'file too large': 'ไฟล์ใหญ่เกินไป',
  'unsupported file format': 'ไฟล์ชนิดนี้ใช้ไม่ได้',
  'video is longer than 60 seconds': 'คลิปยาวเกิน 60 วินาที',
  'trip has too many moments': 'ทริปนี้มีรูปครบ 500 แล้ว',
  'video processing is unavailable': 'ตอนนี้ยังอัปโหลดคลิปไม่ได้',
  'image dimensions too large': 'รูปใหญ่เกินไป',
  'upload not found': 'อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง',
}

// Thai text for a failed moment upload / complete request.
export const momentErrorMessage = (err: unknown): string => {
  const res = (err as FailedRequest | null)?.response
  if (res?.status === 429) return 'อัปโหลดบ่อยเกินไป ลองใหม่ภายหลัง'
  const message = typeof res?.data?.message === 'string' ? res.data.message : ''
  return BY_MESSAGE[message] ?? GENERIC
}
