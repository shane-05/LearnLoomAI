import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LearnLoom AI — Your learning, your direction',
  description: 'Understand your strengths, explore careers and build a personal learning roadmap with LearnLoom AI.',
  applicationName: 'LearnLoom AI',
  generator: 'Next.js',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F8F5' },
    { media: '(prefers-color-scheme: dark)', color: '#17243A' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
