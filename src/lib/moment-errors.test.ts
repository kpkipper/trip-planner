import { describe, expect, it } from 'vitest'

import { momentErrorMessage } from './moment-errors'

const err = (status: number, message?: string) => ({ response: { status, data: { message } } })

describe('momentErrorMessage', () => {
  it.each([
    [err(400, 'file too large'), 'ไฟล์ใหญ่เกินไป'],
    [err(400, 'unsupported file format'), 'ไฟล์ชนิดนี้ใช้ไม่ได้'],
    [err(400, 'video is longer than 60 seconds'), 'คลิปยาวเกิน 60 วินาที'],
    [err(409, 'trip has too many moments'), 'ทริปนี้มีรูปครบ 500 แล้ว'],
    [err(429, 'too many requests'), 'อัปโหลดบ่อยเกินไป ลองใหม่ภายหลัง'],
    [err(429), 'อัปโหลดบ่อยเกินไป ลองใหม่ภายหลัง'],
    [err(400, 'video processing is unavailable'), 'ตอนนี้ยังอัปโหลดคลิปไม่ได้'],
    [err(400, 'image dimensions too large'), 'รูปใหญ่เกินไป'],
    [err(400, 'upload not found'), 'อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง'],
    [err(500, 'boom'), 'อัปโหลดไม่สำเร็จ'],
    [new Error('network'), 'อัปโหลดไม่สำเร็จ'],
    [null, 'อัปโหลดไม่สำเร็จ'],
  ])('maps %j', (e, expected) => {
    expect(momentErrorMessage(e)).toBe(expected)
  })
})
