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

export function exportPDF(trip: Trip) {
  const daysHTML = trip.days
    .map(
      (day, idx) => `
      <div class="day">
        <h3>Day ${idx + 1}: ${day.title}</h3>
        <p class="date">${day.date}</p>
        ${
          day.activities.length === 0
            ? '<p class="empty">No activities</p>'
            : `<ul>${day.activities
                .map(
                  (act) =>
                    `<li>${act.emoji ? `${act.emoji} ` : ''}${act.time ? `<strong>${act.time}</strong> — ` : ''}${act.description}</li>`,
                )
                .join('')}</ul>`
        }
      </div>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${trip.title}</title>
  <style>
    body { font-family: sans-serif; max-width: 700px; margin: 40px auto; color: #333; }
    h1 { font-size: 1.8rem; }
    .meta { color: #555; margin-bottom: 24px; }
    .day { margin-bottom: 24px; border-top: 1px solid #ddd; padding-top: 16px; }
    h3 { font-size: 1.1rem; margin-bottom: 4px; color: #0163a4; }
    .date { font-weight: 600; color: #0470b9; margin-bottom: 8px; }
    ul { padding-left: 18px; }
    li { margin-bottom: 6px; }
    .empty { color: #999; font-style: italic; }
  </style>
</head>
<body>
  <h1>${trip.title}</h1>
  <p class="meta">${trip.destination}, ${trip.country} &nbsp;|&nbsp; ${trip.startDate} – ${trip.endDate}</p>
  ${daysHTML}
  <script>window.onload = () => window.print()<\/script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
