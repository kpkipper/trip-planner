import { describe, expect, it, vi } from 'vitest'

import { copyText } from './clipboard'

describe('copyText', () => {
  it('uses the async clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const legacy = vi.fn()
    await expect(copyText('hi', { writeText, legacy })).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hi')
    expect(legacy).not.toHaveBeenCalled()
  })
  it('falls back when the async clipboard rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    const legacy = vi.fn().mockReturnValue(true)
    await expect(copyText('hi', { writeText, legacy })).resolves.toBe(true)
    expect(legacy).toHaveBeenCalledWith('hi')
  })
  it('falls back when there is no async clipboard', async () => {
    const legacy = vi.fn().mockReturnValue(true)
    await expect(copyText('hi', { legacy })).resolves.toBe(true)
  })
  it('reports failure when both fail or throw', async () => {
    await expect(copyText('hi', { legacy: () => false })).resolves.toBe(false)
    await expect(
      copyText('hi', {
        legacy: () => {
          throw new Error('x')
        },
      }),
    ).resolves.toBe(false)
  })
})
