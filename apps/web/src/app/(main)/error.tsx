'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[EDP] Route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <AlertTriangle size={48} className="text-destructive opacity-60" />
      <div className="space-y-1">
        <p className="font-heading font-bold text-lg text-foreground">Quelque chose s'est mal passé</p>
        <p className="text-sm text-muted-foreground">Une erreur inattendue s'est produite.</p>
      </div>
      <Button onClick={reset} variant="outline" className="rounded-xl">
        Réessayer
      </Button>
    </div>
  );
}
