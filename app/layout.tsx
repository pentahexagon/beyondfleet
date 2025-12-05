import type { Metadata } from 'next'
import { Inter, Space_Grotesk, Comic_Neue, Gaegu } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Web3Provider from '@/components/providers/Web3Provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const comicNeue = Comic_Neue({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-comic',
})

const gaegu = Gaegu({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-gaegu',
})

export const metadata: Metadata = {
  title: 'BeyondFleet - 암호화폐 커뮤니티 플랫폼',
  description: 'Beyond The Stars - 함께 가면 멀리 간다. 실시간 시세, 교육, 멤버십, 기부 투표까지.',
  keywords: ['암호화폐', '비트코인', '이더리움', '커뮤니티', 'NFT', '멤버십'],
  authors: [{ name: 'BeyondFleet Team' }],
  openGraph: {
    title: 'BeyondFleet - 암호화폐 커뮤니티 플랫폼',
    description: 'Beyond The Stars - 함께 가면 멀리 간다',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${spaceGrotesk.variable} ${comicNeue.variable} ${gaegu.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <Web3Provider>
          <Header />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  )
}
