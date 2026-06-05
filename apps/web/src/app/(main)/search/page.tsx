'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EstablishmentCard, type Establishment } from '@/components/establishment/EstablishmentCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { SearchX, X, Clock } from 'lucide-react';
import { getInitials } from '@/lib/utils';

const STORAGE_KEY = 'edp_recent_searches';
const MAX_RECENT = 8;

interface UserResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  isVerified?: boolean;
}

interface SearchResult {
  users: UserResult[];
  establishments: Establishment[];
}

type Tab = 'establishments' | 'users';

function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  const prev = getRecent().filter((q) => q !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)));
}

function removeRecent(query: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getRecent().filter((q) => q !== query)));
}

function UserRow({ user }: { user: UserResult }) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-3 py-2 px-2 -mx-2 hover:bg-secondary rounded-xl transition-colors"
    >
      <Avatar className="h-11 w-11 flex-shrink-0">
        <AvatarImage src={user.avatar ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {getInitials(user.firstName, user.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-sm truncate">
          {user.firstName} {user.lastName}
          {user.isVerified && <span className="ml-1 text-primary text-xs" aria-label="Vérifié">✓</span>}
        </p>
        <p className="text-xs text-muted-foreground font-sans">@{user.username}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="flex-shrink-0 h-8 text-xs rounded-full px-4"
        onClick={(e) => e.preventDefault()}
      >
        Suivre
      </Button>
    </Link>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [submitted, setSubmitted] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<Tab>('establishments');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(getRecent());
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) { setSubmitted(''); return; }
      setSubmitted(v);
      saveRecent(v);
      setRecentSearches(getRecent());
      router.replace(`/search?q=${encodeURIComponent(v)}`, { scroll: false });
    },
    [router],
  );

  const handleRemoveRecent = useCallback((query: string) => {
    removeRecent(query);
    setRecentSearches(getRecent());
  }, []);

  const { data, isLoading } = useQuery<SearchResult>({
    queryKey: ['search', submitted],
    queryFn: () =>
      api.get<SearchResult>('/search', { params: { q: submitted, limit: 15 } }).then((r) => r.data),
    enabled: submitted.length > 0,
  });

  const users = data?.users ?? [];
  const establishments = data?.establishments ?? [];
  const hasResults = users.length > 0 || establishments.length > 0;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'establishments', label: 'Établissements', count: establishments.length },
    { key: 'users', label: 'Utilisateurs', count: users.length },
  ];

  return (
    <div className="max-w-screen-md mx-auto px-4 pt-4 pb-12 space-y-4">
      <SearchBar
        placeholder="Rechercher un utilisateur, restaurant, ville…"
        defaultValue={initialQ}
        onSearch={handleSearch}
        debounceMs={300}
        autoFocus
      />

      {/* Recent searches */}
      {!submitted && recentSearches.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock size={12} aria-hidden="true" /> Recherches récentes
          </p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((q) => (
              <span key={q} className="flex items-center gap-1.5 pl-3 pr-2 py-1 bg-secondary border border-border rounded-full text-sm font-sans">
                <button type="button" className="hover:text-primary transition-colors" onClick={() => handleSearch(q)}>
                  {q}
                </button>
                <button type="button" aria-label={`Supprimer "${q}"`} className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleRemoveRecent(q)}>
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!submitted && recentSearches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <SearchX size={48} className="opacity-20" aria-hidden="true" />
          <p className="font-heading font-semibold text-foreground">Trouvez des personnes et des lieux</p>
          <p className="text-sm font-sans mt-1">Tapez un nom, une ville ou un établissement</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* No results */}
      {submitted && !isLoading && !hasResults && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <SearchX size={40} className="opacity-30" aria-hidden="true" />
          <p className="text-sm font-sans">
            Aucun résultat pour «&nbsp;<span className="font-medium text-foreground">{submitted}</span>&nbsp;»
          </p>
        </div>
      )}

      {/* Tabs + results */}
      {submitted && !isLoading && hasResults && (
        <>
          <div role="tablist" className="flex gap-2 border-b border-border">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={[
                  'pb-2 px-1 text-sm font-medium border-b-2 transition-colors',
                  activeTab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {label}
                <span className="ml-1.5 text-xs bg-secondary rounded-full px-1.5 py-0.5 font-sans tabular-nums">
                  {count}
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'establishments' && establishments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {establishments.map((est) => (
                <EstablishmentCard key={est.id} establishment={est} />
              ))}
            </div>
          )}

          {activeTab === 'users' && users.length > 0 && (
            <div className="divide-y divide-border">
              {users.map((u) => <UserRow key={u.id} user={u} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
