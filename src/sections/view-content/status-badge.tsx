import { statusLabel } from '@/lib/trip-status'
import { cn } from '@/lib/ui-classes'

import type { JourneyStatusType } from '@/api/journey/type'

// `glass` sits on a cover photo (trip hero); `default` on white cards.
type Variant = 'default' | 'glass'

const TONES = {
  planning: 'bg-chip text-ink-2',
  upcoming: 'bg-chip text-ink-2',
  ongoing: 'bg-live/10 text-live',
  completed: 'bg-chip text-ink-2',
} as const

const GLASS = 'bg-white/20 text-white backdrop-blur-md'

export default function StatusBadge({
  status,
  variant = 'default',
}: {
  status: JourneyStatusType | undefined
  variant?: Variant
}) {
  const label = statusLabel(status)
  if (!label) return null
  const live = label.tone === 'ongoing'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium leading-normal whitespace-nowrap',
        variant === 'glass' ? GLASS : TONES[label.tone],
      )}
    >
      {live ? (
        // Travelling: a live green dot instead of the 🟢 emoji.
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-live ring-4 ring-live/25" />
      ) : (
        <span aria-hidden>{label.emoji}</span>
      )}
      <span>{label.text}</span>
    </span>
  )
}
