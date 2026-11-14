import { describe, expect, it } from 'vitest'

import { visibleLoginMethods } from './login-methods'

describe('visibleLoginMethods', () => {
  it('follows the server when it answered', () => {
    expect(visibleLoginMethods({ email: false, google: true }, true)).toEqual({
      email: false,
      google: true,
    })
    expect(visibleLoginMethods({ email: true, google: true }, true)).toEqual({
      email: true,
      google: true,
    })
  })

  it('hides Google when the web app has no client ID, even if the server has one', () => {
    expect(visibleLoginMethods({ email: true, google: true }, false)).toEqual({
      email: true,
      google: false,
    })
  })

  it('hides Google when the server cannot verify it', () => {
    expect(visibleLoginMethods({ email: true, google: false }, true)).toEqual({
      email: true,
      google: false,
    })
  })

  it('falls back to showing both when the server could not be asked', () => {
    expect(visibleLoginMethods(null, true)).toEqual({ email: true, google: true })
    expect(visibleLoginMethods(null, false)).toEqual({ email: true, google: false })
  })
})
