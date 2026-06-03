'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  CONFIRMED: 'bg-green-500/10 text-green-500 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  COMPLETED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
};

export default function ReservationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: () => api.get('/reservations/me').then((r) => r.data),
  });

  const { mutate: cancel } = useMutation({
    mutationFn: (id: string) => api.patch(`/reservations/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="max-w-screen-md mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-display font-bold">Mes réservations</h1>

      <div className="space-y-4">
        {data?.data?.map((res: any) => (
          <div key={res.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{res.establishment?.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin size={12} />
                  {res.establishment?.city}
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[res.status]}`}>
                {STATUS_LABELS[res.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {res.type === 'RESTAURANT' ? (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={14} className="text-primary" />
                    {res.details?.date} à {res.details?.time}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} className="text-primary" />
                    {res.details?.partySize} personnes
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={14} className="text-primary" />
                    {res.details?.checkIn} → {res.details?.checkOut}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} className="text-primary" />
                    {res.details?.adults} adultes
                  </div>
                </>
              )}
            </div>

            {res.loyaltyPointsEarned > 0 && (
              <p className="text-xs text-primary">+{res.loyaltyPointsEarned} points de fidélité</p>
            )}

            {res.status === 'PENDING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancel(res.id)}
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <XCircle size={14} />
                Annuler
              </Button>
            )}
          </div>
        ))}

        {data?.data?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Aucune réservation</p>
            <p className="text-sm mt-1">Explorez les établissements pour réserver</p>
            <Button className="mt-4" asChild>
              <a href="/explore">Explorer</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
