import { Geist, Geist_Mono, Outfit } from 'next/font/google'

import ClientLayout from '@/components/client-layout'
import { ToastProvider } from '@/contexts/toast-context'
import { TripsProvider } from '@/contexts/trips-context'

import type { Metadata } from 'next'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['500', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Jourly Plan',
  description: 'Plan your adventures',
  icons: {
    icon: '/logo.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable}`}
    >
      <body className="antialiased" suppressHydrationWarning>
        <ToastProvider>
          <TripsProvider>
            <ClientLayout>{children}</ClientLayout>
          </TripsProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
