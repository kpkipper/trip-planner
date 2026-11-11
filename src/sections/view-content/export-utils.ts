import { escapeHtml } from '@/lib/escape-html'

import type { Trip } from '@/types/trip'

export function exportJSON(trip: Trip) {
  const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${trip.slug ?? trip.title}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Every user value is escaped: the page opens as a same-origin blob and could read localStorage.
// User URLs (map links) are left out on purpose.
export function buildPdfHtml(trip: Trip): string {
  const e = escapeHtml
  const daysHTML = trip.days
    .map(
      (day, idx) => `
      <div class="day">
        <h3>Day ${idx + 1}: ${e(day.title)}</h3>
        <p class="date">${e(day.date)}</p>
        ${
          day.activities.length === 0
            ? '<p class="empty">No activities</p>'
            : `<ul>${day.activities
                .map(
                  (act) =>
                    `<li>${act.time ? `<strong>${e(act.time)}</strong> — ` : ''}${e(act.description)}</li>`,
                )
                .join('')}</ul>`
        }
      </div>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${e(trip.title)}</title>
  <style>
    body { font-family: sans-serif; max-width: 700px; margin: 40px auto; color: #333; }
    h1 { font-size: 1.8rem; }
    .meta { color: #555; margin-bottom: 24px; }
    .day { margin-bottom: 24px; border-top: 1px solid #ddd; padding-top: 16px; }
    h3 { font-size: 1.1rem; margin-bottom: 4px; color: #171717; }
    .date { font-weight: 600; color: #0066cc; margin-bottom: 8px; }
    ul { padding-left: 18px; }
    li { margin-bottom: 6px; }
    .empty { color: #999; font-style: italic; }
  </style>
</head>
<body>
  <h1>${e(trip.title)}</h1>
  <p class="meta">${e(trip.destination)}, ${e(trip.country)} &nbsp;|&nbsp; ${e(trip.startDate)} – ${e(trip.endDate)}</p>
  ${daysHTML}
  <script>window.onload = () => window.print()<\/script>
</body>
</html>`
}

export function exportPDF(trip: Trip) {
  const html = buildPdfHtml(trip)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
