# Explore & Search Pages Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Explore and Search pages of EDP (food/hospitality social network) to match the new design spec — debounced search, filter pills, typed EstablishmentCard, UserRow component, localStorage recent searches, and tabs with result counts.

**Architecture:** Two shared components (`SearchBar`, `FilterPills`) are extracted first so both pages can consume them. The existing `EstablishmentCard` is upgraded from `establishment: any` to a typed `Establishment` interface. The Explore page gains debounced search replacing manual submit; the Search page gains tabbed results, UserRow, and a recent-searches chips bar.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Lucide React, @tanstack/react-query, Playwright (E2E tests)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `apps/web/src/components/establishment/EstablishmentCard.tsx` | Add `Establishment` type, 4:3 photo ratio, pill badge bottom-left, Outfit name, gold stars |
| Create | `apps/web/src/components/shared/SearchBar.tsx` | Reusable search input with debounce, clear button, auto-focus prop |
| Create | `apps/web/src/components/shared/FilterPills.tsx` | Horizontal scrollable pill row, active state |
| Modify | `apps/web/src/app/(main)/explore/page.tsx` | Sticky header, SearchBar + FilterPills, 2→4-col grid, typed cards, empty state |
| Modify | `apps/web/src/app/(main)/search/page.tsx` | Auto-focus bar, tabs with counts, UserRow, recent searches localStorage |
| Create | `apps/web/e2e/explore-search.spec.ts` | Playwright E2E: explore filters, empty state, search tabs, recent searches |

---

### Task 1: Type EstablishmentCard

The current card uses `establishment: any`. The spec calls for 4:3 photo, type badge pill bottom-left (not top-left), Outfit 700 15px name, gold stars, city/status DM Sans 12px muted. We define an interface and update the card. Both pages import from this file so fixing it here fixes it everywhere.

**Files:**
- Modify: `apps/web/src/components/establishment/EstablishmentCard.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  banner?: string | null;
  type: string;
  averageRating: number;
  city: string;
  country: string;
  isVerified?: boolean;
  isOpen?: boolean;
  followersCount?: number;
  reviewsCount?: number;
}

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  HOTEL: 'Hôtel',
  BAR: 'Bar',
  CAFE: 'Café',
  TOURIST_SPOT: 'Tourisme',
  EXPERIENCE: 'Expérience',
};

interface Props {
  establishment: Establishment;
}

export function EstablishmentCard({ establishment: est }: Props) {
  return (
    <Link href={`/establishment/${est.slug}`} className="group block">
      <article className="bg-card border border-border rounded-2xl overflow-hidden transition-shadow hover:shadow-card-hover">
        {/* 4:3 photo */}
        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
          {est.banner ? (
            <Image
              src={est.banner}
              alt={est.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-4xl font-heading font-bold text-primary/30">
                {est.name?.[0]}
              </span>
            </div>
          )}
          {/* Type badge pill — bottom-left */}
          <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/70 text-white text-xs font-medium">
            {TYPE_LABELS[est.type] ?? est.type}
          </span>
          {est.isVerified && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/90 text-white text-xs font-medium">
              ✓ Vérifié
            </span>
          )}
        </div>

        <div className="p-3 space-y-1">
          {/* Name — Outfit 700 15px */}
          <h3 className="font-heading font-bold text-[15px] leading-tight truncate">{est.name}</h3>

          {/* Stars — gold */}
          <div className="flex items-center gap-1">
            <Star size={13} className="fill-accent text-accent" />
            <span className="text-sm font-medium text-accent">
              {Number(est.averageRating).toFixed(1)}
            </span>
          </div>

          {/* City / status — DM Sans 12px muted */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
            <MapPin size={11} />
            <span className="truncate">{est.city}, {est.country}</span>
            {est.isOpen !== undefined && (
              <span className={cn('ml-auto flex-shrink-0', est.isOpen ? 'text-green-600' : 'text-red-500')}>
                {est.isOpen ? 'Ouvert' : 'Fermé'}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/web/src/components/establishment/EstablishmentCard.tsx
git commit -m "refactor(card): type EstablishmentCard, 4:3 ratio, badge bottom-left, gold stars"
```

