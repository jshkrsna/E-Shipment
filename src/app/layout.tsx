import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'E-Shipmennt · Lacak paket dengan bukti', template: '%s · E-Shipmennt' },
  description: 'Lacak paket dengan bukti, bukan sekadar status. Bukti serah terima, rute, dan pemeriksaan identitas paket terlihat sejak awal.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#14305B' }

// Semua halaman membaca sesi & database per permintaan.
export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
