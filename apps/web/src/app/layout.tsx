import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: 'VEYA',
  description: 'Partagez vos expériences, réservez vos moments.',
  keywords: ['restaurant', 'hotel', 'bar', 'avis', 'réservation', 'réseau social'],
  openGraph: {
    title: 'VEYA',
    description: 'Partagez vos expériences, réservez vos moments.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
