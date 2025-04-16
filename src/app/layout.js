import './globals.css';

export const metadata = {
  title: 'Verity Solver',
  description: 'A puzzle game with shapes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
