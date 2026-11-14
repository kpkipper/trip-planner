import { describe, expect, it, vi } from 'vitest'

import { coverErrorMessage, coverFileError, uploadCover } from './cover-upload'

const file = (type: string, size: number) => ({ type, size }) as File
const httpError = (status: number, message = '') => ({
  isAxiosError: true,
  response: { status, data: { message } },
})

describe('coverFileError', () => {
  it('accepts JPEG, PNG and WebP up to 10 MB', () => {
    expect(coverFileError(file('image/jpeg', 1000))).toBeNull()
    expect(coverFileError(file('image/png', 10485760))).toBeNull()
    expect(coverFileError(file('image/webp', 1))).toBeNull()
  })
  it('refuses other types, empty files and files over 10 MB', () => {
    expect(coverFileError(file('image/gif', 1000))).toMatch(/JPEG, PNG or WebP/)
    expect(coverFileError(file('video/mp4', 1000))).toMatch(/JPEG, PNG or WebP/)
    expect(coverFileError(file('image/jpeg', 0))).toMatch(/empty/)
    expect(coverFileError(file('image/jpeg', 10485761))).toMatch(/10 MB/)
  })
})

describe('uploadCover', () => {
  it('starts, uploads the file to the signed URL, then completes', async () => {
    const target = { url: 'https://storage.example/u', method: 'PUT', headers: {} }
    const deps = {
      start: vi.fn().mockResolvedValue({ upload_id: 'abcdefghijkl', upload: target }),
      put: vi.fn().mockResolvedValue(undefined),
      complete: vi.fn().mockResolvedValue({ cover_url: 'https://storage.example/c.jpg' }),
    }
    const f = file('image/png', 2048)
    const onProgress = vi.fn()
    await expect(uploadCover('tokyo-x', f, onProgress, deps)).resolves.toBe(
      'https://storage.example/c.jpg',
    )
    expect(deps.start).toHaveBeenCalledWith('tokyo-x', {
      content_type: 'image/png',
      size_bytes: 2048,
    })
    expect(deps.put).toHaveBeenCalledWith(target, f, onProgress)
    expect(deps.complete).toHaveBeenCalledWith('tokyo-x', 'abcdefghijkl')
  })
  it('never calls the API for a file it refuses', async () => {
    const deps = { start: vi.fn(), put: vi.fn(), complete: vi.fn() }
    await expect(uploadCover('s', file('image/gif', 10), () => {}, deps)).rejects.toThrow(/JPEG/)
    expect(deps.start).not.toHaveBeenCalled()
  })
})

describe('coverErrorMessage', () => {
  it('explains what the server refused', () => {
    expect(coverErrorMessage(httpError(400, 'unsupported file format'))).toMatch(
      /JPEG, PNG or WebP/,
    )
    expect(coverErrorMessage(httpError(400, 'file too large'))).toMatch(/10 MB/)
    expect(coverErrorMessage(httpError(400, 'image dimensions too large'))).toMatch(/too big/)
    expect(coverErrorMessage(httpError(409))).toMatch(/try again/i)
    expect(coverErrorMessage(httpError(429))).toMatch(/too many/i)
    expect(coverErrorMessage(httpError(403))).toMatch(/owner/)
  })
  it('passes our own file check message through and falls back to a generic one', () => {
    expect(coverErrorMessage(new Error('Use a JPEG, PNG or WebP photo'))).toBe(
      'Use a JPEG, PNG or WebP photo',
    )
    expect(coverErrorMessage(httpError(500))).toMatch(/couldn.t/i)
    expect(coverErrorMessage(new Error('upload failed'))).toMatch(/couldn.t/i)
  })
})
