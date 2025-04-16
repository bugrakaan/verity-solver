import { JetBrains_Mono } from 'next/font/google'
import './globals.css';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export const metadata = {
  title: 'Verity Simulator',
  description: 'A simulator for the Verity puzzle game',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={jetbrainsMono.className} style={{ '--font-mono': jetbrainsMono.style.fontFamily }}>
        {children}
      </body>
    </html>
  );
}
