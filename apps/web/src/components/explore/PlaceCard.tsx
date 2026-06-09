import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  place: google.maps.places.PlaceResult;
}

const PRICE_ICONS = ['', '€', '€€', '€€€', '€€€€'];

export function PlaceCard({ place }: Props) {
  const photo = place.photos?.[0]?.getUrl({ maxWidth: 600 });
  const isOpen = place.opening_hours?.isOpen?.();
  const city = place.vicinity?.split(',').at(-1)?.trim() ?? '';
  const price = place.price_level != null ? PRICE_ICONS[place.price_level] : '';
  const type = place.types?.[0]?.replace(/_/g, ' ') ?? '';

  return (
    <Link href={`/place/${place.place_id}`} className="group block">
      <article className="bg-card border border-border rounded-2xl overflow-hidden hover:scale-[1.02] transition-all hover:shadow-card-hover">
        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={place.name}
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
          {type && (
            <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm capitalize">
              {type}
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
          <h3 className="font-heading font-bold text-[15px] leading-tight truncate">{place.name}</h3>

          <div className="flex items-center gap-1.5">
            {place.rating != null && (
              <>
                <Star size={13} className="fill-accent text-accent" />
                <span className="text-sm font-medium text-accent">{place.rating.toFixed(1)}</span>
                {place.user_ratings_total != null && (
                  <span className="text-xs text-muted-foreground">
                    ({place.user_ratings_total.toLocaleString('fr-FR')})
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
