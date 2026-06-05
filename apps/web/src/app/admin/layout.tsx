import { AdminNav } from '@/components/layout/AdminNav';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex">
        <AdminNav />
        <main className="flex-1 ml-60 min-h-screen">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
