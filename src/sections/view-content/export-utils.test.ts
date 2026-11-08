import { describe, expect, it } from 'vitest'

import { buildPdfHtml } from './export-utils'

import type { Trip } from '@/types/trip'

const payload = '<script>alert(1)</script>'
const imgPayload = '<img src=x onerror="alert(2)">'

const trip: Trip = {
  title: payload,
  destination: imgPayload,
  country: `"><svg onload=alert(3)>`,
  startDate: '2026-12-01',
  endDate: '2026-12-02',
  days: [
    {
      id: 'd1',
      date: imgPayload,
      dateISO: '2026-12-01',
      title: payload,
      activities: [
        {
          id: 'p1',
          time: '<b>9</b>',
          description: imgPayload,
          mapUrl: 'javascript:alert(4)',
        },
      ],
    },
  ],
}

describe('buildPdfHtml', () => {
  const html = buildPdfHtml(trip)

  it('escapes every user value', () => {
    expect(html).not.toContain(payload)
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('<b>9</b>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(2)&quot;&gt;')
  })

  it('keeps only its own print script', () => {
    expect(html.match(/<script>/g)).toHaveLength(1)
    expect(html).toContain('<script>window.onload = () => window.print()</script>')
  })

  it('renders no links from user URLs', () => {
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('<a ')
  })
})
