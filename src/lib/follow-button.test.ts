import { describe, expect, it } from 'vitest'

import { followButton } from './follow-button'

describe('followButton', () => {
  it('shows Unfollow when following', () => {
    expect(
      followButton({ is_following: true, follow_requested: false, follow_approval: true }),
    ).toEqual({ label: 'Unfollow', action: 'unfollow' })
  })
  it('shows Requested (cancel) when a request is pending', () => {
    expect(
      followButton({ is_following: false, follow_requested: true, follow_approval: true }),
    ).toEqual({ label: 'Requested', action: 'cancel' })
  })
  it('shows Request to follow when approval is required', () => {
    expect(
      followButton({ is_following: false, follow_requested: false, follow_approval: true }),
    ).toEqual({ label: 'Request to follow', action: 'follow' })
  })
  it('shows Follow when approval is off', () => {
    expect(
      followButton({ is_following: false, follow_requested: false, follow_approval: false }),
    ).toEqual({ label: 'Follow', action: 'follow' })
  })
  it('treats missing fields from older servers as Follow', () => {
    expect(followButton({ is_following: false })).toEqual({ label: 'Follow', action: 'follow' })
  })
})
