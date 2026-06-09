'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PlaceCard } from '@/components/explore/PlaceCard';
import { FilterPills, type FilterOption } from '@/components/shared/FilterPills';
import { SearchBar } from '@/components/shared/SearchBar';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { SlidersHorizontal, MapPin, AlertCircle, LocateFixed } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FILTER_OPTIONS: FilterOption[] = [
  { value: '', label: 'Tout' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar' },
  { value: 'cafe', label: 'Café' },
  { value: 'lodging', label: 'Hôtel' },
  { value: 'tourist_attraction', label: 'À visiter' },
];

const RADIUS_M = 5000;
const ALL_TYPES = ['restaurant', 'bar', 'cafe', 'lodging'];

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lat: number; lng: number }
  | { status: 'denied' };

function requestGeo(onSuccess: (lat: number, lng: number) => void, onDeny: () => void) {
  if (!navigator.geolocation) { onDeny(); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => onSuccess(pos.coords.latitude, pos.coords.longitude),
    onDeny,
    { timeout: 8000 },
  );
}

export default function ExplorePage() {
  const [type, setType] = useState('');
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const [places, setPlaces] = useState<google.maps.places.PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const { ready, loadError, nearbySearch, textSearch } = useGooglePlaces();
  const handleTypeChange = useCallback((value: string) => setType(value), []);

  // Ask for location on mount
  useEffect(() => {
    setGeo({ status: 'loading' });
    requestGeo(
      (lat, lng) => setGeo({ status: 'ready', lat, lng }),
      () => setGeo({ status: 'denied' }),
    );
  }, []);

  // Stable primitives for dep array
  const lat = geo.status === 'ready' ? geo.lat : null;
  const lng = geo.status === 'ready' ? geo.lng : null;

  // ── Nearby search (geo available) ────────────────────────────────────────
  useEffect(() => {
    if (!ready || lat === null || lng === null) return;
    setLoading(true);
    setError(false);
    const location = { lat, lng };

    // Use Promise.allSettled so one failing type doesn't kill the rest
    const searches = type
      ? [nearbySearch({ location, radius: RADIUS_M, type: type as string })]
      : ALL_TYPES.map((t) => nearbySearch({ location, radius: RADIUS_M, type: t as string }));

    Promise.allSettled(searches)
      .then((outcomes) => {
        const seen = new Set<string>();
        const merged: google.maps.places.PlaceResult[] = [];
        for (const outcome of outcomes) {
          if (outcome.status !== 'fulfilled') continue;
          for (const place of outcome.value) {
            if (place.place_id && !seen.has(place.place_id)) {
              seen.add(place.place_id);
              merged.push(place);
            }
          }
        }
        if (merged.length === 0 && outcomes.every((o) => o.status === 'rejected')) {
          setError(true);
        } else {
          merged.sort((a, b) => {
            const rd = (b.rating ?? 0) - (a.rating ?? 0);
            return rd !== 0 ? rd : (b.user_ratings_total ?? 0) - (a.user_ratings_total ?? 0);
          });
          setPlaces(merged);
        }
      })
      .finally(() => setLoading(false));
  }, [ready, lat, lng, type]);

  // ── Text search (geo denied) ──────────────────────────────────────────────
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [textResults, setTextResults] = useState<google.maps.places.PlaceResult[]>([]);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    if (geo.status !== 'denied' || !ready) return;
    if (!searchQ.trim()) { setTextResults([]); return; }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setTextLoading(true);
      const query = type ? `${searchQ} ${type}` : searchQ;
      textSearch({ query })
        .then(setTextResults)
        .catch(() => setTextResults([]))
        .finally(() => setTextLoading(false));
    }, 400);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQ, type, ready, geo.status]);

  const showGoogleResults = geo.status === 'ready';
  const showDenied = geo.status === 'denied';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-heading font-bold text-[18px]">À découvrir</h1>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label="Filtres"
        >
          <SlidersHorizontal size={18} className="text-muted-foreground" />
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-screen-xl mx-auto w-full pb-8">
        {/* Barre de recherche : toujours visible en mode geo denied */}
        {showDenied && (
          <SearchBar
            placeholder="Rechercher restaurant, bar, hôtel…"
            onSearch={setSearchQ}
            debounceMs={0}
          />
        )}

        <FilterPills options={FILTER_OPTIONS} value={type} onChange={handleTypeChange} />

        {/* ── Localisation en cours ── */}
        {(geo.status === 'idle' || geo.status === 'loading') && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-sans">Localisation en cours…</p>
          </div>
        )}

        {/* ── Erreur Maps SDK ── */}
        {loadError && !showDenied && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle size={40} className="text-destructive/50" />
            <p className="text-sm text-muted-foreground">Impossible de charger Google Maps</p>
          </div>
        )}

        {/* ── Résultats géolocalisés ── */}
        {showGoogleResults && !loadError && (
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
                <p className="text-sm text-muted-foreground">
                  Impossible de charger les établissements
                </p>
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

        {/* ── Géolocalisation refusée ── */}
        {showDenied && (
          <>
            {/* Invite à activer la localisation si pas de recherche */}
            {!searchQ && !textLoading && textResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <LocateFixed size={28} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-heading font-bold text-[15px]">
                    Activez la géolocalisation
                  </p>
                  <p className="text-sm text-muted-foreground font-sans max-w-[260px] mx-auto">
                    Pour voir les restaurants, bars et hôtels près de vous, autorisez l&apos;accès à votre position.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGeo({ status: 'loading' });
                    requestGeo(
                      (lat, lng) => setGeo({ status: 'ready', lat, lng }),
                      () => setGeo({ status: 'denied' }),
                    );
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <LocateFixed size={15} />
                  Réessayer
                </button>
                <p className="text-xs text-muted-foreground font-sans">
                  Ou recherchez par nom, ville ou type ci-dessus
                </p>
              </div>
            )}

            {/* Squelette pendant la recherche texte */}
            {textLoading && (
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

            {/* Résultats recherche texte */}
            {!textLoading && textResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {textResults.map((place) => (
                  <PlaceCard key={place.place_id} place={place} />
                ))}
              </div>
            )}

            {/* Aucun résultat après recherche */}
            {!textLoading && searchQ && textResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <MapPin size={48} className="text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">
                  Aucun résultat pour &quot;{searchQ}&quot;
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
