'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthTokens } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      router.replace('/login');
      return;
    }

    setAuthTokens(accessToken, refreshToken);
    fetchMe().then(() => router.replace('/feed'));
  }, []);

  return <Loader2 size={32} className="animate-spin text-primary" />;
}

export default function AuthCallbackPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Suspense fallback={<Loader2 size={32} className="animate-spin text-primary" />}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
