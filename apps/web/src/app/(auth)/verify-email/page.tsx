'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { EdpLogo } from '@/components/ui/edp-logo';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    api
      .post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        setTimeout(() => router.replace('/feed'), 2000);
      })
      .catch(() => setStatus('error'));
  }, [token, router]);

  return (
    <div className="text-center">
      {status === 'loading' && (
        <p className="text-muted-foreground">Vérification en cours…</p>
      )}
      {status === 'success' && (
        <>
          <p className="font-semibold text-lg">Email vérifié !</p>
          <p className="text-muted-foreground text-sm mt-1">Redirection vers le feed…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-destructive font-semibold">Lien invalide ou expiré.</p>
          <Link href="/login" className="mt-4 block text-sm text-primary underline">
            Retour à la connexion
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <EdpLogo className="h-20 w-auto" />
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
