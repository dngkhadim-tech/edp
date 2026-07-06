'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlaceCard, type GooglePlace } from '@/components/explore/PlaceCard';
import { FilterPills, type FilterOption } from '@/components/shared/FilterPills';
import { SlidersHorizontal, MapPin, AlertCircle, LocateFixed, LocateOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FILTER_OPTIONS: FilterOption[] = [
  { value: '', label: 'Tout' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'BAR', label: 'Bar' },
  { value: 'CAFE', label: 'Café' },
  { value: 'HOTEL', label: 'Hôtel' },
  { value: 'TOURIST_SPOT', label: 'À visiter' },
];

export default function ExplorePage() {
  const [type, setType] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') activateLocation();
    });
  }, []);

  function activateLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationDenied(true);
      },
      { timeout: 8000 },
    );
  }

  function deactivateLocation() {
    setCoords(null);
  }

  const { data, isLoading, isError } = useQuery<{ places: GooglePlace[] }>({
    queryKey: ['places-nearby', coords?.lat, coords?.lng, type],
    queryFn: () => {
      const params = new URLSearchParams({
        lat: String(coords!.lat),
        lng: String(coords!.lng),
        type,
        radius: '5000',
      });
      return fetch(`/api/places/nearby?${params}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      });
    },
    enabled: coords !== null,
    staleTime: 5 * 60 * 1000,
  });

  const places = data?.places ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-heading font-bold text-[18px]">À découvrir</h1>
        <div className="flex items-center gap-2">
          {coords !== null ? (
            <button
              type="button"
              onClick={deactivateLocation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <LocateOff size={13} />
              Ma position
            </button>
          ) : (
            <button
              type="button"
              onClick={activateLocation}
              disabled={locating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <LocateFixed size={13} className={locating ? 'animate-pulse' : ''} />
              {locating ? 'Localisation…' : 'Autour de moi'}
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

        {!coords && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <MapPin size={48} className="opacity-30" />
            <div className="space-y-1">
              <p className="text-sm font-sans font-medium">
                Active ta position pour découvrir les lieux autour de toi
              </p>
              {locationDenied && (
                <p className="text-xs text-destructive">
                  Localisation refusée — autorise-la dans les réglages de ton navigateur
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={activateLocation}
              disabled={locating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <LocateFixed size={15} className={locating ? 'animate-pulse' : ''} />
              {locating ? 'Localisation…' : 'Activer ma position'}
            </button>
          </div>
        )}

        {coords && isLoading && (
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

        {coords && isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle size={40} className="text-destructive/50" />
            <p className="text-sm text-muted-foreground">Impossible de charger les établissements</p>
          </div>
        )}

        {coords && !isLoading && !isError && (
          places.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground font-sans">
                {places.length} établissement{places.length > 1 ? 's' : ''} • autour de vous
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
              <p className="text-sm font-sans text-center">Aucun établissement trouvé</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
