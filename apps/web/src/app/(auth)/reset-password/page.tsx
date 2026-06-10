'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { EdpLogo } from '@/components/ui/edp-logo';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      router.replace('/login?reset=success');
    } catch {
      setError('Lien invalide ou expiré.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
      <h1 className="text-2xl font-heading font-bold text-center">Nouveau mot de passe</h1>
      {error && <p className="text-destructive text-sm text-center">{error}</p>}
      <input
        type="password"
        required
        minLength={8}
        placeholder="Nouveau mot de passe (8 caractères min.)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="password"
        required
        placeholder="Confirmer le mot de passe"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <EdpLogo className="h-20 w-auto" />
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
