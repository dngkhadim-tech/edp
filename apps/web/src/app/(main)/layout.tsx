import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <EmailVerificationBanner />
        <Sidebar />
        <main className="md:ml-16 lg:ml-60 min-h-screen pb-20 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
