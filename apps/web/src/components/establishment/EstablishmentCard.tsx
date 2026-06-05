import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  banner?: string | null;
  type: string;
  averageRating: number;
  city: string;
  country: string;
  isVerified?: boolean;
  isOpen?: boolean;
  followersCount?: number;
  reviewsCount?: number;
}

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  HOTEL: 'Hôtel',
  BAR: 'Bar',
  CAFE: 'Café',
  TOURIST_SPOT: 'Tourisme',
  EXPERIENCE: 'Expérience',
};

interface Props {
  establishment: Establishment;
}

export function EstablishmentCard({ establishment: est }: Props) {
  return (
    <Link href={`/establishment/${est.slug}`} className="group block">
      <article className="bg-card border border-border rounded-2xl overflow-hidden transition-shadow hover:shadow-card-hover">
        {/* 4:3 photo */}
        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
          {est.banner ? (
            <Image
              src={est.banner}
              alt={est.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-4xl font-heading font-bold text-primary/30">
                {est.name?.[0]}
              </span>
            </div>
          )}
          {/* Type badge pill — bottom-left */}
          <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/70 text-white text-xs font-medium">
            {TYPE_LABELS[est.type] ?? est.type}
          </span>
          {est.isVerified && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/90 text-white text-xs font-medium">
              ✓ Vérifié
            </span>
          )}
        </div>

        <div className="p-3 space-y-1">
          {/* Name — Outfit 700 15px */}
          <h3 className="font-heading font-bold text-[15px] leading-tight truncate">{est.name}</h3>

          {/* Stars — gold */}
          <div className="flex items-center gap-1">
            <Star size={13} className="fill-accent text-accent" />
            <span className="text-sm font-medium text-accent">
              {Number(est.averageRating).toFixed(1)}
            </span>
          </div>

          {/* City / status — DM Sans 12px muted */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
            <MapPin size={11} />
            <span className="truncate">{est.city}, {est.country}</span>
            {est.isOpen !== undefined && (
              <span className={cn('ml-auto flex-shrink-0', est.isOpen ? 'text-green-600' : 'text-red-500')}>
                {est.isOpen ? 'Ouvert' : 'Fermé'}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
