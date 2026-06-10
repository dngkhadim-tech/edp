import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { EdpLogo } from '@/components/ui/edp-logo';
import Link from 'next/link';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <EmailVerificationBanner />
        <Sidebar />

        {/* Header mobile */}
        <header className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center justify-center px-4 h-12">
          <Link href="/feed" aria-label="VEYA" className="inline-flex items-center bg-foreground rounded-xl px-3 py-1.5">
            <EdpLogo className="h-5 w-auto invert" />
          </Link>
        </header>

        <main className="md:ml-16 lg:ml-60 min-h-screen pb-20 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
