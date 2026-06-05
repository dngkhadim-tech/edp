'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, MapPin, Store } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AdminEstablishment {
  id: string;
  name: string;
  type: string;
  city: string;
  country: string;
  isVerified: boolean;
  createdAt: string;
  owner?: { firstName: string; lastName: string; email: string };
  reviewsCount: number;
  averageRating: number;
}

interface EstResult {
  data: AdminEstablishment[];
  meta: { total: number; page: number; totalPages: number };
}

const TYPE_LABEL: Record<string, string> = {
  RESTAURANT: 'Restaurant', BAR: 'Bar', HOTEL: 'Hôtel',
  CAFE: 'Café', TOURIST_SPOT: 'Lieu touristique', EXPERIENCE: 'Expérience',
};

export default function AdminEstablishmentsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unverified'>('unverified');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<EstResult>({
    queryKey: ['admin', 'establishments', page, filter],
    queryFn: () =>
      api.get('/establishments/search', {
        params: {
          page,
          limit: 20,
          ...(filter === 'unverified' ? { verified: false } : {}),
        },
      }).then((r) => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/establishments/${id}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'establishments'] });
      toast({ title: 'Établissement vérifié' });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  const establishments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Établissements</h1>
          <p className="text-sm text-muted-foreground mt-1">{meta?.total ?? '—'} établissements</p>
        </div>

        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          {(['unverified', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f === 'unverified' ? 'À vérifier' : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && establishments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card border border-border rounded-xl">
          <Store size={40} className="text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {filter === 'unverified' ? 'Aucun établissement en attente de vérification.' : 'Aucun établissement.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-20" />
            ))
          : establishments.map((est) => (
              <div key={est.id} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Store size={18} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{est.name}</p>
                    {est.isVerified && (
                      <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{TYPE_LABEL[est.type] ?? est.type}</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />{est.city}, {est.country}
                    </span>
                    {est.owner && (
                      <span>par {est.owner.firstName} {est.owner.lastName}</span>
                    )}
                    <span>{timeAgo(est.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge
                    variant="secondary"
                    className={cn(est.isVerified
                      ? 'bg-success/10 text-success border-0'
                      : 'bg-yellow-50 text-yellow-700 border-0',
                    )}
                  >
                    {est.isVerified ? 'Vérifié' : 'En attente'}
                  </Badge>

                  {!est.isVerified && (
                    <Button
                      size="sm"
                      onClick={() => verifyMutation.mutate(est.id)}
                      disabled={verifyMutation.isPending}
                    >
                      <CheckCircle2 size={14} className="mr-1.5" />
                      Vérifier
                    </Button>
                  )}
                </div>
              </div>
            ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {meta.page} / {meta.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              Précédent
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