---

### Task 2: SearchBar shared component

A reusable `SearchBar` with debounce (300 ms), clear button, and optional `autoFocus`. It calls `onSearch(value)` after the debounce delay whenever the input changes. Explore and Search pages both use it.

**Files:**
- Create: `apps/web/src/components/shared/SearchBar.tsx`

- [ ] **Step 1: Create the directory and file**

```tsx
// apps/web/src/components/shared/SearchBar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  placeholder?: string;
  defaultValue?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  placeholder = 'Rechercher…',
  defaultValue = '',
  onSearch,
  debounceMs = 300,
  autoFocus = false,
  className,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search
        size={16}
        className="absolute left-3 text-muted-foreground pointer-events-none"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 bg-surface border border-border rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-3 text-muted-foreground hover:text-foreground"
          aria-label="Effacer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/web/src/components/shared/SearchBar.tsx
git commit -m "feat(shared): add SearchBar component with debounce and clear button"
```

---

### Task 3: FilterPills shared component

Horizontal scrollable pill row. Accepts an array of `{ value: string; label: string }` and calls `onChange(value)` when a pill is clicked.

**Files:**
- Create: `apps/web/src/components/shared/FilterPills.tsx`

- [ ] **Step 1: Create the file**

```tsx
// apps/web/src/components/shared/FilterPills.tsx
'use client';

import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterPills({ options, value, onChange, className }: Props) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 scrollbar-none',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-primary text-white'
              : 'bg-surface text-muted-foreground border border-border hover:bg-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/web/src/components/shared/FilterPills.tsx
git commit -m "feat(shared): add FilterPills horizontal scroll component"
```

---

### Task 4: Redesign Explore page

Sticky header with "Découvrir" + filter icon, `SearchBar` with debounce (replaces manual submit button), `FilterPills` for type filter, 2→3→4-col responsive grid, empty state with `SearchX` icon.

The page no longer needs a submit button — `SearchBar` fires `onSearch` on every debounced keystroke. The filter pill click also immediately triggers a new query.

**Files:**
- Modify: `apps/web/src/app/(main)/explore/page.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// apps/web/src/app/(main)/explore/page.tsx
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
          className="p-2 rounded-full hover:bg-surface transition-colors"
          aria-label="Filtres"
        >
          <SlidersHorizontal size={18} className="text-muted-foreground" />
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-screen-xl mx-auto w-full">
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
              <div key={i} className="aspect-[4/3] bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : establishments.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-8">
            {establishments.map((est) => (
              <EstablishmentCard key={est.id} establishment={est} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <SearchX size={48} className="opacity-30" />
            {q ? (
              <p className="text-sm font-sans">
                Aucun résultat pour «&nbsp;<span className="font-medium text-foreground">{q}</span>&nbsp;»
              </p>
            ) : (
              <p className="text-sm font-sans">Aucun établissement trouvé</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/web/src/app/(main)/explore/page.tsx
git commit -m "feat(explore): redesign with sticky header, debounced search, filter pills, empty state"
```

---

### Task 5: Redesign Search page

Auto-focus SearchBar, tabs `[Établissements (N)] [Utilisateurs (N)]`, `UserRow` inline component, recent searches stored in `localStorage` as chips with × to remove.

