'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined' && window.location.pathname !== '/callback') {
      router.replace('/feed');
    }
  }, [isAuthenticated, router]);

  return <>{children}</>;
}
