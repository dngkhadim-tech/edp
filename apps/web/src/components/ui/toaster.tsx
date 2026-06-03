'use client';

import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-up',
            toast.variant === 'destructive'
              ? 'bg-destructive text-destructive-foreground border-destructive/50'
              : 'bg-card text-foreground border-border',
          )}
        >
          <div className="flex-1">
            {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
            {toast.description && <p className="text-sm opacity-80 mt-0.5">{toast.description}</p>}
          </div>
          <button onClick={() => dismiss(toast.id)} className="opacity-70 hover:opacity-100 mt-0.5">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
