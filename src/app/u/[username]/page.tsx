import { SHELL_PARAM } from '@/lib/shell-param'
import { ProfileShell } from '@/sections/shell-pages'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
}

export function generateStaticParams(): Array<{ username: string }> {
  return [{ username: SHELL_PARAM }]
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <ProfileShell username={username} />
}
