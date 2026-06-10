'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[VEYA/auth] Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <AlertTriangle size={40} className="text-destructive opacity-60" />
      <div className="space-y-1">
        <p className="font-heading font-bold text-lg">Une erreur s'est produite</p>
        <p className="text-sm text-muted-foreground">Impossible de charger cette page.</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline" size="sm" className="rounded-xl">Réessayer</Button>
        <Button asChild size="sm" className="rounded-xl"><Link href="/login">Connexion</Link></Button>
      </div>
    </div>
  );
}
