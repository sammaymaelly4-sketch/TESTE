import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bar da Carmen',
  description: 'A cerveja mais gelada da Vila',
  manifest: '/manifest.json',
  themeColor: '#0D2240',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif' } }}
        />
      </body>
    </html>
  )
}
