'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { LinkIcon } from 'lucide-react'

import { joinByLink } from '@/api/members'
import PageLoading from '@/components/page-loading'
import { StatusCard } from '@/components/ui/status-card'
import { useAuth } from '@/contexts/auth-context'
import { useInvites } from '@/contexts/invites-context'
import { useToast } from '@/contexts/toast-context'
import { joinErrorMessage } from '@/lib/member-errors'
import { loginPath } from '@/lib/safe-next'
import { buttonClass } from '@/lib/ui-classes'

export default function JoinContent({ token }: { token: string }) {
  const router = useRouter()
  const { status } = useAuth()
  const { refresh } = useInvites()
  const { showToast } = useToast()
  const [error, setError] = useState<string | null>(null)
  // The link is single-use per page load: guard React strict-mode's double effect run.
  const started = useRef(false)

  useEffect(() => {
    if (status === 'anon') {
      // The token is already in this same-origin path, so it is fine in `next`.
      router.replace(loginPath(`/join/${encodeURIComponent(token)}`))
      return
    }
    if (status !== 'authed' || started.current) return
    started.current = true
    joinByLink(token)
      .then((slug) => {
        showToast('You joined the trip')
        void refresh()
        router.replace(`/plans/${encodeURIComponent(slug)}`)
      })
      .catch((err) => {
        const message = joinErrorMessage(err)
        setError(message)
        showToast(message, 'error')
      })
  }, [status, token, router, showToast, refresh])

  if (!error) return <PageLoading />

  return (
    <StatusCard icon={<LinkIcon size={26} strokeWidth={1.75} />} title="Could not join the trip">
      <p className="mt-2 mb-6 text-sm leading-relaxed text-muted">{error}</p>
      <Link href="/" className={buttonClass('secondary', 'md')}>
        Back to home
      </Link>
    </StatusCard>
  )
}
