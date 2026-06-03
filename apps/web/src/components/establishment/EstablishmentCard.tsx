import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
  establishment: any;
}

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  HOTEL: 'Hôtel',
  BAR: 'Bar',
  CAFE: 'Café',
  TOURIST_SPOT: 'Tourisme',
  EXPERIENCE: 'Expérience',
};

export function EstablishmentCard({ establishment: est }: Props) {
  return (
    <Link href={`/establishment/${est.slug}`} className="group block">
      <article className="bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/10">
        <div className="relative h-44 bg-muted overflow-hidden">
          {est.banner ? (
            <Image
              src={est.banner}
              alt={est.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-4xl font-display font-bold text-primary/30">{est.name?.[0]}</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-black/70 text-white border-none text-xs">
              {TYPE_LABELS[est.type] || est.type}
            </Badge>
          </div>
          {est.isVerified && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary/90 text-primary-foreground border-none text-xs">✓ Vérifié</Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold truncate">{est.name}</h3>
            <div className="flex items-center gap-1 text-sm flex-shrink-0 ml-2">
              <Star size={14} className="fill-primary text-primary" />
              <span className="font-medium">{Number(est.averageRating).toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span className="truncate">{est.city}, {est.country}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {formatNumber(est.followersCount)} abonnés
            </span>
            <span>{est.reviewsCount} avis</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
