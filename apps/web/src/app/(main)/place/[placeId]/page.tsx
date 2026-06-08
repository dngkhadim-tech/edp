'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Star, MapPin, Clock, Navigation, ChevronLeft,
  Globe, Phone, Sparkles, MessageSquare, Image as ImageIcon,
  Video, Gift, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { ReviewCard } from '@/components/establishment/ReviewCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const TABS = ['Google', 'EDP'] as const;
type Tab = (typeof TABS)[number];

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
};

interface GoogleReview {
  name: string;
  rating: number;
  relativePublishTimeDescription: string;
  text?: { text: string };
  authorAttribution?: { displayName: string; photoUri?: string };
}

interface PlaceDetail {
  id: string;
  displayName: { text: string };
  rating?: number;
  userRatingCount?: number;
  editorialSummary?: { text: string };
  generativeSummary?: { overview?: { text: string } };
  reviews?: GoogleReview[];
  photos?: Array<{ name: string; url: string }>;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  currentOpeningHours?: { openNow?: boolean };
  formattedAddress?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  priceLevel?: string;
  primaryTypeDisplayName?: { text: string };
  location?: { latitude: number; longitude: number };
}

interface EdpEstablishment {
  id: string;
  slug: string;
  name: string;
  avgRating?: number;
  averageRating?: number;
  reviewsCount?: number;
  gallery?: string[];
}

