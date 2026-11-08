import { describe, expect, it } from 'vitest'

import { joinErrorMessage, memberErrorMessage } from './member-errors'

const err = (status: number, message?: string) => ({
  response: { status, data: { message } },
})

describe('memberErrorMessage', () => {
  it('409 already a member', () => {
    expect(memberErrorMessage(err(409, 'already a member'))).toBe('This person is already a member')
  })
  it('409 trip full', () => {
    expect(memberErrorMessage(err(409, 'trip is full'))).toBe('The trip is full (20 people max)')
  })
  it('409 unknown message falls back to a conflict text', () => {
    expect(memberErrorMessage(err(409))).toBe('This person is already a member')
  })
  it('404 user not found', () => {
    expect(memberErrorMessage(err(404, 'user not found'))).toBe('User not found')
  })
  it('404 other', () => {
    expect(memberErrorMessage(err(404, 'invite not found'))).toBe(
      'Not found. It may have been removed.',
    )
  })
  it('403', () => {
    expect(memberErrorMessage(err(403, 'forbidden'))).toBe("You don't have permission to do that")
  })
  it('400 shows the validation message', () => {
    expect(memberErrorMessage(err(400, 'role must be editor or traveler'))).toBe(
      'role must be editor or traveler',
    )
  })
  it('400 without a message is generic', () => {
    expect(memberErrorMessage(err(400))).toBe('Something went wrong. Please try again.')
  })
  it('default', () => {
    expect(memberErrorMessage(err(500, 'internal server error'))).toBe(
      'Something went wrong. Please try again.',
    )
    expect(memberErrorMessage(new Error('network'))).toBe('Something went wrong. Please try again.')
    expect(memberErrorMessage(null)).toBe('Something went wrong. Please try again.')
  })
})

describe('joinErrorMessage', () => {
  it('404 means expired or revoked', () => {
    expect(joinErrorMessage(err(404, 'invite not found'))).toBe(
      'This invite link has expired or was revoked',
    )
  })
  it('409 trip full', () => {
    expect(joinErrorMessage(err(409, 'trip is full'))).toBe('The trip is full (20 people max)')
  })
  it('400 (malformed token) is treated like an invalid link', () => {
    expect(joinErrorMessage(err(400, 'invalid token'))).toBe(
      'This invite link has expired or was revoked',
    )
  })
  it('default', () => {
    expect(joinErrorMessage(err(500))).toBe('Something went wrong. Please try again.')
  })
})
