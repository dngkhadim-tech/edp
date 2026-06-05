import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default function EstablishmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-16 lg:ml-60 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
