'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star, MapPin, Clock, Navigation, Bookmark,
  ChevronLeft, MoreHorizontal, Check,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { HeroGallery } from '@/components/establishment/HeroGallery';
import { MenuAccordion } from '@/components/establishment/MenuAccordion';
import { ReviewCard } from '@/components/establishment/ReviewCard';
import { Button } from '@/components/ui/button';

const TABS = ['À propos', 'Menu', 'Avis', 'Photos'] as const;
type Tab = (typeof TABS)[number];

interface ReviewUser {
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface ReviewWithUser {
  id: string;
  rating: number;
  title?: string;
  content: string;
  isVerified?: boolean;
  createdAt: string | Date;
  user?: ReviewUser;
  establishmentResponse?: { content: string };
}

type EstablishmentPageProps = { params: { slug: string } };

export default function EstablishmentPage({ params }: EstablishmentPageProps) {
  const { slug } = params;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('À propos');
  const [scrolled, setScrolled] = useState(false);

  const { data: est, isLoading } = useQuery({
    queryKey: ['establishment', slug],
    queryFn: () => api.get(`/establishments/${slug}`).then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', est?.id],
    queryFn: () => api.get(`/reviews/establishment/${est.id}?limit=3`).then((r) => r.data),
    enabled: !!est?.id,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 pb-24">
        <div className="w-full bg-muted" style={{ aspectRatio: '16/9' }} />
        <div className="px-4 space-y-3">
          <div className="h-7 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!est) return null;

  const isOpen = est.isOpen ?? false;
  const images: string[] = [est.banner, ...(est.gallery ?? [])].filter(Boolean);
  const menuSections = est.menu ?? [];
  const avgRating: number = est.avgRating ?? est.averageRating ?? 0;
  const reviewsCount: number = est.reviewsCount ?? reviews?.meta?.total ?? 0;

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header adaptatif */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 transition-all duration-200',
          'md:left-16 lg:left-60',
          scrolled
            ? 'bg-background/95 backdrop-blur-sm border-b border-border h-14 shadow-card'
            : 'bg-transparent h-14',
        )}
      >
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
            scrolled ? 'text-foreground hover:bg-muted' : 'bg-black/40 text-white',
          )}
        >
          <ChevronLeft size={20} />
        </button>

        {scrolled && (
          <span className="font-heading font-bold text-sm text-foreground truncate max-w-[200px]">
            {est.name}
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            aria-label="Sauvegarder"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              scrolled ? 'text-muted-foreground hover:bg-muted' : 'bg-black/40 text-white',
            )}
          >
            <Bookmark size={18} />
          </button>
          <button
            aria-label="Plus d'options"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              scrolled ? 'text-muted-foreground hover:bg-muted' : 'bg-black/40 text-white',
            )}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* Galerie hero */}
      <div className="mt-0">
        <HeroGallery images={images} name={est.name} totalCount={est.photosCount} />
      </div>

      {/* Bloc identité */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        <h1 className="font-heading font-extrabold text-2xl text-foreground leading-tight">{est.name}</h1>

        {/* Note + distance */}
        <div className="flex items-center gap-3 flex-wrap">
          {avgRating > 0 && (
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  className={s <= Math.round(avgRating) ? 'fill-accent text-accent' : 'text-border'}
                />
              ))}
              <span className="font-heading font-bold text-sm text-foreground ml-1">
                {avgRating.toFixed(1)}
              </span>
              {reviewsCount > 0 && (
                <span className="text-xs text-muted-foreground">({formatNumber(reviewsCount)} avis)</span>
              )}
            </div>
          )}
          {est.city && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              {est.city}
            </span>
          )}
        </div>

        {/* Catégorie + statut ouverture */}
        <div className="flex items-center gap-3 flex-wrap">
          {est.type && (
            <span className="text-sm text-muted-foreground capitalize">{est.type}</span>
          )}
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'inline-flex items-center gap-1 text-sm font-sans font-medium',
              isOpen ? 'text-success' : 'text-destructive',
            )}>
              {isOpen ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  Ouvert{est.closingTime ? ` · Ferme à ${est.closingTime}` : ''}
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Fermé{est.openingTime ? ` · Ouvre à ${est.openingTime}` : ''}
                </>
              )}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3 pt-1">
          <Button
            className="flex-1 font-heading font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl"
          >
            Réserver
          </Button>
          <Button
            variant="outline"
            className="flex-1 font-heading font-semibold border-border text-foreground h-12 rounded-xl"
            asChild
          >
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(est.name + ' ' + (est.city ?? ''))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation size={16} className="mr-1.5" />
              Itinéraire
            </a>
          </Button>
        </div>
      </div>

      {/* Tabs sticky */}
      <div
        role="tablist"
        aria-label="Sections de l'établissement"
        className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border flex overflow-x-auto scrollbar-none"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-shrink-0 px-5 py-3 text-sm font-heading font-semibold transition-colors border-b-2',
              tab === t
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Contenu tabs */}
      <div className="pt-4">
        {tab === 'À propos' && (
          <div className="px-4 space-y-4">
            {est.description && (
              <p className="text-sm text-foreground leading-relaxed">{est.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {est.openingHours && (
                <div className="flex items-center gap-1.5 bg-secondary px-3 py-2 rounded-xl text-sm text-foreground">
                  <Clock size={14} className="text-muted-foreground" />
                  {est.openingHours}
                </div>
              )}
              {est.wifi && (
                <div className="flex items-center gap-1.5 bg-secondary px-3 py-2 rounded-xl text-sm text-foreground">
                  <Check size={13} className="text-success" />
                  Wifi
                </div>
              )}
              {est.parking && (
                <div className="flex items-center gap-1.5 bg-secondary px-3 py-2 rounded-xl text-sm text-foreground">
                  <Check size={13} className="text-success" />
                  Parking
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Menu' && (
          <MenuAccordion sections={menuSections} />
        )}

        {tab === 'Avis' && (
          <div className="px-4 space-y-3">
            {reviews?.data?.map((r: ReviewWithUser) => (
              <ReviewCard key={r.id} review={r} />
            ))}
            {reviewsCount > 3 && (
              <Link
                href={`/establishment/${slug}/reviews`}
                className="block text-center text-sm font-heading font-semibold text-primary py-2"
              >
                Voir les {formatNumber(reviewsCount)} avis →
              </Link>
            )}
          </div>
        )}

        {tab === 'Photos' && (
          <div className="grid grid-cols-3 gap-0.5">
            {images.map((img, i) => (
              <div key={i} className="relative bg-muted" style={{ aspectRatio: '1' }}>
                <img src={img} alt={`${est.name} photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
