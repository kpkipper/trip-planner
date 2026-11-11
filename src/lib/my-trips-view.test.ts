import { describe, expect, it } from 'vitest'

import { myTripsView } from './my-trips-view'

describe('myTripsView', () => {
  it('is loading until the login state is known', () => {
    expect(myTripsView({ ready: false, loaded: true, error: false, empty: true })).toBe('loading')
    expect(myTripsView({ ready: false, loaded: true, error: false, empty: false })).toBe('loading')
  })

  it('is loading while the first fetch runs and nothing is there yet', () => {
    expect(myTripsView({ ready: true, loaded: false, error: false, empty: true })).toBe('loading')
  })

  it('keeps showing the list while a refetch runs', () => {
    expect(myTripsView({ ready: true, loaded: false, error: false, empty: false })).toBe('list')
  })

  it('shows the error when the fetch failed and there is nothing to show', () => {
    expect(myTripsView({ ready: true, loaded: true, error: true, empty: true })).toBe('error')
  })

  it('does not claim "no trips" when the fetch failed', () => {
    expect(myTripsView({ ready: true, loaded: true, error: true, empty: true })).not.toBe('empty')
  })

  it('keeps an earlier list when a refetch failed', () => {
    expect(myTripsView({ ready: true, loaded: true, error: true, empty: false })).toBe('list')
  })

  it('is empty only after a successful fetch with no trips', () => {
    expect(myTripsView({ ready: true, loaded: true, error: false, empty: true })).toBe('empty')
  })

  it('shows the list after a successful fetch', () => {
    expect(myTripsView({ ready: true, loaded: true, error: false, empty: false })).toBe('list')
  })
})
