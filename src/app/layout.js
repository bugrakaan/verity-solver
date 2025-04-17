import './globals.css'
import { JetBrains_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export const metadata = {
  title: 'Verity Solver',
  description: 'A puzzle solver/simulator for the Verity encounter in Salvation\'s Edge raid',
  icons: {
    icon: '/salvation.png',
    apple: '/salvation.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/salvation.png" />
        <link rel="apple-touch-icon" href="/salvation.png" />
      </head>
      <body className={jetbrainsMono.className} style={{ '--font-mono': jetbrainsMono.style.fontFamily }}>
        {children}
      </body>
    </html>
  )
}