export default function PlacePage() {
  const { placeId } = useParams<{ placeId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Google');
  const [hoursExpanded, setHoursExpanded] = useState(false);

  const { data: place, isLoading } = useQuery<PlaceDetail>({
    queryKey: ['place', placeId],
    queryFn: () => fetch(`/api/places/${placeId}`).then((r) => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  // Cherche un établissement EDP correspondant par nom
  const { data: edpMatch } = useQuery<{ data: EdpEstablishment[] }>({
    queryKey: ['edp-establishment-match', place?.displayName?.text],
    queryFn: () =>
      api
        .get('/establishments/search', {
          params: { q: place!.displayName.text, limit: 1 },
        })
        .then((r) => r.data),
    enabled: !!place?.displayName?.text,
    staleTime: 5 * 60 * 1000,
  });

  const edpEst = edpMatch?.data?.[0];

  const { data: edpReviews } = useQuery({
    queryKey: ['edp-reviews', edpEst?.id],
    queryFn: () =>
      api.get(`/reviews/establishment/${edpEst!.id}?limit=5`).then((r) => r.data),
    enabled: !!edpEst?.id,
  });

  const { data: edpPosts } = useQuery({
    queryKey: ['edp-posts', edpEst?.id],
    queryFn: () =>
      api
        .get('/posts', { params: { establishmentId: edpEst!.id, limit: 9 } })
        .then((r) => r.data),
    enabled: !!edpEst?.id,
  });

  const { data: edpReels } = useQuery({
    queryKey: ['edp-reels', edpEst?.id],
    queryFn: () =>
      api
        .get('/reels', { params: { establishmentId: edpEst!.id, limit: 6 } })
        .then((r) => r.data),
    enabled: !!edpEst?.id,
  });

  if (isLoading || !place) {
    return (
      <div className="animate-pulse space-y-4 pb-24">
        <Skeleton className="w-full h-64" />
        <div className="px-4 space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  const isOpen = place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow;
  const heroPhoto = place.photos?.[0]?.url;
  const aiSummary =
    place.generativeSummary?.overview?.text ?? place.editorialSummary?.text;
  const price = place.priceLevel ? PRICE_LABELS[place.priceLevel] : '';
  const mapsUrl = place.location
    ? `https://www.google.com/maps/search/?api=1&query=${place.location.latitude},${place.location.longitude}&query_place_id=${place.id}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName.text)}`;

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 md:left-16 lg:left-60">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white"
        >
          <ChevronLeft size={20} />
        </button>
      </header>

      {/* Photo hero */}
      <div className="w-full bg-muted" style={{ aspectRatio: '16/9', maxHeight: '300px', overflow: 'hidden' }}>
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPhoto} alt={place.displayName.text} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-6xl font-heading font-bold text-primary/20">{place.displayName.text[0]}</span>
          </div>
        )}
      </div>

      {/* Identité */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-heading font-extrabold text-2xl text-foreground leading-tight flex-1">
            {place.displayName.text}
          </h1>
          {price && (
            <span className="text-sm font-medium text-muted-foreground mt-1">{price}</span>
          )}
        </div>

        {/* Type + statut */}
        <div className="flex items-center gap-3 flex-wrap">
          {place.primaryTypeDisplayName && (
            <span className="text-sm text-muted-foreground">{place.primaryTypeDisplayName.text}</span>
          )}
          {isOpen !== undefined && (
            <span className={cn(
              'flex items-center gap-1.5 text-sm font-medium',
              isOpen ? 'text-success' : 'text-destructive',
            )}>
              {isOpen ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  Ouvert
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Fermé
                </>
              )}
            </span>
          )}
        </div>

        {/* Note Google */}
        {place.rating != null && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  className={s <= Math.round(place.rating!) ? 'fill-accent text-accent' : 'text-border'}
                />
              ))}
            </div>
            <span className="font-heading font-bold text-sm">{place.rating.toFixed(1)}</span>
            {place.userRatingCount != null && (
              <span className="text-xs text-muted-foreground">
                ({place.userRatingCount.toLocaleString('fr-FR')} avis Google)
              </span>
            )}
          </div>
        )}

        {/* Adresse */}
        {place.formattedAddress && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={11} />
            <span>{place.formattedAddress}</span>
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3 pt-1">
          <Button className="flex-1 font-heading font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl">
            Réserver
          </Button>
          <Button variant="outline" className="flex-1 font-heading font-semibold border-border text-foreground h-12 rounded-xl" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation size={16} className="mr-1.5" />
              Itinéraire
            </a>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border flex"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 px-5 py-3 text-sm font-heading font-semibold transition-colors border-b-2',
              tab === t
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="pt-4">
        {/* ── ONGLET GOOGLE ── */}
        {tab === 'Google' && (
          <div className="px-4 space-y-6">
            {/* Note globale */}
            {place.rating != null && (
              <div className="bg-secondary rounded-2xl p-4 flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="font-heading font-extrabold text-4xl text-foreground">
                    {place.rating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={s <= Math.round(place.rating!) ? 'fill-accent text-accent' : 'text-border'}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1 border-l border-border pl-4">
                  <p className="font-heading font-bold text-foreground">
                    {place.userRatingCount?.toLocaleString('fr-FR')} avis
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">sur Google Maps</p>
                  {place.websiteUri && (
                    <a
                      href={place.websiteUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary mt-2"
                    >
                      <Globe size={11} />
                      Site web
                      <ExternalLink size={10} />
                    </a>
                  )}
                  {place.internationalPhoneNumber && (
                    <a
                      href={`tel:${place.internationalPhoneNumber}`}
                      className="flex items-center gap-1 text-xs text-primary mt-1"
                    >
                      <Phone size={11} />
                      {place.internationalPhoneNumber}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Résumé IA */}
            {aiSummary && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-primary" />
                  <h2 className="font-heading font-bold text-sm text-foreground">Résumé IA</h2>
                </div>
                <p className="text-sm text-foreground leading-relaxed bg-secondary rounded-2xl p-4">
                  {aiSummary}
                </p>
              </div>
            )}

            {/* Horaires */}
            {place.regularOpeningHours?.weekdayDescriptions && (
              <div className="space-y-2">
                <button
                  onClick={() => setHoursExpanded((v) => !v)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <Clock size={15} className="text-muted-foreground" />
                  <h2 className="font-heading font-bold text-sm text-foreground">Horaires</h2>
                  <span className="ml-auto text-xs text-primary">
                    {hoursExpanded ? 'Masquer' : 'Voir tout'}
                  </span>
                </button>
                {hoursExpanded && (
                  <div className="bg-secondary rounded-2xl p-4 space-y-1">
                    {place.regularOpeningHours.weekdayDescriptions.map((line, i) => (
                      <p key={i} className="text-sm text-foreground font-sans">{line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Avis Google */}
            {(place.reviews ?? []).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} className="text-muted-foreground" />
                  <h2 className="font-heading font-bold text-sm text-foreground">Avis récents</h2>
                </div>
                {(place.reviews ?? []).slice(0, 3).map((review) => (
                  <div key={review.name} className="bg-secondary rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {review.authorAttribution?.photoUri ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.authorAttribution.photoUri}
                          alt={review.authorAttribution.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-bold text-muted-foreground">
                            {review.authorAttribution?.displayName?.[0] ?? '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-heading font-semibold text-sm text-foreground">
                          {review.authorAttribution?.displayName}
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={10}
                              className={s <= review.rating ? 'fill-accent text-accent' : 'text-border'}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">
                            {review.relativePublishTimeDescription}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.text?.text && (
                      <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                        {review.text.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Galerie photos Google */}
            {(place.photos ?? []).length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon size={15} className="text-muted-foreground" />
                  <h2 className="font-heading font-bold text-sm text-foreground">Photos</h2>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(place.photos ?? []).slice(1, 10).map((photo, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={photo.url}
                      alt={`${place.displayName.text} photo ${i + 2}`}
                      className="aspect-square w-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET EDP ── */}
        {tab === 'EDP' && (
          <div className="px-4 space-y-6">
            {/* Avis EDP */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-primary" />
                <h2 className="font-heading font-bold text-sm text-foreground">Avis EDP</h2>
                {edpEst?.reviewsCount != null && edpEst.reviewsCount > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {edpEst.reviewsCount} avis
                  </span>
                )}
              </div>

              {edpEst && edpReviews?.data?.length > 0 ? (
                edpReviews.data.map((r: Parameters<typeof ReviewCard>[0]['review']) => (
                  <ReviewCard key={r.id} review={r} />
                ))
              ) : (
                <div className="bg-secondary rounded-2xl p-6 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Aucun avis EDP pour le moment.
                  </p>
                  <p className="text-xs text-muted-foreground">Sois le premier à donner ton avis !</p>
                </div>
              )}
            </div>

            {/* Photos EDP */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon size={15} className="text-primary" />
                <h2 className="font-heading font-bold text-sm text-foreground">Photos EDP</h2>
              </div>

              {edpPosts?.data?.filter((p: { type: string; media?: Array<{ url: string; type: string }> }) => p.type === 'PHOTO' && p.media?.[0]).length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {edpPosts.data
                    .filter((p: { type: string; media?: Array<{ url: string; type: string }> }) => p.type === 'PHOTO' && p.media?.[0])
                    .slice(0, 9)
                    .map((p: { id: string; media: Array<{ url: string }> }) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={p.media[0].url}
                        alt=""
                        className="aspect-square w-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    ))}
                </div>
              ) : (
                <div className="bg-secondary rounded-2xl p-6 text-center">
                  <p className="text-sm text-muted-foreground">Aucune photo EDP pour le moment.</p>
                </div>
              )}
            </div>

            {/* Vidéos EDP */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Video size={15} className="text-primary" />
                <h2 className="font-heading font-bold text-sm text-foreground">Vidéos EDP</h2>
              </div>

              {edpReels?.data?.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {edpReels.data.slice(0, 6).map((r: { id: string; thumbnail?: string; title?: string }) => (
                    <div key={r.id} className="relative aspect-[9/16] bg-muted rounded-lg overflow-hidden">
                      {r.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video size={20} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-secondary rounded-2xl p-6 text-center">
                  <p className="text-sm text-muted-foreground">Aucune vidéo EDP pour le moment.</p>
                </div>
              )}
            </div>

            {/* Récompenses fidélité */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Gift size={15} className="text-primary" />
                <h2 className="font-heading font-bold text-sm text-foreground">Récompenses fidélité</h2>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 space-y-3 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Gift size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-foreground">Programme EDP</p>
                    <p className="text-xs text-muted-foreground">Gagne des points en visitant cet établissement</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Check-in', pts: '+10 pts' },
                    { label: 'Avis', pts: '+25 pts' },
                    { label: 'Photo', pts: '+15 pts' },
                    { label: 'Réservation', pts: '+50 pts' },
                  ].map(({ label, pts }) => (
                    <div key={label} className="bg-background/60 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-xs font-sans text-foreground">{label}</span>
                      <span className="text-xs font-heading font-bold text-primary">{pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
