import { describe, expect, it } from 'vitest'

import { escapeHtml } from './escape-html'

describe('escapeHtml', () => {
  it('escapes the five HTML special characters', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    )
  })

  it('escapes & first so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('treats missing values as empty', () => {
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(null)).toBe('')
  })
})
