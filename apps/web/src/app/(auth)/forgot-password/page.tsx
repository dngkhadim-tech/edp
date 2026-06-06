'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { EdpLogo } from '@/components/ui/edp-logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.post('/auth/forgot-password', { email }).catch(() => {});
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <EdpLogo withTagline className="h-20 w-auto" />
      {sent ? (
        <div className="text-center">
          <p className="font-semibold text-lg">Email envoyé !</p>
          <p className="text-muted-foreground text-sm mt-2">
            Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.
          </p>
          <Link href="/login" className="mt-4 block text-sm text-primary underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-2xl font-heading font-bold text-center">Mot de passe oublié</h1>
          <input
            type="email"
            required
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
          <Link href="/login" className="text-sm text-center text-muted-foreground hover:text-foreground">
            Retour à la connexion
          </Link>
        </form>
      )}
    </div>
  );
}
