'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EstablishmentCard } from '@/components/establishment/EstablishmentCard';
import { Search, Filter } from 'lucide-react';
import { EstablishmentType } from '@edp/shared';

const TYPES = [
  { value: '', label: 'Tous' },
  { value: EstablishmentType.RESTAURANT, label: 'Restaurants' },
  { value: EstablishmentType.HOTEL, label: 'Hôtels' },
  { value: EstablishmentType.BAR, label: 'Bars' },
  { value: EstablishmentType.CAFE, label: 'Cafés' },
  { value: EstablishmentType.TOURIST_SPOT, label: 'Tourisme' },
];

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [query, setQuery] = useState({ q: '', type: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['establishments', 'search', query],
    queryFn: () =>
      api.get('/establishments/search', { params: query }).then((r) => r.data),
  });

  const handleSearch = () => setQuery({ q: search, type });

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Explorer</h1>
        <p className="text-muted-foreground mt-1">Découvrez les meilleurs établissements</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Rechercher restaurant, hôtel, ville..."
            className="pl-10 bg-secondary"
          />
        </div>
        <Button onClick={handleSearch} className="gap-2">
          <Search size={16} />
          Chercher
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              type === t.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((est: any) => (
            <EstablishmentCard key={est.id} establishment={est} />
          ))}
          {data?.data?.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12">
              Aucun résultat trouvé
            </p>
          )}
        </div>
      )}
    </div>
  );
}
