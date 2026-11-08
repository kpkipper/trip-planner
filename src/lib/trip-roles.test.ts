import { describe, expect, it } from 'vitest'

import { tripActions } from './trip-roles'

describe('tripActions', () => {
  it('owner can edit and delete but not leave', () => {
    expect(tripActions('owner', false)).toEqual({
      edit: true,
      delete: true,
      leave: false,
      export: true,
    })
  })

  it('editor can edit and leave', () => {
    expect(tripActions('editor', false)).toEqual({
      edit: true,
      delete: false,
      leave: true,
      export: true,
    })
  })

  it('traveler can only leave and export', () => {
    expect(tripActions('traveler', false)).toEqual({
      edit: false,
      delete: false,
      leave: true,
      export: true,
    })
  })

  it('viewers with no role only export', () => {
    expect(tripActions('', false)).toEqual({
      edit: false,
      delete: false,
      leave: false,
      export: true,
    })
    expect(tripActions(undefined, false).edit).toBe(false)
  })

  it('hides export on redacted views', () => {
    expect(tripActions('', true).export).toBe(false)
    expect(tripActions('owner', true).export).toBe(false)
  })
})
