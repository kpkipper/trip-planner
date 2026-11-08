import { VerifyContent } from '@/sections/login'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logging in',
  robots: { index: false, follow: false },
  // The URL carries a one-time login token until the page strips it: never send it as a Referer.
  referrer: 'no-referrer',
}

export default function VerifyPage() {
  return <VerifyContent />
}
