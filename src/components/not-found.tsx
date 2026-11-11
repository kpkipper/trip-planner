import { SearchX } from 'lucide-react'

import { StatusCard } from './ui/status-card'

interface NotFoundProps {
  message?: string
  description?: string
}

export default function NotFound({
  message = 'Trip not found',
  description = "The trip you're looking for doesn't exist or may have been removed.",
}: NotFoundProps) {
  return (
    <StatusCard icon={<SearchX size={26} strokeWidth={1.75} />} title={message} titleAs="h2">
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </StatusCard>
  )
}
