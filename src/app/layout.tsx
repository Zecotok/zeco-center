import type { Metadata } from 'next'
import './globals.css'
import Providers from "./Providers";
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ZecoCenter',
  description: 'Your center for meditation and mindfulness',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
