import type { JourneyStatusType } from '@/api/journey/type'

export interface StatusLabel {
  emoji: string
  text: string
  tone: 'planning' | 'upcoming' | 'ongoing' | 'completed'
}

export const statusLabel = (status: JourneyStatusType | undefined): StatusLabel | null => {
  if (!status) return null
  switch (status.state) {
    case 'planning':
      return { emoji: '📝', text: 'Planning', tone: 'planning' }
    case 'upcoming':
      return {
        emoji: '✈️',
        text:
          status.days_until > 0
            ? `In ${status.days_until} ${status.days_until === 1 ? 'day' : 'days'}`
            : 'Upcoming',
        tone: 'upcoming',
      }
    case 'ongoing':
      return {
        emoji: '🟢',
        text: `Day ${status.day_number} of ${status.total_days}`,
        tone: 'ongoing',
      }
    case 'completed':
      return { emoji: '✅', text: 'Completed', tone: 'completed' }
    default:
      return null
  }
}

export const liveLabel = (live: { city: string; dayNumber: number; totalDays: number }) =>
  `Now in ${live.city} · Day ${live.dayNumber} of ${live.totalDays}`
