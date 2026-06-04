'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader } from '@googlemaps/js-api-loader';
import { EstablishmentCard } from '@/components/establishment/EstablishmentCard';
import { MapPin, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EstablishmentType } from '@edp/shared';

const PARIS_CENTER = { lat: 48.8566, lng: 2.3522 };
const MAP_STYLE_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [type, setType] = useState('');
  const [userLocation, setUserLocation] = useState(PARIS_CENTER);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const { data: nearby } = useQuery({
    queryKey: ['nearby', userLocation, type],
    queryFn: () =>
      api.get('/establishments/nearby', {
        params: { lat: userLocation.lat, lng: userLocation.lng, radius: 20, type: type || undefined },
      }).then((r) => r.data),
  });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, []);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === '') { setMapError(true); return; }

    const loader = new Loader({ apiKey, version: 'weekly', libraries: ['places'] });
    loader.load().then(() => {
      if (!mapRef.current) return;
      const gmap = new (window as any).google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 13,
        styles: MAP_STYLE_DARK,
        disableDefaultUI: true,
        zoomControl: true,
      });
      setMap(gmap);
      setMapLoaded(true);
    }).catch(() => setMapError(true));
  }, []);

  useEffect(() => {
    if (!map || !nearby) return;
    markers.forEach((m) => m.setMap(null));
    const newMarkers = nearby.map((est: any) => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: parseFloat(est.latitude), lng: parseFloat(est.longitude) },
        map,
        title: est.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#C9A84C',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
      marker.addListener('click', () => setSelected(est));
      return marker;
    });
    setMarkers(newMarkers);
  }, [map, nearby]);

  const TYPES = [
    { value: '', label: 'Tous' },
    { value: EstablishmentType.RESTAURANT, label: 'Restaurants' },
    { value: EstablishmentType.HOTEL, label: 'Hôtels' },
    { value: EstablishmentType.BAR, label: 'Bars' },
  ];

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b border-border bg-card z-10 flex items-center gap-3">
        <h1 className="font-display font-bold text-xl hidden md:block">Carte</h1>
        <div className="flex gap-2 flex-1 overflow-x-auto">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                type === t.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative">
        {mapError ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground bg-secondary/20">
            <MapPin size={48} className="text-primary opacity-30" />
            <div className="text-center">
              <p className="font-medium text-foreground">Carte non disponible</p>
              <p className="text-sm mt-1">Configurez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY pour activer la carte</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 max-w-4xl w-full">
              {nearby?.slice(0, 6).map((est: any) => (
                <EstablishmentCard key={est.id} establishment={est} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div ref={mapRef} className="w-full h-full" />
            {selected && (
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground z-10"
                >✕</button>
                <EstablishmentCard establishment={selected} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
