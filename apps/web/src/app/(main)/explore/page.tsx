'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlaceCard } from '@/components/explore/PlaceCard';
import { FilterPills, type FilterOption } from '@/components/shared/FilterPills';
import { SearchBar } from '@/components/shared/SearchBar';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { SlidersHorizontal, MapPin, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EstablishmentCard, type Establishment } from '@/components/establishment/EstablishmentCard';

const FILTER_OPTIONS: FilterOption[] = [
  { value: '', label: 'Tout' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar' },
  { value: 'cafe', label: 'Café' },
  { value: 'lodging', label: 'Hôtel' },
  { value: 'tourist_attraction', label: 'À visiter' },
];

const RADIUS_M = 5000;
// Types searched in parallel when no filter is active
const ALL_TYPES = ['restaurant', 'bar', 'cafe', 'lodging'];

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lat: number; lng: number }
  | { status: 'denied' };

export default function ExplorePage() {
  const [type, setType] = useState('');
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const [places, setPlaces] = useState<google.maps.places.PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const { ready, loadError, nearbySearch } = useGooglePlaces();
  const handleTypeChange = useCallback((value: string) => setType(value), []);

  useEffect(() => {
    if (!navigator.geolocation) { setGeo({ status: 'denied' }); return; }
    setGeo({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ status: 'ready', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ status: 'denied' }),
      { timeout: 8000 },
    );
  }, []);

  // Stable lat/lng primitives for correct dep tracking
  const lat = geo.status === 'ready' ? geo.lat : null;
  const lng = geo.status === 'ready' ? geo.lng : null;

  useEffect(() => {
    if (!ready || lat === null || lng === null) return;
    setLoading(true);
    setError(false);
    const location = { lat, lng };
    const searches = type
      ? [nearbySearch({ location, radius: RADIUS_M, type: type as string })]
      : ALL_TYPES.map((t) => nearbySearch({ location, radius: RADIUS_M, type: t as string }));

    Promise.all(searches)
      .then((results) => {
        const seen = new Set<string>();
        const merged: google.maps.places.PlaceResult[] = [];
        for (const list of results) {
          for (const place of list) {
            if (place.place_id && !seen.has(place.place_id)) {
              seen.add(place.place_id);
              merged.push(place);
            }
          }
        }
        merged.sort((a, b) => {
          const rd = (b.rating ?? 0) - (a.rating ?? 0);
          return rd !== 0 ? rd : (b.user_ratings_total ?? 0) - (a.user_ratings_total ?? 0);
        });
        setPlaces(merged);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [ready, lat, lng, type]);

  // Fallback: EDP text search when geolocation denied
  const { data: edpFallback, isLoading: edpLoading } = useQuery({
    queryKey: ['establishments', 'search', searchQ, type],
    queryFn: () =>
      api
        .get<{ data: Establishment[] }>('/establishments/search', {
          params: { q: searchQ, type: type.toUpperCase() || undefined, limit: 20 },
        })
        .then((r) => r.data),
    enabled: geo.status === 'denied',
    staleTime: 2 * 60 * 1000,
  });

  const showGoogleResults = geo.status === 'ready';
  const showFallback = geo.status === 'denied';

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
        {/* Barre de recherche uniquement en fallback */}
        {showFallback && (
          <SearchBar
            placeholder="Rechercher restaurant, hôtel, ville…"
            onSearch={setSearchQ}
            debounceMs={300}
          />
        )}

        <FilterPills options={FILTER_OPTIONS} value={type} onChange={handleTypeChange} />

        {/* Géolocalisation en cours */}
        {(geo.status === 'idle' || geo.status === 'loading') && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-sans">Localisation en cours…</p>
          </div>
        )}

        {/* Erreur chargement Maps SDK */}
        {loadError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle size={40} className="text-destructive/50" />
            <p className="text-sm text-muted-foreground">Impossible de charger Google Maps</p>
          </div>
        )}

        {/* ── Résultats Google Places ── */}
        {showGoogleResults && (
          <>
            {(loading || !ready) && (
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
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <AlertCircle size={40} className="text-destructive/50" />
                <p className="text-sm text-muted-foreground">Impossible de charger les établissements</p>
              </div>
            )}
            {!loading && !error && ready && (
              places.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground font-sans">
                    {places.length} établissement{places.length > 1 ? 's' : ''} dans un rayon de 5 km
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {places.map((place) => (
                      <PlaceCard key={place.place_id} place={place} />
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
          </>
        )}

        {/* ── Fallback EDP (géoloc refusée) ── */}
        {showFallback && (
          <>
            {edpLoading && (
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
            {!edpLoading && (edpFallback?.data ?? []).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {(edpFallback!.data).map((est) => (
                  <EstablishmentCard key={est.id} establishment={est} />
                ))}
              </div>
            )}
            {!edpLoading && (edpFallback?.data ?? []).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <MapPin size={48} className="text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">Aucun établissement trouvé</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
