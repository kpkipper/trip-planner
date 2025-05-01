'use client'

import React from 'react'
import Chip from '@mui/material/Chip'

interface PlanChipProps {
  plan: string
  highlight?: boolean
  onClick?: () => void
}

const emojiMap: { [key: string]: string } = {
  airport: '🛫',
  travel: '🚆',
  hotel: '🏨',
  temple: '⛩️',
  shrine: '🛕',
  museum: '🏛️',
  aquarium: '🐠',
  lunch: '🍜',
  breakfast: '🍳',
  dinner: '🍣',
  shopping: '🛍️',
  park: '🌳',
  tower: '🗼',
  skytree: '🎡',
  zoo: '🦁',
  ferris: '🎡',
  game: '🕹️',
  center: '🏬',
  rest: '😴',
  'check-in': '📝',
  'check-out': '📦',
  return: '🏠',
  walk: '🚶‍♂️',
  explore: '🔍',
  meet: '🤝',
  drop: '📦',
}

function getEmoji(text: string): string {
  const lower = text.toLowerCase()
  for (const key in emojiMap) {
    if (lower.includes(key)) {
      return emojiMap[key]
    }
  }
  return '📍'
}

const PlanChip: React.FC<PlanChipProps> = ({ plan, highlight = false, onClick }) => {
  const emoji = getEmoji(plan)
  return (
    <Chip
      label={`${emoji} ${plan}`}
      onClick={onClick}
      clickable
      sx={{
        m: 0.5,
        fontWeight: highlight ? 'bold' : 'normal',
        bgcolor: highlight ? '#FEF3C7' : 'white',
        color: highlight ? '#4F46E5' : 'inherit',
        border: highlight ? '1px solid #4F46E5' : '1px solid #E5E7EB',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: highlight ? '#fde68a' : '#f9fafb',
        },
      }}
    />
  )
}

export default PlanChip
