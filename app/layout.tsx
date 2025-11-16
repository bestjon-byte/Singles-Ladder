import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tennis Singles Ladder',
  description: 'Tennis club singles ladder management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
