'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Image from 'next/image';
import { Star, MapPin, Phone, Globe, Clock, Users, Heart, Share2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewCard } from '@/components/establishment/ReviewCard';
import { ReservationForm } from '@/components/reservation/ReservationForm';
import { formatNumber } from '@/lib/utils';
import { useState } from 'react';
import { api as apiClient } from '@/lib/api';

export default function EstablishmentPage({ params }: { params: any }) {
  const { slug } = params as { slug: string };
  const [following, setFollowing] = useState(false);
  const [showReservation, setShowReservation] = useState(false);

  const { data: est, isLoading } = useQuery({
    queryKey: ['establishment', slug],
    queryFn: () => api.get(`/establishments/${slug}`).then((r) => {
      setFollowing(r.data.isFollowing);
      return r.data;
    }),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', est?.id],
    queryFn: () => api.get(`/reviews/establishment/${est.id}`).then((r) => r.data),
    enabled: !!est?.id,
  });

  const handleFollow = async () => {
    setFollowing(!following);
    if (following) {
      await apiClient.delete(`/follows/establishments/${est.id}`);
    } else {
      await apiClient.post(`/follows/establishments/${est.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-64 bg-secondary rounded-xl" />
        <div className="h-8 bg-secondary rounded w-1/3" />
        <div className="h-4 bg-secondary rounded w-1/4" />
      </div>
    );
  }

  if (!est) return null;

  return (
    <div className="max-w-screen-lg mx-auto">
      <div className="relative h-64 md:h-80 bg-muted">
        {est.banner ? (
          <Image src={est.banner} alt={est.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="px-4 md:px-8 -mt-16 relative z-10">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 rounded-xl border-4 border-background bg-card overflow-hidden">
              {est.logo && <Image src={est.logo} alt={est.name} width={96} height={96} className="object-cover" />}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-display font-bold text-white drop-shadow-lg">
                {est.name}
                {est.isVerified && <span className="ml-2 text-primary text-lg">✓</span>}
              </h1>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <MapPin size={14} />
                <span>{est.city}, {est.country}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            <Button variant="outline" size="sm" onClick={handleFollow} className={following ? 'bg-primary/10 border-primary' : ''}>
              <Heart size={16} className={following ? 'fill-primary text-primary' : ''} />
              {following ? 'Suivi' : 'Suivre'}
            </Button>
            <Button size="sm" onClick={() => setShowReservation(true)} className="gap-1.5">
              <BookOpen size={16} />
              Réserver
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-xl font-bold">
              <Star size={18} className="fill-primary text-primary" />
              {Number(est.averageRating).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{est.reviewsCount} avis</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{formatNumber(est.followersCount)}</div>
            <p className="text-xs text-muted-foreground mt-1">abonnés</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{est.type}</div>
            <p className="text-xs text-muted-foreground mt-1">catégorie</p>
          </div>
        </div>

        <Tabs defaultValue="about">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="about">À propos</TabsTrigger>
            <TabsTrigger value="reviews">Avis ({est.reviewsCount})</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            {est.menuItems?.length > 0 && <TabsTrigger value="menu">Menu</TabsTrigger>}
          </TabsList>

          <TabsContent value="about" className="mt-6 space-y-4">
            {est.description && (
              <p className="text-muted-foreground leading-relaxed">{est.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {est.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-primary" />
                  <a href={`tel:${est.phone}`} className="hover:underline">{est.phone}</a>
                </div>
              )}
              {est.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe size={16} className="text-primary" />
                  <a href={est.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{est.website}</a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-primary" />
                <span>{est.address}, {est.city}</span>
              </div>
            </div>

            {est.amenities?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                  {est.amenities.map((a: string) => (
                    <span key={a} className="px-3 py-1 bg-secondary rounded-full text-sm">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-4">
            {reviews?.data?.map((review: any) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {reviews?.data?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucun avis pour l'instant</p>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <div className="grid grid-cols-3 gap-2">
              {[est.banner, est.logo].filter(Boolean).map((url: string, i: number) => (
                <div key={i} className="aspect-square relative rounded-lg overflow-hidden">
                  <Image src={url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </TabsContent>

          {est.menuItems?.length > 0 && (
            <TabsContent value="menu" className="mt-6 space-y-4">
              {est.menuItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                  <span className="font-semibold text-primary">{item.price}€</span>
                </div>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {showReservation && (
        <ReservationForm
          establishment={est}
          onClose={() => setShowReservation(false)}
        />
      )}
    </div>
  );
}
