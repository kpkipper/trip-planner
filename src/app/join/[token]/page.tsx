import { SHELL_PARAM } from '@/lib/shell-param'
import { JoinShell } from '@/sections/shell-pages'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join trip',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export function generateStaticParams(): Array<{ token: string }> {
  return [{ token: SHELL_PARAM }]
}

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <JoinShell token={token} />
}
