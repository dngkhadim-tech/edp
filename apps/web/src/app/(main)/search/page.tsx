'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EstablishmentCard, type Establishment } from '@/components/establishment/EstablishmentCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { SearchX, X, Clock, Heart } from 'lucide-react';
import { getInitials, formatNumber } from '@/lib/utils';

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

interface PostResult {
  id: string;
  caption?: string;
  likesCount: number;
  media?: Array<{ url: string; type: string }>;
  author?: { firstName: string; lastName: string; username?: string; avatar?: string };
}

interface SearchResult {
  users: UserResult[];
  establishments: Establishment[];
  posts: PostResult[];
}

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

function UserRow({ user, onSelect }: { user: UserResult; onSelect: () => void }) {
  const [following, setFollowing] = useState(false);

  const { mutate: toggleFollow, isPending } = useMutation({
    mutationFn: () =>
      following
        ? api.delete(`/follows/users/${user.id}`)
        : api.post(`/follows/users/${user.id}`),
    onMutate: () => setFollowing((v) => !v),
    onError: () => setFollowing((v) => !v),
  });

  return (
    <Link
      href={`/profile/${user.username}`}
      onClick={onSelect}
      className="flex items-center gap-3 py-2 px-2 -mx-2 hover:bg-secondary rounded-xl transition-colors"
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={user.avatar ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {getInitials(user.firstName, user.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-sm truncate">
          {user.firstName} {user.lastName}
          {user.isVerified && <span className="ml-1 text-primary text-xs">✓</span>}
        </p>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
      </div>
      <Button
        variant={following ? 'outline' : 'default'}
        size="sm"
        className="flex-shrink-0 h-7 text-xs rounded-full px-3"
        disabled={isPending}
        onClick={(e) => {
          e.preventDefault();
          toggleFollow();
        }}
      >
        {following ? 'Abonné' : 'Suivre'}
      </Button>
    </Link>
  );
}

function PostRow({ post, onSelect }: { post: PostResult; onSelect: () => void }) {
  const thumb = post.media?.[0]?.url;
  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`.trim()
    : null;

  return (
    <Link
      href={`/post/${post.id}`}
      onClick={onSelect}
      className="flex items-center gap-3 py-2 px-2 -mx-2 hover:bg-secondary rounded-xl transition-colors"
    >
      {thumb ? (
        <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted relative">
          <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
        </div>
      ) : (
        <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-secondary flex items-center justify-center">
          <Heart size={14} className="text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {post.caption && (
          <p className="text-sm text-foreground line-clamp-2 leading-snug">{post.caption}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {authorName && <span>{authorName} · </span>}
          {formatNumber(post.likesCount)} j&apos;aime
        </p>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQ);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(getRecent());
  }, []);

  const handleChange = useCallback((value: string) => {
    setQuery(value.trim());
  }, []);

  const handleSubmit = useCallback((value: string) => {
    const v = value.trim();
    if (!v) return;
    saveRecent(v);
    setRecentSearches(getRecent());
    router.replace(`/search?q=${encodeURIComponent(v)}`, { scroll: false });
  }, [router]);

  const handleRemoveRecent = useCallback((q: string) => {
    removeRecent(q);
    setRecentSearches(getRecent());
  }, []);

  const handleSelectResult = useCallback((label: string) => {
    if (query.length >= 2) {
      saveRecent(query);
      setRecentSearches(getRecent());
    }
    if (label) {
      saveRecent(label);
      setRecentSearches(getRecent());
    }
  }, [query]);

  const { data, isLoading } = useQuery<SearchResult>({
    queryKey: ['search', query],
    queryFn: () =>
      api.get<SearchResult>('/search', { params: { q: query, limit: 10 } }).then((r) => r.data),
    enabled: query.length >= 2,
  });

  const users = data?.users ?? [];
  const establishments = data?.establishments ?? [];
  const posts = data?.posts ?? [];
  const hasResults = users.length > 0 || establishments.length > 0 || posts.length > 0;

  return (
    <div className="max-w-screen-md mx-auto px-4 pt-4 pb-12 space-y-5">
      <SearchBar
        placeholder="Rechercher un utilisateur, restaurant, ville…"
        defaultValue={initialQ}
        onSearch={handleChange}
        onSubmit={handleSubmit}
        debounceMs={300}
        autoFocus
      />

      {/* Recent searches */}
      {!query && recentSearches.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock size={12} /> Recherches récentes
          </p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((q) => (
              <span key={q} className="flex items-center gap-1.5 pl-3 pr-2 py-1 bg-secondary border border-border rounded-full text-sm">
                <button type="button" className="hover:text-primary transition-colors" onClick={() => { setQuery(q); handleSubmit(q); }}>
                  {q}
                </button>
                <button type="button" aria-label={`Supprimer "${q}"`} className="text-muted-foreground hover:text-foreground" onClick={() => handleRemoveRecent(q)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!query && recentSearches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <SearchX size={48} className="text-muted-foreground/20" />
          <p className="font-heading font-semibold text-foreground">Trouvez des personnes et des lieux</p>
          <p className="text-sm text-muted-foreground">Tapez un nom, une ville ou un établissement</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && !isLoading && !hasResults && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <SearchX size={40} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Aucun résultat pour «&nbsp;<span className="font-medium text-foreground">{query}</span>&nbsp;»
          </p>
        </div>
      )}

      {/* Results — 3 sections */}
      {query.length >= 2 && !isLoading && hasResults && (
        <div className="space-y-6">
          {/* Personnes */}
          {users.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Personnes
              </h2>
              <div className="divide-y divide-border/50">
                {users.map((u) => (
                  <UserRow key={u.id} user={u} onSelect={() => handleSelectResult(u.firstName)} />
                ))}
              </div>
            </section>
          )}

          {/* Établissements */}
          {establishments.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Établissements
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {establishments.map((est) => (
                  <EstablishmentCard key={est.id} establishment={est} />
                ))}
              </div>
            </section>
          )}

          {/* Publications */}
          {posts.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Publications
              </h2>
              <div className="divide-y divide-border/50">
                {posts.map((p) => (
                  <PostRow key={p.id} post={p} onSelect={() => handleSelectResult('')} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
