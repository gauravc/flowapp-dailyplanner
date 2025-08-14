import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals_css.css'
import { NextAuthProvider } from '@/components/NextAuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlowApp Daily Planner',
  description: 'A TeuxDeux-style daily planner with Franklin-Covey task rollover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}