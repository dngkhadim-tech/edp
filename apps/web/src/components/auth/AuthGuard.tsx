'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, fetchMe } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('edp_access_token')
      : null;

    if (!token) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated) {
      setChecking(false);
      return;
    }

    fetchMe()
      .then(() => setChecking(false))
      .catch(() => router.replace('/login'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return <>{children}</>;
}