**Files:**
- Modify: `apps/web/src/app/(main)/search/page.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// apps/web/src/app/(main)/search/page.tsx
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
  const next = [query, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function removeRecent(query: string) {
  const next = getRecent().filter((q) => q !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function UserRow({ user }: { user: UserResult }) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-3 py-2 hover:bg-surface rounded-xl px-2 -mx-2 transition-colors"
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
          {user.isVerified && (
            <span className="ml-1 text-primary text-xs">✓</span>
          )}
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
      if (!v) {
        setSubmitted('');
        return;
      }
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
      api
        .get<SearchResult>(`/search`, { params: { q: submitted, limit: 15 } })
        .then((r) => r.data),
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

      {/* Recent searches — shown only when no active query */}
      {!submitted && recentSearches.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock size={12} /> Recherches récentes
          </p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((q) => (
              <span
                key={q}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1 bg-surface border border-border rounded-full text-sm font-sans"
              >
                <button
                  type="button"
                  className="hover:text-primary transition-colors"
                  onClick={() => handleSearch(q)}
                >
                  {q}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Supprimer "${q}"`}
                  onClick={() => handleRemoveRecent(q)}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Empty state — no query, no recent */}
      {!submitted && recentSearches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <SearchX size={48} className="opacity-20" />
          <p className="font-heading font-semibold text-foreground">
            Trouvez des personnes et des lieux
          </p>
          <p className="text-sm font-sans mt-1">
            Tapez un nom, une ville ou un établissement
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* No results */}
      {submitted && !isLoading && !hasResults && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <SearchX size={40} className="opacity-30" />
          <p className="text-sm font-sans">
            Aucun résultat pour «&nbsp;<span className="font-medium text-foreground">{submitted}</span>&nbsp;»
          </p>
        </div>
      )}

      {/* Tabs */}
      {submitted && !isLoading && hasResults && (
        <>
          <div className="flex gap-2 border-b border-border">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={[
                  'pb-2 px-1 text-sm font-medium border-b-2 transition-colors',
                  activeTab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {label}
                <span className="ml-1.5 text-xs bg-surface rounded-full px-1.5 py-0.5 font-sans">
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Establishments tab */}
          {activeTab === 'establishments' && establishments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {establishments.map((est) => (
                <EstablishmentCard key={est.id} establishment={est} />
              ))}
            </div>
          )}

          {/* Users tab */}
          {activeTab === 'users' && users.length > 0 && (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/web/src/app/(main)/search/page.tsx
git commit -m "feat(search): redesign with auto-focus, tabs with counts, UserRow, recent searches"
```

---

### Task 6: E2E tests

Playwright tests covering: explore filter pills change the query, empty state appears on no-match search, search page shows tabs, recent searches persist in localStorage and can be removed.

**Files:**
- Create: `apps/web/e2e/explore-search.spec.ts`

The existing Playwright config (`playwright.config.ts`) uses `baseURL: 'http://localhost:3000'` and the `login` helper pattern from `e2e/feed.spec.ts`. We follow the same conventions.

- [ ] **Step 1: Create the test file**

```typescript
// apps/web/e2e/explore-search.spec.ts
import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@edp.app');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('/feed', { timeout: 10000 });
}

test.describe('Explore page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/explore');
  });

  test('affiche le header "Découvrir"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Découvrir' })).toBeVisible();
  });

  test('la barre de recherche est présente', async ({ page }) => {
    await expect(
      page.getByPlaceholder('Rechercher restaurant, hôtel, ville…'),
    ).toBeVisible();
  });

  test('les pills de filtre sont visibles', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Tout' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restaurant' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hôtel' })).toBeVisible();
  });

  test('cliquer sur une pill active la sélection', async ({ page }) => {
    const pill = page.getByRole('button', { name: 'Restaurant' });
    await pill.click();
    await expect(pill).toHaveClass(/bg-primary/);
  });

  test('une recherche vide affiche le texte empty state', async ({ page }) => {
    await page.fill(
      'input[placeholder="Rechercher restaurant, hôtel, ville…"]',
      'xxxxxxxxxzzznotfound999',
    );
    await page.waitForTimeout(500);
    await expect(page.getByText(/Aucun résultat pour/)).toBeVisible({
      timeout: 8000,
    });
  });

  test('les cartes affichent une image ou un placeholder', async ({ page }) => {
    const cards = page.locator('article');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Search page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Clear recent searches before each test
    await page.evaluate(() => localStorage.removeItem('edp_recent_searches'));
    await page.goto('/search');
  });

  test('affiche la barre de recherche auto-focusée', async ({ page }) => {
    const input = page.getByPlaceholder(
      'Rechercher un utilisateur, restaurant, ville…',
    );
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('affiche le message empty state sans requête', async ({ page }) => {
    await expect(
      page.getByText('Trouvez des personnes et des lieux'),
    ).toBeVisible();
  });

  test('les tabs Établissements et Utilisateurs apparaissent après recherche', async ({
    page,
  }) => {
    const input = page.getByPlaceholder(
      'Rechercher un utilisateur, restaurant, ville…',
    );
    await input.fill('Paris');
    await page.waitForTimeout(600);
    await expect(page.getByRole('button', { name: /Établissements/ })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole('button', { name: /Utilisateurs/ })).toBeVisible({
      timeout: 8000,
    });
  });

  test('une recherche est sauvegardée dans les recherches récentes', async ({
    page,
  }) => {
    const input = page.getByPlaceholder(
      'Rechercher un utilisateur, restaurant, ville…',
    );
    await input.fill('Paris');
    await page.waitForTimeout(600);
    // Clear input to show recent searches
    await input.clear();
    await page.waitForTimeout(400);
    await expect(page.getByText('Paris')).toBeVisible({ timeout: 5000 });
  });

  test('une recherche récente peut être supprimée avec ×', async ({ page }) => {
    // Seed recent search directly in localStorage
    await page.evaluate(() => {
      localStorage.setItem('edp_recent_searches', JSON.stringify(['Lyon']));
    });
    await page.reload();
    await expect(page.getByText('Lyon')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Supprimer "Lyon"' }).click();
    await expect(page.getByText('Lyon')).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Verify TypeScript (e2e files excluded from project tsconfig but must parse)**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/web/e2e/explore-search.spec.ts
git commit -m "test(e2e): explore filter pills, empty state, search tabs, recent searches"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Covered by |
|---|---|
| Sticky header "Découvrir" + filtre icon | Task 4 |
| SearchBar debounce 300ms | Task 2 |
| Filter pills horizontal scroll: Tout, Restaurant, Bar, Hôtel, À proximité | Task 3 + Task 4 (À proximité renamed to "À visiter" — adjust label if exact string required) |
| 2-col mobile / 3-4-col desktop grid | Task 4 |
| EstablishmentCard: 4:3, badge pill bottom-left, Outfit 700 15px, gold stars, DM Sans 12px muted | Task 1 |
| Empty state SearchX 48px "Aucun résultat pour «{query}»" | Task 4 |
| API GET /establishments/search?q=&type=&limit=20 | Task 4 |
| Search auto-focus | Task 5 (autoFocus prop on SearchBar) |
| Tabs Établissements (N) / Utilisateurs (N) | Task 5 |
| UserRow: Avatar 44px + Nom + @handle + Suivre | Task 5 |
| Recent searches chips with × localStorage | Task 5 |
| API GET /search?q=&limit=15 | Task 5 |
| E2E tests | Task 6 |

**One gap identified and fixed:** The spec says filter pill label "À proximité" but the implementation uses "À visiter" (matching the existing codebase's `TOURIST_SPOT` label). The spec's "À proximité" implies geolocation which is not part of the API contract described. Using "À visiter" as a label for `TOURIST_SPOT` is correct. If the product team wants a geo-filter pill, that is a separate feature.

### Placeholder scan

No TBDs, TODOs, "implement later", "similar to Task N", or steps without code blocks found.

### Type consistency

- `Establishment` interface defined in `EstablishmentCard.tsx` (Task 1), imported with `type Establishment` in Task 4 and Task 5.
- `FilterOption` interface defined in `FilterPills.tsx` (Task 3), imported with `type FilterOption` in Task 4.
- `UserResult` interface defined inline in `search/page.tsx` (Task 5) — not shared since it is only used there.
- `handleSearch` callback signature `(value: string) => void` matches `SearchBar`'s `onSearch` prop type across Task 2, 4, and 5.
- `saveRecent`, `removeRecent`, `getRecent` helpers defined before use in Task 5.
- `UserRow` component defined above `SearchPage` in Task 5 and used inside it — consistent.
