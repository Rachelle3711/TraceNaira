import type { Metadata, Viewport } from 'next'
import { Space_Mono } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import { ThemeSync } from '@/components/ThemeSync'
import { THEME_SCRIPT } from '@/lib/themeScripts'
import './globals.css'
import { NavTracker } from '@/lib/navHistory'
import { PushSync } from '@/components/PushSync'

const mono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'TraceNaira',
  description: 'Follow every step. Own every transfer.',
  // On iPhone, "Add to Home Screen" opens it full screen with this name
  appleWebApp: { capable: true, title: 'TraceNaira', statusBarStyle: 'black-translucent' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#0F2A1E' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
<html lang="en" className={`${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Sets light or dark before the page shows, so there is no white flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" />
      </head>
      <body><div className="app"><ThemeSync /><NavTracker /><AuthProvider><PushSync />{children}</AuthProvider></div></body>
    </html>
  )
}