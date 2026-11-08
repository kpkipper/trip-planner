'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { joinByLink } from '@/api/members'
import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { useInvites } from '@/contexts/invites-context'
import { useToast } from '@/contexts/toast-context'
import { joinErrorMessage } from '@/lib/member-errors'
import { loginPath } from '@/lib/safe-next'

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
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-gray-800 mb-2">Could not join the trip</h1>
      <p className="text-gray-600 mb-6">{error}</p>
      <Link href="/" className="text-[#0163a4] hover:underline text-sm">
        Back to home
      </Link>
    </div>
  )
}
