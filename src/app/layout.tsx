import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { TripsProvider } from '@/contexts/trips-context'
import { ToastProvider } from '@/contexts/toast-context'
import ClientLayout from '@/components/client-layout'

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
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
