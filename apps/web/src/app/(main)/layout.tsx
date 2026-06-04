import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-16 xl:ml-64 min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
