import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'EDP – Eat • Drink • Pose',
  description: 'Partagez vos expériences, réservez vos moments.',
  keywords: ['restaurant', 'hotel', 'bar', 'avis', 'réservation', 'réseau social'],
  openGraph: {
    title: 'EDP – Eat • Drink • Pose',
    description: 'Partagez vos expériences, réservez vos moments.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
