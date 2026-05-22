import { Geist, Geist_Mono } from 'next/font/google'

import ClientLayout from '@/components/client-layout'
import { ThemeProvider } from '@/contexts/theme-context'
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

export const metadata: Metadata = {
  title: 'Trip Planner',
  description: 'Plan your adventures',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <TripsProvider>
              <ClientLayout>{children}</ClientLayout>
            </TripsProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
