import './globals.css'
import { Aboreto, Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

const heading = Aboreto({ subsets: ['latin'], weight: '400', variable: '--font-heading' })
const body = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata = {
  title: 'KUBO – Focus Space, On Demand',
  description: 'Private business booths. Calm, premium and on-demand workspaces across the city.',
  keywords: 'kubo, focus space, work booth, private workspace, prebook, pay as you go',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'KUBO – Focus Space, On Demand',
    description: 'Private business booths. Calm, premium and on-demand workspaces across the city.',
    url: 'https://boothnow.app',
    siteName: 'KUBO',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KUBO - Focus Space, On Demand',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KUBO – Focus Space, On Demand',
    description: 'Private business booths. Calm, premium and on-demand workspaces across the city.',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" className={`${heading.variable} ${body.variable}`}>
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}