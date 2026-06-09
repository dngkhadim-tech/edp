'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlaceCard, type GooglePlace } from '@/components/explore/PlaceCard';
import { FilterPills, type FilterOption } from '@/components/shared/FilterPills';
import { SlidersHorizontal, MapPin, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FILTER_OPTIONS: FilterOption[] = [
  { value: '', label: 'Tout' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'BAR', label: 'Bar' },
  { value: 'CAFE', label: 'Café' },
  { value: 'HOTEL', label: 'Hôtel' },
  { value: 'TOURIST_SPOT', label: 'À visiter' },
];

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lat: number; lng: number }
  | { status: 'denied' };

export default function ExplorePage() {
  const [type, setType] = useState('');
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });

  useEffect(() => {
    if (!navigator.geolocation) { setGeo({ status: 'denied' }); return; }
    setGeo({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ status: 'ready', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ status: 'denied' }),
      { timeout: 8000 },
    );
  }, []);

  const handleTypeChange = useCallback((value: string) => setType(value), []);

  const { data, isLoading, isError } = useQuery<{ places: GooglePlace[] }>({
    queryKey: [
      'places-nearby',
      geo.status === 'ready' ? geo.lat : null,
      geo.status === 'ready' ? geo.lng : null,
      type,
    ],
    queryFn: () => {
      if (geo.status !== 'ready') return Promise.resolve({ places: [] });
      const params = new URLSearchParams({
        lat: String(geo.lat),
        lng: String(geo.lng),
        type,
        radius: '5000',
      });
      return fetch(`/api/places/nearby?${params}`).then((r) => r.json());
    },
    enabled: geo.status === 'ready',
    staleTime: 5 * 60 * 1000,
  });

  const places = data?.places ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-heading font-bold text-[18px]">À proximité</h1>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label="Filtres"
        >
          <SlidersHorizontal size={18} className="text-muted-foreground" />
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-screen-xl mx-auto w-full pb-8">
        <FilterPills options={FILTER_OPTIONS} value={type} onChange={handleTypeChange} />

        {/* Géolocalisation en cours */}
        {(geo.status === 'idle' || geo.status === 'loading') && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-sans">Localisation en cours…</p>
          </div>
        )}

        {/* Accès refusé */}
        {geo.status === 'denied' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <MapPin size={24} className="text-muted-foreground" />
            </div>
            <p className="font-heading font-bold text-foreground">Localisation requise</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Autorise l&apos;accès à ta position pour voir les restaurants à proximité.
            </p>
          </div>
        )}

        {/* Chargement */}
        {geo.status === 'ready' && isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-2xl w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Erreur */}
        {geo.status === 'ready' && isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle size={40} className="text-destructive/50" />
            <p className="text-sm text-muted-foreground">Impossible de charger les établissements</p>
          </div>
        )}

        {/* Résultats */}
        {geo.status === 'ready' && !isLoading && !isError && (
          places.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground font-sans">
                {places.length} établissement{places.length > 1 ? 's' : ''} dans un rayon de 5 km
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <MapPin size={48} className="opacity-30" />
              <p className="text-sm font-sans text-center">
                Aucun établissement trouvé dans un rayon de 5 km
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
