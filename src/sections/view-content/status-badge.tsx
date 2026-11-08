import { statusLabel } from '@/lib/trip-status'

import type { JourneyStatusType } from '@/api/journey/type'

const TONES = {
  planning: 'bg-gray-100 text-gray-600',
  upcoming: 'bg-blue-50 text-[#0163a4]',
  ongoing: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
} as const

export default function StatusBadge({ status }: { status: JourneyStatusType | undefined }) {
  const label = statusLabel(status)
  if (!label) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[label.tone]}`}
    >
      <span aria-hidden>{label.emoji}</span>
      {label.text}
    </span>
  )
}
