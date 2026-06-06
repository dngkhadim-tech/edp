'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    await api.post('/auth/resend-verification', { email: user.email }).catch(() => {});
    setSent(true);
  };

  return (
    <div className="sticky top-0 z-50 bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-center gap-3 text-sm text-rose-700">
      <span>Vérifie ton adresse email pour profiter de toutes les fonctionnalités.</span>
      {sent ? (
        <span className="font-medium">Email envoyé !</span>
      ) : (
        <button onClick={handleResend} className="font-medium underline hover:text-rose-900">
          Renvoyer
        </button>
      )}
    </div>
  );
}
