import { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  place: google.maps.places.PlaceResult;
}

const PRICE_ICONS = ['', '€', '€€', '€€€', '€€€€'];

const TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  bar: 'Bar',
  cafe: 'Café',
  lodging: 'Hôtel',
  tourist_attraction: 'À visiter',
  food: 'Restauration',
  establishment: 'Établissement',
};

function formatReviews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')} k avis`;
  return `${n.toLocaleString('fr-FR')} avis`;
}

export function PlaceCard({ place }: Props) {
  const photos = place.photos ?? [];
  const [photoIdx, setPhotoIdx] = useState(0);

  const photo = photos[photoIdx]?.getUrl({ maxWidth: 600 });
  const isOpen = place.opening_hours?.isOpen?.();
  const city = place.vicinity?.split(',').at(-1)?.trim() ?? '';
  const price = place.price_level != null ? PRICE_ICONS[place.price_level] : '';

  const typeKey = place.types?.find((t) => TYPE_LABELS[t]) ?? place.types?.[0] ?? '';
  const typeLabel = TYPE_LABELS[typeKey] ?? typeKey.replace(/_/g, ' ');

  function prev(e: React.MouseEvent) {
    e.preventDefault();
    setPhotoIdx((i) => (i - 1 + photos.length) % photos.length);
  }
  function next(e: React.MouseEvent) {
    e.preventDefault();
    setPhotoIdx((i) => (i + 1) % photos.length);
  }

  return (
    <Link href={`/place/${place.place_id}`} className="group block">
      <article className="bg-card border border-border rounded-2xl overflow-hidden hover:scale-[1.02] transition-all hover:shadow-card-hover">
        {/* Photo */}
        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={place.name ?? ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-4xl font-heading font-bold text-primary/30">
                {place.name?.[0]}
              </span>
            </div>
          )}

          {/* Navigation photos si plusieurs */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Photo précédente"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={next}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Photo suivante"
              >
                <ChevronRight size={14} />
              </button>
              {/* Indicateurs dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.slice(0, 5).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-1 h-1 rounded-full transition-colors',
                      i === photoIdx ? 'bg-white' : 'bg-white/40',
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badge type */}
          {typeLabel && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[11px] font-medium backdrop-blur-sm capitalize">
              {typeLabel}
            </span>
          )}

          {/* Badge ouvert/fermé */}
          {isOpen !== undefined && (
            <span
              className={cn(
                'absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                isOpen ? 'bg-emerald-500/90 text-white' : 'bg-black/50 text-white backdrop-blur-sm',
              )}
            >
              <Clock size={9} />
              {isOpen ? 'Ouvert' : 'Fermé'}
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="p-3 space-y-1.5">
          <h3 className="font-heading font-bold text-[14px] leading-tight line-clamp-2">
            {place.name}
          </h3>

          {/* Note + avis */}
          {place.rating != null && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    className={cn(
                      s <= Math.round(place.rating!) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted',
                    )}
                  />
                ))}
              </div>
              <span className="text-[12px] font-semibold text-foreground">
                {place.rating.toFixed(1)}
              </span>
              {place.user_ratings_total != null && (
                <span className="text-[11px] text-muted-foreground">
                  · {formatReviews(place.user_ratings_total)}
                </span>
              )}
            </div>
          )}

          {/* Adresse + prix */}
          <div className="flex items-center justify-between gap-1">
            {city && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-sans min-w-0">
                <MapPin size={10} className="shrink-0" />
                <span className="truncate">{city}</span>
              </div>
            )}
            {price && (
              <span className="text-[11px] font-medium text-muted-foreground shrink-0">{price}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
