'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlaceCard, type GooglePlace } from '@/components/explore/PlaceCard';
import { FilterPills, type FilterOption } from '@/components/shared/FilterPills';
import { SlidersHorizontal, MapPin, AlertCircle, LocateFixed, LocateOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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

function requestLocation(onUpdate: (state: GeoState) => void) {
  if (!navigator.geolocation) { onUpdate({ status: 'denied' }); return; }
  onUpdate({ status: 'loading' });
  navigator.geolocation.getCurrentPosition(
    (pos) => onUpdate({ status: 'ready', lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => onUpdate({ status: 'denied' }),
    { timeout: 8000 },
  );
}

export default function ExplorePage() {
  const [type, setType] = useState('');
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });

  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') requestLocation(setGeo);
    });
  }, []);

  const lat = geo.status === 'ready' ? geo.lat : null;
  const lng = geo.status === 'ready' ? geo.lng : null;

  const { data, isLoading, isError } = useQuery<{ places: GooglePlace[] }>({
    queryKey: ['places-nearby', lat, lng, type],
    queryFn: () => {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        type,
        radius: '5000',
      });
      return fetch(`/api/places/nearby?${params}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      });
    },
    enabled: geo.status === 'ready',
    staleTime: 5 * 60 * 1000,
  });

  const places = data?.places ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-heading font-bold text-[18px]">À proximité</h1>
        <div className="flex items-center gap-2">
          {geo.status === 'ready' ? (
            <button
              type="button"
              onClick={() => setGeo({ status: 'idle' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <LocateOff size={13} />
              Désactiver
            </button>
          ) : (
            <button
              type="button"
              onClick={() => requestLocation(setGeo)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-muted transition-colors"
            >
              <LocateFixed size={13} />
              Ma position
            </button>
          )}
          <button
            type="button"
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Filtres"
          >
            <SlidersHorizontal size={18} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-screen-xl mx-auto w-full pb-8">
        <FilterPills options={FILTER_OPTIONS} value={type} onChange={setType} />

        {/* Géolocalisation en cours */}
        {geo.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-sans">Localisation en cours…</p>
          </div>
        )}

        {/* Accès refusé ou idle */}
        {(geo.status === 'idle' || geo.status === 'denied') && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <LocateFixed size={28} className="text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-heading font-bold text-foreground">Localisation requise</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {geo.status === 'denied'
                  ? 'L\'accès à ta position a été refusé. Autorise-le dans les réglages de ton navigateur, puis réessaie.'
                  : 'Active ta position pour voir les restaurants, bars et hôtels à 5 km autour de toi.'}
              </p>
            </div>
            <Button onClick={() => requestLocation(setGeo)} className="gap-2">
              <LocateFixed size={16} />
              Activer la localisation
            </Button>
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
