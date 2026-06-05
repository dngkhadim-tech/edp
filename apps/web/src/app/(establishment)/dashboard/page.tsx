'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Star, Users, BookOpen, MessageCircle, TrendingUp, Settings, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Reservation {
  id: string;
  status: string;
  type: string;
  user?: { firstName: string; lastName: string };
  details?: { date?: string; time?: string; partySize?: number; checkIn?: string; checkOut?: string };
}

interface Review {
  id: string;
  rating: number;
  content: string;
  establishmentResponse?: string;
  user?: { firstName: string; lastName: string };
}

export default function EstablishmentDashboard() {
  const { user } = useAuthStore();

  const { data: myEst } = useQuery({
    queryKey: ['my-establishment'],
    queryFn: () => api.get('/establishments/search?limit=1').then((r) => r.data.data?.[0]),
    enabled: !!user,
  });

  const { data: reservations } = useQuery({
    queryKey: ['est-reservations', myEst?.id],
    queryFn: () => api.get(`/reservations/establishment/${myEst.id}?limit=5`).then((r) => r.data),
    enabled: !!myEst?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['est-reviews', myEst?.id],
    queryFn: () => api.get(`/reviews/establishment/${myEst.id}?limit=5`).then((r) => r.data),
    enabled: !!myEst?.id,
  });

  const STATS = myEst ? [
    { label: 'Note moyenne', value: `${Number(myEst.averageRating).toFixed(1)} ⭐`, color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Star },
    { label: 'Avis', value: formatNumber(myEst.reviewsCount), color: 'text-blue-400', bg: 'bg-blue-400/10', icon: MessageCircle },
    { label: 'Abonnés', value: formatNumber(myEst.followersCount), color: 'text-primary', bg: 'bg-primary/10', icon: Users },
    { label: 'Réservations', value: formatNumber(reservations?.meta?.total || 0), color: 'text-green-400', bg: 'bg-green-400/10', icon: BookOpen },
  ] : [];

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-500',
    CONFIRMED: 'bg-green-500/10 text-green-500',
    CANCELLED: 'bg-red-500/10 text-red-500',
    COMPLETED: 'bg-blue-500/10 text-blue-500',
  };
  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'En attente', CONFIRMED: 'Confirmée', CANCELLED: 'Annulée', COMPLETED: 'Terminée',
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {myEst ? myEst.name : 'Chargement...'}
            {myEst?.isVerified && <span className="ml-2 text-primary text-sm">✓ Vérifié</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/post/new"><Plus size={16} /> Publier</Link>
          </Button>
          {myEst && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/establishment/${myEst.slug}`}><Eye size={16} /> Voir le profil</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {myEst && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card border border-border rounded-xl p-5">
                <div className={`inline-flex p-2.5 rounded-lg ${s.bg} mb-3`}>
                  <Icon size={18} className={s.color} />
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dernières réservations */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Réservations récentes</h2>
            <Link href="/reservations" className="text-sm text-primary hover:underline">Voir tout</Link>
          </div>
          {reservations?.data?.length > 0 ? (reservations.data as Reservation[]).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-sm">{r.user?.firstName} {r.user?.lastName}</p>
                <p className="text-xs text-muted-foreground">
                  {r.type === 'RESTAURANT'
                    ? `${r.details?.date} à ${r.details?.time} — ${r.details?.partySize} pers.`
                    : `${r.details?.checkIn} → ${r.details?.checkOut}`}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                {STATUS_LABELS[r.status]}
              </span>
            </div>
          )) : (
            <p className="text-muted-foreground text-sm text-center py-4">Aucune réservation</p>
          )}
        </div>

        {/* Derniers avis */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Avis récents</h2>
          </div>
          {reviews?.data?.length > 0 ? (reviews.data as Review[]).map((r) => (
            <div key={r.id} className="py-2 border-b border-border last:border-0 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{r.user?.firstName} {r.user?.lastName}</p>
                <div className="flex">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={12} className="fill-primary text-primary" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{r.content}</p>
              {!r.establishmentResponse && (
                <button className="text-xs text-primary hover:underline">Répondre</button>
              )}
            </div>
          )) : (
            <p className="text-muted-foreground text-sm text-center py-4">Aucun avis</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Modifier le profil', href: '/establishment/edit', icon: Settings },
            { label: 'Publier une photo', href: '/post/new', icon: Plus },
            { label: 'Voir les statistiques', href: '#', icon: TrendingUp },
            { label: 'Gérer les réservations', href: '/reservations', icon: BookOpen },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} href={a.href}
                className="flex flex-col items-center gap-2 p-4 bg-secondary rounded-xl hover:bg-muted transition-colors text-center">
                <Icon size={20} className="text-primary" />
                <span className="text-xs font-medium">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
