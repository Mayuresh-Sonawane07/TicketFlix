import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Navigation from '@/components/Navigation'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'TicketFlix — Book Movie & Event Tickets Online',
  description: 'Book tickets for movies, concerts, sports and theatre events online. Select seats, pay securely with Razorpay, and get instant QR-coded tickets. Best ticket booking platform in India.',
  keywords: 'ticket booking, movie tickets, event tickets, online booking, book tickets, concert tickets, sports tickets, TicketFlix',
  authors: [{ name: 'TicketFlix' }],
  creator: 'TicketFlix',
  metadataBase: new URL('https://ticketflix-ten.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TicketFlix — Book Movie & Event Tickets Online',
    description: 'Book tickets for movies, concerts, sports and theatre events online. Select seats, pay securely, get instant QR tickets.',
    url: 'https://ticketflix-ten.vercel.app',
    siteName: 'TicketFlix',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TicketFlix — Online Event Booking',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TicketFlix — Book Movie & Event Tickets Online',
    description: 'Book tickets for movies, concerts, sports and theatre events online.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased transition-colors duration-300">
        <ThemeProvider>
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}