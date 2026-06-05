'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Calendar, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border border-blue-200',
  NO_SHOW:   'bg-gray-50 text-gray-600 border border-gray-200',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW:   'Absent',
};

interface ReservationDetails {
  date?: string;
  time?: string;
  checkIn?: string;
  checkOut?: string;
  partySize?: number;
  adults?: number;
}

interface ReservationItem {
  id: string;
  status: string;
  type: string;
  details: ReservationDetails;
  establishment?: {
    name: string;
    category?: string;
    logo?: string;
  };
  loyaltyPointsEarned?: number;
}

function ReservationCard({
  res,
  onCancel,
}: {
  res: ReservationItem;
  onCancel: (id: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canCancel = res.status === 'PENDING' || res.status === 'CONFIRMED';

  const dateLabel =
    res.type === 'RESTAURANT'
      ? `${res.details.date} à ${res.details.time}`
      : `${res.details.checkIn} → ${res.details.checkOut}`;

  const guestsCount = res.type === 'RESTAURANT' ? res.details.partySize : res.details.adults;
  const guestsLabel = guestsCount != null
    ? `${guestsCount} ${res.type === 'RESTAURANT' ? 'personne' : 'adulte'}${guestsCount > 1 ? 's' : ''}`
    : null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {res.establishment?.logo ? (
            <img src={res.establishment.logo} alt="" className="h-12 w-12 object-cover" />
          ) : (
            <span className="text-lg font-heading font-bold text-muted-foreground">
              {res.establishment?.name?.[0] ?? '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{res.establishment?.name}</p>
          {res.establishment?.category && (
            <p className="text-xs text-muted-foreground">{res.establishment.category}</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[res.status] ?? ''}`}>
          {STATUS_LABEL[res.status] ?? res.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} className="text-primary" aria-hidden="true" />
          {dateLabel}
        </span>
        {guestsLabel && (
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-primary" aria-hidden="true" />
            {guestsLabel}
          </span>
        )}
      </div>

      {res.loyaltyPointsEarned != null && res.loyaltyPointsEarned > 0 && (
        <p className="text-xs text-primary tabular-nums">+{res.loyaltyPointsEarned} points de fidélité</p>
      )}

      <div className="flex gap-2">
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setDialogOpen(true)}
          >
            Annuler
          </Button>
        )}
        <Button variant="outline" size="sm">
          Détails
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              Voulez-vous annuler votre réservation chez{' '}
              <strong>{res.establishment?.name}</strong> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Retour</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onCancel(res.id);
                setDialogOpen(false);
              }}
            >
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const TAB_FILTER: Record<string, (status: string) => boolean> = {
  upcoming:  (s) => s === 'PENDING' || s === 'CONFIRMED',
  past:      (s) => s === 'COMPLETED' || s === 'NO_SHOW',
  cancelled: (s) => s === 'CANCELLED',
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

  const reservations: ReservationItem[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-heading font-bold">Mes réservations</h1>

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1">À venir</TabsTrigger>
          <TabsTrigger value="past" className="flex-1">Passées</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1">Annulées</TabsTrigger>
        </TabsList>

        {(['upcoming', 'past', 'cancelled'] as const).map((tab) => {
          const items = reservations.filter((r) => TAB_FILTER[tab](r.status));
          return (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Calendar size={48} className="mx-auto mb-4 opacity-20" aria-hidden="true" />
                  <p className="font-medium">Aucune réservation</p>
                  {tab === 'upcoming' && (
                    <>
                      <p className="text-sm mt-1">Explorez les établissements pour réserver</p>
                      <Button className="mt-4" asChild>
                        <a href="/explore">Explorer</a>
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                items.map((res) => (
                  <ReservationCard key={res.id} res={res} onCancel={cancel} />
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
