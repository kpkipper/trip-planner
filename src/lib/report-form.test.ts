import { describe, expect, it } from 'vitest'

import { REPORT_REASONS, reportErrorMessage, validateReport } from './report-form'

describe('validateReport', () => {
  it.each([
    [{ reason: 'spam', note: '' }, null],
    [{ reason: 'harassment', note: 'x'.repeat(500) }, null],
    [{ reason: 'privacy', note: 'ก'.repeat(500) }, null],
    [{ reason: '', note: '' }, 'เลือกเหตุผลก่อน'],
    [{ reason: 'bogus', note: '' }, 'เลือกเหตุผลก่อน'],
    [{ reason: 'other', note: 'x'.repeat(501) }, 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร'],
  ])('%j -> %s', (input, expected) => {
    expect(validateReport(input)).toBe(expected)
  })

  it('lists the five reasons in Thai', () => {
    expect(REPORT_REASONS.map((r) => r.value)).toEqual([
      'spam',
      'harassment',
      'inappropriate',
      'privacy',
      'other',
    ])
    expect(REPORT_REASONS.map((r) => r.label)).toEqual([
      'สแปม',
      'คุกคาม',
      'ไม่เหมาะสม',
      'ละเมิดความเป็นส่วนตัว',
      'อื่น ๆ',
    ])
  })
})

describe('reportErrorMessage', () => {
  it.each([
    [{ response: { status: 404 } }, 'ไม่พบสิ่งที่ต้องการรายงาน'],
    [{ response: { status: 429 } }, 'รายงานบ่อยเกินไป ลองใหม่ภายหลัง'],
    [{ response: { status: 500 } }, 'ส่งรายงานไม่สำเร็จ'],
    [new Error('x'), 'ส่งรายงานไม่สำเร็จ'],
  ])('%j -> %s', (err, expected) => {
    expect(reportErrorMessage(err)).toBe(expected)
  })
})
