import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
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
  const isOpen =
    place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow;
  const city = place.formattedAddress?.split(',').at(-2)?.trim() ?? '';
  const price = place.priceLevel ? PRICE_LABELS[place.priceLevel] : '';

  return (
    <Link href={`/place/${place.id}`} className="group block">
      <article className="bg-card border border-border rounded-2xl overflow-hidden hover:scale-[1.02] transition-all hover:shadow-card-hover">
        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
          {place.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={place.photoUrl}
              alt={place.displayName.text}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-4xl font-heading font-bold text-primary/30">
                {place.displayName.text[0]}
              </span>
            </div>
          )}
          {place.primaryTypeDisplayName && (
            <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
              {place.primaryTypeDisplayName.text}
            </span>
          )}
          {isOpen !== undefined && (
            <span
              className={cn(
                'absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium',
                isOpen ? 'bg-success/90 text-white' : 'bg-black/50 text-white backdrop-blur-sm',
              )}
            >
              {isOpen ? 'Ouvert' : 'Fermé'}
            </span>
          )}
        </div>

        <div className="p-3 space-y-1">
          <h3 className="font-heading font-bold text-[15px] leading-tight truncate">
            {place.displayName.text}
          </h3>

          <div className="flex items-center gap-1.5">
            {place.rating != null && (
              <>
                <Star size={13} className="fill-accent text-accent" />
                <span className="text-sm font-medium text-accent">{place.rating.toFixed(1)}</span>
                {place.userRatingCount != null && (
                  <span className="text-xs text-muted-foreground">
                    ({place.userRatingCount.toLocaleString('fr-FR')} avis)
                  </span>
                )}
              </>
            )}
            {price && (
              <span className="ml-auto text-xs font-medium text-muted-foreground">{price}</span>
            )}
          </div>

          {city && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
              <MapPin size={11} />
              <span className="truncate">{city}</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
