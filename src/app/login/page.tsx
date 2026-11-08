import { Suspense } from 'react'

import PageLoading from '@/components/page-loading'
import { LoginContent } from '@/sections/login'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to Jourly Plan with Google or an email link.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <LoginContent />
    </Suspense>
  )
}
