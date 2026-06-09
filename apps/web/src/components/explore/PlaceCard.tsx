import Link from 'next/link';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GooglePlace {
  id: string;
  displayName: { text: string; languageCode?: string };
  photoUrl?: string | null;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text: string };
  currentOpeningHours?: { openNow: boolean };
  regularOpeningHours?: { openNow: boolean };
  formattedAddress?: string;
  priceLevel?: string;
}

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: '',
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
};

interface Props {
  place: GooglePlace;
}

export function PlaceCard({ place }: Props) {
  const isOpen = place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow;
  const price = place.priceLevel ? PRICE_LABELS[place.priceLevel] : '';

  return (
    <Link href={`/place/${place.id}`} className="group block">
      <article className="relative rounded-3xl overflow-hidden aspect-[3/4] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
        {/* Photo */}
        {place.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.photoUrl}
            alt={place.displayName.text}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background flex items-center justify-center">
            <span className="text-5xl font-heading font-bold text-primary/20">
              {place.displayName.text[0]}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Open/closed badge */}
        {isOpen !== undefined && (
          <div className="absolute top-3 right-3">
            <span className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
              isOpen
                ? 'bg-emerald-500 text-white'
                : 'bg-white/15 backdrop-blur-md text-white border border-white/20',
            )}>
              {isOpen ? 'Ouvert' : 'Fermé'}
            </span>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          <h3 className="font-heading font-bold text-white text-sm leading-tight line-clamp-2">
            {place.displayName.text}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {place.primaryTypeDisplayName && (
                <span className="text-[10px] text-white/70 font-medium">
                  {place.primaryTypeDisplayName.text}
                </span>
              )}
              {price && (
                <span className="text-[10px] text-white/50 ml-1">{price}</span>
              )}
            </div>

            {place.rating != null && (
              <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-semibold text-white">{place.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
