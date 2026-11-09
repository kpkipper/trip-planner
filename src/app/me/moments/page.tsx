import MyMomentsContent from '@/sections/moments/my-moments-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My moments',
  robots: { index: false, follow: false },
}

export default function MyMomentsPage() {
  return <MyMomentsContent />
}
