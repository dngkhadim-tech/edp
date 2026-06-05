'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EstablishmentCard, type Establishment } from '@/components/establishment/EstablishmentCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { FilterPills, type FilterOption } from '@/components/shared/FilterPills';
import { SlidersHorizontal, SearchX } from 'lucide-react';

const FILTER_OPTIONS: FilterOption[] = [
  { value: '', label: 'Tout' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'BAR', label: 'Bar' },
  { value: 'HOTEL', label: 'Hôtel' },
  { value: 'CAFE', label: 'Café' },
  { value: 'TOURIST_SPOT', label: 'À visiter' },
];

export default function ExplorePage() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');

  const handleSearch = useCallback((value: string) => setQ(value), []);
  const handleTypeChange = useCallback((value: string) => setType(value), []);

  const { data, isLoading } = useQuery({
    queryKey: ['establishments', 'search', q, type],
    queryFn: () =>
      api
        .get<{ data: Establishment[] }>('/establishments/search', {
          params: { q, type, limit: 20 },
        })
        .then((r) => r.data),
  });

  const establishments = data?.data ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-heading font-bold text-[18px]">Découvrir</h1>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label="Filtres avancés"
        >
          <SlidersHorizontal size={18} className="text-muted-foreground" aria-hidden="true" />
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-screen-xl mx-auto w-full pb-8">
        <SearchBar
          placeholder="Rechercher restaurant, hôtel, ville…"
          onSearch={handleSearch}
          debounceMs={300}
        />

        <FilterPills
          options={FILTER_OPTIONS}
          value={type}
          onChange={handleTypeChange}
        />

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : establishments.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {establishments.map((est) => (
              <EstablishmentCard key={est.id} establishment={est} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <SearchX size={48} className="opacity-30" aria-hidden="true" />
            {q ? (
              <p className="text-sm font-sans text-center">
                Aucun résultat pour «&nbsp;<span className="font-medium text-foreground">{q}</span>&nbsp;»
              </p>
            ) : (
              <p className="text-sm font-sans">Aucun établissement trouvé</p>
            )}
            {q && (
              <p className="text-xs text-muted-foreground">Essayez un autre mot-clé ou changez les filtres</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
