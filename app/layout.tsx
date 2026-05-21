import type { Metadata } from 'next';
import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'), // ✅ FIX

  title: "AI Cost Audit — Find where you're overpaying for AI tools",
  description:
    'Free instant audit of your AI tool spend. Find overspending, get downgrade recommendations, and see total potential savings in seconds.',

  openGraph: {
    title: 'AI Cost Audit — Stop overpaying for AI tools',
    description: 'Free instant AI spend audit. See exactly where your money is going.',
    type: 'website',
    images: ['/og-image.svg'],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'AI Cost Audit — Stop overpaying for AI tools',
    description: 'Free instant AI spend audit. Find overspending, get recommendations.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`}>
      <body className="bg-[#0a0a0f] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
