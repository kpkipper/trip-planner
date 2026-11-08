import { describe, expect, it } from 'vitest'

import { classifyLoadError } from './load-error'

const http = (status: number) => Object.assign(new Error('x'), { response: { status } })

describe('classifyLoadError', () => {
  it('maps HTTP statuses', () => {
    expect(classifyLoadError(http(404))).toBe('not-found')
    expect(classifyLoadError(http(403))).toBe('forbidden')
    expect(classifyLoadError(http(500))).toBe('error')
    expect(classifyLoadError(new Error('network'))).toBe('error')
  })

  it('keeps the body-code check for backward compatibility', () => {
    expect(classifyLoadError(undefined, { code: 'JOURNEY-404000' })).toBe('not-found')
    expect(classifyLoadError(undefined, { code: 'JOURNEY-200000' })).toBeNull()
  })
})
