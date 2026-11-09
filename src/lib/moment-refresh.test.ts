import { describe, expect, it } from 'vitest'

import {
  ERROR_REFRESH_GAP_MS,
  shouldRefreshOnError,
  shouldRefreshOnVisible,
  STALE_AFTER_MS,
} from './moment-refresh'

describe('shouldRefreshOnVisible', () => {
  it('refreshes only when the last load is more than 50 minutes old', () => {
    expect(STALE_AFTER_MS).toBe(50 * 60_000)
    expect(shouldRefreshOnVisible(0, STALE_AFTER_MS)).toBe(false)
    expect(shouldRefreshOnVisible(0, STALE_AFTER_MS + 1)).toBe(true)
    expect(shouldRefreshOnVisible(1000, 2000)).toBe(false)
  })
})

describe('shouldRefreshOnError', () => {
  it('allows one refresh per 5 minutes', () => {
    expect(ERROR_REFRESH_GAP_MS).toBe(5 * 60_000)
    expect(shouldRefreshOnError(null, 10)).toBe(true)
    expect(shouldRefreshOnError(0, ERROR_REFRESH_GAP_MS - 1)).toBe(false)
    expect(shouldRefreshOnError(0, ERROR_REFRESH_GAP_MS)).toBe(true)
  })
})
