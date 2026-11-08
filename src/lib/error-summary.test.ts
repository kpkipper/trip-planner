import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { errorSummary } from './error-summary'

describe('errorSummary', () => {
  it('never includes request headers (the bearer token)', () => {
    const headers = new AxiosHeaders({ Authorization: 'Bearer secret-token' })
    const err = new AxiosError('Request failed with status code 500', 'ERR_BAD_RESPONSE', {
      headers,
    })
    err.response = {
      status: 500,
      statusText: '',
      data: {},
      headers: {},
      config: { headers },
    }
    const summary = errorSummary(err)
    expect(summary).toBe('Request failed with status code 500 (status 500)')
    expect(summary).not.toContain('secret-token')
  })

  it('handles network errors, plain errors and non-errors', () => {
    expect(errorSummary(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe('Network Error')
    expect(errorSummary(new Error('boom'))).toBe('boom')
    expect(errorSummary('weird')).toBe('Unknown error')
    expect(errorSummary(null)).toBe('Unknown error')
  })
})
