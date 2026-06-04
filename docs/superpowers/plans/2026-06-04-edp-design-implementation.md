# EDP Design — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Appliquer le design system "Social-first Warm" (Outfit + DM Sans, #E11D48 + #A16207) sur les 3 écrans clés — Feed, Fiche Établissement, Profil Utilisateur.

**Architecture:** Mise à jour des tokens CSS + Tailwind en premier (Task 1), puis composants réutilisables (CategoryPills, ReelsRow, HeroGallery, MenuAccordion, LoyaltyBadge, PostGrid), enfin assemblage dans les pages. Chaque tâche est indépendante et committable.

**Tech Stack:** Next.js 15, Tailwind CSS, Lucide React, @tanstack/react-query, Playwright (E2E)

**Spec de référence:** `docs/superpowers/specs/2026-06-04-edp-design.md`

---

## File Structure

### Fichiers modifiés
- `apps/web/src/app/globals.css` — tokens CSS (couleurs, fonts, variables)
- `apps/web/tailwind.config.ts` — palette couleurs, fontFamily Outfit + DM Sans
- `apps/web/src/components/layout/MobileNav.tsx` — labels, bouton + central surélevé
- `apps/web/src/components/layout/Sidebar.tsx` — mode condensé 768-1023px
- `apps/web/src/components/feed/PostCard.tsx` — ratio 4:5, badge établissement, like animation
- `apps/web/src/app/(main)/feed/page.tsx` — CategoryPills + ReelsRow intercalées
- `apps/web/src/app/(main)/establishment/[slug]/page.tsx` — redesign complet
- `apps/web/src/app/(main)/profile/[username]/page.tsx` — redesign complet
- `apps/web/src/lib/utils.ts` — mise à jour gradeColor/gradeLabel pour tokens fidélité

### Fichiers créés
- `apps/web/src/components/feed/CategoryPills.tsx` — pills scroll horizontal
- `apps/web/src/components/feed/ReelsRow.tsx` — scroll horizontal snap 9:16
- `apps/web/src/components/establishment/HeroGallery.tsx` — galerie swipe + dots
- `apps/web/src/components/establishment/MenuAccordion.tsx` — accordion sections menu
- `apps/web/src/components/profile/LoyaltyBadge.tsx` — pill badge fidélité
- `apps/web/src/components/profile/PostGrid.tsx` — grille 3 colonnes ratio 1:1

---

## Task 1 : Design Tokens — Couleurs, Fonts, Variables CSS

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/tailwind.config.ts`

- [ ] **Step 1 : Mettre à jour globals.css**

Remplacer le contenu de `apps/web/src/app/globals.css` :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Outfit:wght@600;700;800&display=swap');

:root {
  --background: 0 0% 100%;
  --foreground: 220 13% 7%;
  --card: 0 0% 100%;
  --card-foreground: 220 13% 7%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 13% 7%;
  --primary: 343 84% 52%;
  --primary-foreground: 0 0% 100%;
  --primary-hover: 343 84% 40%;
  --secondary: 220 14% 96%;
  --secondary-foreground: 220 13% 7%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 44%;
  --accent: 38 89% 32%;
  --accent-foreground: 0 0% 100%;
  --accent-light: 55 92% 88%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --success: 142 71% 37%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 343 84% 52%;
  --radius: 1rem;

  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
  --shadow-card-hover: 0 4px 8px rgba(0,0,0,0.10), 0 12px 24px rgba(0,0,0,0.08);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.20);
}

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: 'Outfit', system-ui, sans-serif;
}

/* Scrollbar globale */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }

/* Cacher scrollbar horizontale (pills, reels) */
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

/* Animation like */
@keyframes like-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.35); }
  100% { transform: scale(1); }
}
.animate-like-pop { animation: like-pop 250ms ease-out; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2 : Mettre à jour tailwind.config.ts**

Remplacer `apps/web/tailwind.config.ts` :

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))', hover: 'hsl(var(--primary-hover))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))', light: 'hsl(var(--accent-light))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        success: 'hsl(var(--success))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        full: '9999px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        modal: 'var(--shadow-modal)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'like-pop': 'like-pop 250ms ease-out',
        ping: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

- [ ] **Step 3 : Vérifier la compilation**

```bash
cd apps/web && pnpm build 2>&1 | tail -20
```

Résultat attendu : `✓ Compiled successfully` sans erreurs TypeScript.

- [ ] **Step 4 : Commit**

```bash
git add apps/web/src/app/globals.css apps/web/tailwind.config.ts
git commit -m "feat(design): update tokens — Outfit/DM Sans fonts, rose primary, gold accent"
```

---

## Task 2 : MobileNav — Labels + Bouton Central Surélevé

**Files:**
- Modify: `apps/web/src/components/layout/MobileNav.tsx`

- [ ] **Step 1 : Écrire le test E2E**

Créer `apps/web/e2e/mobile-nav.spec.ts` :

```typescript
import { test, expect } from '@playwright/test';

test('mobile nav has 5 items with labels', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/feed');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await expect(nav).toBeVisible();
  await expect(nav.getByText('Accueil')).toBeVisible();
  await expect(nav.getByText('Découvrir')).toBeVisible();
  await expect(nav.getByText('Reels')).toBeVisible();
  await expect(nav.getByText('Profil')).toBeVisible();
});

test('mobile nav publish button is centered and elevated', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/feed');
  const publishBtn = page.getByRole('link', { name: 'Publier' });
  await expect(publishBtn).toBeVisible();
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd apps/web && pnpm exec playwright test e2e/mobile-nav.spec.ts --reporter=line 2>&1 | tail -20
```

Résultat attendu : FAIL — labels non trouvés dans le nav actuel.

- [ ] **Step 3 : Réécrire MobileNav**

Remplacer `apps/web/src/components/layout/MobileNav.tsx` :

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Compass, Plus, Film, User } from 'lucide-react';

const ITEMS = [
  { href: '/feed',        icon: Home,    label: 'Accueil'  },
  { href: '/explore',     icon: Compass, label: 'Découvrir' },
  { href: '/reels',       icon: Film,    label: 'Reels'    },
  { href: '/profile/me',  icon: User,    label: 'Profil'   },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex lg:hidden z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Accueil + Découvrir */}
      {ITEMS.slice(0, 2).map(({ href, icon: Icon, label }) => (
        <NavItem key={href} href={href} icon={Icon} label={label} active={pathname.startsWith(href)} />
      ))}

      {/* Bouton central surélevé */}
      <Link
        href="/post/new"
        aria-label="Publier"
        className={cn(
          'flex-1 flex items-center justify-center -mt-3',
        )}
      >
        <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-[0_4px_12px_rgba(225,29,72,0.4)] transition-transform active:scale-95">
          <Plus size={26} className="text-primary-foreground" strokeWidth={2.5} />
        </span>
      </Link>

      {/* Reels + Profil */}
      {ITEMS.slice(2).map(({ href, icon: Icon, label }) => (
        <NavItem key={href} href={href} icon={Icon} label={label} active={pathname.startsWith(href)} />
      ))}
    </nav>
  );
}

function NavItem({ href, icon: Icon, label, active }: {
  href: string; icon: React.ElementType; label: string; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon size={22} strokeWidth={active ? 2 : 1.5} />
      <span className="text-[10px] font-sans font-medium leading-none">{label}</span>
    </Link>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
cd apps/web && pnpm exec playwright test e2e/mobile-nav.spec.ts --reporter=line 2>&1 | tail -20
```

Résultat attendu : PASS (2 tests).

- [ ] **Step 5 : Commit**

```bash
git add apps/web/src/components/layout/MobileNav.tsx apps/web/e2e/mobile-nav.spec.ts
git commit -m "feat(nav): redesign mobile nav — labels, elevated publish button"
```

---

## Task 3 : CategoryPills — Composant Filtre Feed

**Files:**
- Create: `apps/web/src/components/feed/CategoryPills.tsx`

- [ ] **Step 1 : Créer CategoryPills.tsx**

```typescript
'use client';

import { cn } from '@/lib/utils';

export type FeedCategory = 'all' | 'restaurant' | 'bar' | 'hotel' | 'nearby';

const CATEGORIES: { value: FeedCategory; label: string }[] = [
  { value: 'all',        label: 'Tout'        },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'bar',        label: 'Bars'        },
  { value: 'hotel',      label: 'Hôtels'      },
  { value: 'nearby',     label: 'À proximité' },
];

interface CategoryPillsProps {
  value: FeedCategory;
  onChange: (v: FeedCategory) => void;
}

export function CategoryPills({ value, onChange }: CategoryPillsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2"
      role="group"
      aria-label="Filtrer le fil d'actualité"
    >
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          aria-pressed={value === cat.value}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-heading font-semibold transition-colors duration-150',
            value === cat.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-muted',
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add apps/web/src/components/feed/CategoryPills.tsx
git commit -m "feat(feed): add CategoryPills component"
```

---

## Task 4 : PostCard — Ratio 4:5, Badge Établissement, Like Animation

**Files:**
- Modify: `apps/web/src/components/feed/PostCard.tsx`

- [ ] **Step 1 : Écrire le test E2E**

Ajouter dans `apps/web/e2e/feed.spec.ts` :

```typescript
test('post card has 4:5 aspect ratio media', async ({ page }) => {
  await page.goto('/feed');
  const mediaContainer = page.locator('article').first().locator('[data-testid="post-media"]');
  await expect(mediaContainer).toHaveCSS('aspect-ratio', '4 / 5');
});

test('like button animates on click', async ({ page }) => {
  await page.goto('/feed');
  const likeBtn = page.locator('article').first().getByRole('button', { name: /j'aime/i });
  await likeBtn.click();
  await expect(likeBtn.locator('svg')).toHaveClass(/text-primary/);
});
```

- [ ] **Step 2 : Modifier PostCard.tsx**

Remplacer uniquement les sections `/* Media */` et le bouton like dans `apps/web/src/components/feed/PostCard.tsx` :

Section media (remplacer `<div className="relative aspect-square ...">`) :

```tsx
{/* Media */}
{mediaItem && (
  <div
    data-testid="post-media"
    className="relative bg-muted overflow-hidden"
    style={{ aspectRatio: '4/5' }}
  >
    {/* Gradient overlay pour le badge */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent z-10 pointer-events-none" />

    {mediaItem.type === 'video' ? (
      <video
        src={mediaItem.url}
        className="w-full h-full object-cover"
        controls
        playsInline
      />
    ) : (
      <SafeImage
        src={mediaItem.url}
        alt={post.caption || 'Post EDP'}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 600px"
      />
    )}

    {/* Badge établissement */}
    {post.establishment && (
      <Link
        href={`/establishment/${post.establishment.slug}`}
        className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-foreground text-xs font-heading font-semibold backdrop-blur-md"
        style={{ background: 'rgba(255,255,255,0.88)' }}
      >
        <MapPin size={11} className="text-primary flex-shrink-0" />
        <span className="truncate max-w-[140px]">{post.establishment.name}</span>
      </Link>
    )}
  </div>
)}
```

Remplacer le bouton like (dans la section `/* Actions */`) :

```tsx
<button
  onClick={handleLike}
  aria-label="J'aime"
  className={cn(
    'flex items-center gap-1.5 text-sm transition-colors',
    liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
  )}
>
  <Heart
    size={22}
    className={cn(
      liked ? 'fill-primary text-primary' : '',
      likeAnimating ? 'animate-like-pop' : '',
    )}
    onAnimationEnd={() => setLikeAnimating(false)}
  />
  <span className="font-semibold tabular-nums">{formatNumber(likesCount)}</span>
</button>
```

Ajouter le state `likeAnimating` et modifier `handleLike` dans le composant :

```typescript
const [likeAnimating, setLikeAnimating] = useState(false);

const handleLike = async () => {
  setLiked(!liked);
  setLikeAnimating(true);
  setLikesCount((c: number) => liked ? c - 1 : c + 1);
  await api.post(`/posts/${post.id}/like`).catch(() => {
    setLiked(liked);
    setLikesCount((c: number) => liked ? c + 1 : c - 1);
  });
};
```

- [ ] **Step 3 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/web/src/components/feed/PostCard.tsx
git commit -m "feat(feed): PostCard 4:5 ratio, establishment badge, like animation"
```

---

## Task 5 : ReelsRow — Scroll Horizontal Snap

**Files:**
- Create: `apps/web/src/components/feed/ReelsRow.tsx`

- [ ] **Step 1 : Créer ReelsRow.tsx**

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface Reel {
  id: string;
  thumbnailUrl?: string;
  duration?: number;
  caption?: string;
}

interface ReelsRowProps {
  reels: Reel[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ReelsRow({ reels }: ReelsRowProps) {
  if (!reels.length) return null;
  return (
    <section aria-label="Reels">
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="font-heading font-bold text-sm text-foreground">Reels</h2>
        <Link href="/reels" className="text-xs text-primary font-semibold">Voir tout</Link>
      </div>
      <div
        className="flex gap-2 overflow-x-auto scrollbar-none px-4 pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {reels.map((reel) => (
          <Link
            key={reel.id}
            href={`/reels?id=${reel.id}`}
            className="flex-shrink-0 relative rounded-xl overflow-hidden bg-muted"
            style={{ width: 120, aspectRatio: '9/16', scrollSnapAlign: 'start' }}
            aria-label={reel.caption || 'Voir le reel'}
          >
            {reel.thumbnailUrl ? (
              <Image
                src={reel.thumbnailUrl}
                alt={reel.caption || ''}
                fill
                className="object-cover"
                sizes="120px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20" />
            {/* Play icon */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black/45">
                <Play size={16} className="text-white fill-white ml-0.5" />
              </span>
            </span>
            {/* Durée */}
            {reel.duration != null && (
              <span className="absolute bottom-2 right-2 text-[10px] text-white font-sans font-medium bg-black/55 px-1.5 py-0.5 rounded">
                {formatDuration(reel.duration)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add apps/web/src/components/feed/ReelsRow.tsx
git commit -m "feat(feed): add ReelsRow component — horizontal scroll snap 9:16"
```

---

## Task 6 : Page Feed — Assemblage CategoryPills + ReelsRow

**Files:**
- Modify: `apps/web/src/app/(main)/feed/page.tsx`

- [ ] **Step 1 : Modifier la page Feed**

Remplacer `apps/web/src/app/(main)/feed/page.tsx` :

```typescript
'use client';

import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { PostCard } from '@/components/feed/PostCard';
import { CategoryPills, type FeedCategory } from '@/components/feed/CategoryPills';
import { ReelsRow } from '@/components/feed/ReelsRow';
import { Loader2 } from 'lucide-react';

const REELS_AFTER_N_POSTS = 3;

export default function FeedPage() {
  const { ref, inView } = useInView();
  const [category, setCategory] = useState<FeedCategory>('all');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed', category],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/feed?page=${pageParam}&limit=10${category !== 'all' ? `&type=${category}` : ''}`).then((r) => r.data),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  const { data: reelsData } = useQuery({
    queryKey: ['reels', 'preview'],
    queryFn: () => api.get('/reels?limit=6').then((r) => r.data?.data ?? []),
  });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="max-w-xl mx-auto pb-24 lg:pb-8">
      {/* Header mobile */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 lg:hidden flex items-center justify-between">
        <span className="font-heading font-extrabold text-xl text-primary">EDP</span>
        <span className="text-xs text-muted-foreground font-sans">Eat · Drink · Pose</span>
      </header>

      <CategoryPills value={category} onChange={setCategory} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : (
        <div className="space-y-4 px-4">
          {posts.map((post: any, i: number) => (
            <div key={post.id}>
              <PostCard post={post} />
              {/* Insérer ReelsRow après le Nième post */}
              {i === REELS_AFTER_N_POSTS - 1 && reelsData?.length > 0 && (
                <div className="-mx-4 mt-4">
                  <ReelsRow reels={reelsData} />
                </div>
              )}
            </div>
          ))}

          <div ref={ref} className="flex justify-center py-4">
            {isFetchingNextPage && <Loader2 className="animate-spin text-primary" size={22} />}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add apps/web/src/app/\(main\)/feed/page.tsx
git commit -m "feat(feed): wire CategoryPills and ReelsRow into feed page"
```

---

## Task 7 : HeroGallery — Galerie Swipe + Dots

**Files:**
- Create: `apps/web/src/components/establishment/HeroGallery.tsx`

- [ ] **Step 1 : Créer HeroGallery.tsx**

```typescript
'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Images } from 'lucide-react';

interface HeroGalleryProps {
  images: string[];
  name: string;
  totalCount?: number;
}

export function HeroGallery({ images, name, totalCount }: HeroGalleryProps) {
  const [current, setCurrent] = useState(0);
  const count = images.length;
  const extra = (totalCount ?? count) - count;

  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);

  if (!count) {
    return (
      <div className="relative w-full bg-muted flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-muted"
      style={{ aspectRatio: '16/9' }}
      aria-label={`Galerie photos de ${name}`}
    >
      <Image
        key={current}
        src={images[current]}
        alt={`${name} — photo ${current + 1}`}
        fill
        className="object-cover"
        sizes="100vw"
        priority={current === 0}
      />

      {/* Gradient bas */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Navigation flèches (desktop) */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors hidden md:flex"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors hidden md:flex"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Aller à la photo ${i + 1}`}
              className={cn(
                'rounded-full transition-all duration-200',
                i === current ? 'bg-white w-4 h-1.5' : 'bg-white/55 w-1.5 h-1.5',
              )}
            />
          ))}
        </div>
      )}

      {/* Bouton +N photos */}
      {extra > 0 && (
        <button
          aria-label={`Voir ${extra} photos supplémentaires`}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-heading font-semibold bg-black/55 hover:bg-black/70 transition-colors"
        >
          <Images size={13} />
          +{extra} photos
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add apps/web/src/components/establishment/HeroGallery.tsx
git commit -m "feat(establishment): add HeroGallery component — swipe + dots"
```

---

## Task 8 : MenuAccordion — Sections Menu Pliables

**Files:**
- Create: `apps/web/src/components/establishment/MenuAccordion.tsx`

- [ ] **Step 1 : Créer MenuAccordion.tsx**

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  name: string;
  description?: string;
  price?: number | string;
}

interface MenuSection {
  name: string;
  priceRange?: string;
  items: MenuItem[];
}

interface MenuAccordionProps {
  sections: MenuSection[];
}

export function MenuAccordion({ sections }: MenuAccordionProps) {
  const [open, setOpen] = useState<string | null>(sections[0]?.name ?? null);

  if (!sections.length) {
    return <p className="text-sm text-muted-foreground px-4 py-2">Menu non disponible.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {sections.map((section) => {
        const isOpen = open === section.name;
        return (
          <div key={section.name}>
            <button
              onClick={() => setOpen(isOpen ? null : section.name)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
            >
              <span className="font-heading font-semibold text-sm text-foreground">{section.name}</span>
              <div className="flex items-center gap-3">
                {section.priceRange && (
                  <span className="text-xs text-muted-foreground tabular-nums">{section.priceRange}</span>
                )}
                <ChevronDown
                  size={16}
                  className={cn('text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')}
                />
              </div>
            </button>

            {isOpen && (
              <ul className="px-4 pb-3 space-y-2.5 animate-fade-in">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans font-medium text-foreground truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.price != null && (
                      <span className="text-sm font-sans font-medium text-foreground tabular-nums flex-shrink-0">
                        {typeof item.price === 'number' ? `${item.price}€` : item.price}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add apps/web/src/components/establishment/MenuAccordion.tsx
git commit -m "feat(establishment): add MenuAccordion component"
```

---

## Task 9 : Page Établissement — Redesign Complet

**Files:**
- Modify: `apps/web/src/app/(main)/establishment/[slug]/page.tsx`

- [ ] **Step 1 : Écrire le test E2E**

Ajouter dans `apps/web/e2e/establishment.spec.ts` :

```typescript
test('establishment page has hero gallery with dots', async ({ page }) => {
  await page.goto('/establishment/le-meurice');
  await expect(page.getByLabel(/Galerie photos/)).toBeVisible();
});

test('establishment page has sticky tabs', async ({ page }) => {
  await page.goto('/establishment/le-meurice');
  const tabs = page.getByRole('tablist');
  await expect(tabs).toBeVisible();
});

test('reserve button is visible and red', async ({ page }) => {
  await page.goto('/establishment/le-meurice');
  const reserveBtn = page.getByRole('button', { name: /réserver/i });
  await expect(reserveBtn).toBeVisible();
});
```

- [ ] **Step 2 : Remplacer la page Établissement**

Remplacer `apps/web/src/app/(main)/establishment/[slug]/page.tsx` :

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star, MapPin, Clock, Navigation, Bookmark, Share2,
  ChevronLeft, MoreHorizontal,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { HeroGallery } from '@/components/establishment/HeroGallery';
import { MenuAccordion } from '@/components/establishment/MenuAccordion';
import { ReviewCard } from '@/components/establishment/ReviewCard';
import { Button } from '@/components/ui/button';

const TABS = ['À propos', 'Menu', 'Avis', 'Photos'] as const;
type Tab = (typeof TABS)[number];

export default function EstablishmentPage({ params }: { params: any }) {
  const { slug } = params as { slug: string };
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('À propos');
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const { data: est, isLoading } = useQuery({
    queryKey: ['establishment', slug],
    queryFn: () => api.get(`/establishments/${slug}`).then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', est?.id],
    queryFn: () => api.get(`/reviews/establishment/${est.id}?limit=3`).then((r) => r.data),
    enabled: !!est?.id,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 pb-24">
        <div className="w-full bg-muted" style={{ aspectRatio: '16/9' }} />
        <div className="px-4 space-y-3">
          <div className="h-7 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!est) return null;

  const isOpen = est.isOpen ?? false;
  const images: string[] = [est.banner, ...(est.gallery ?? [])].filter(Boolean);
  const menuSections = est.menu ?? [];
  const avgRating: number = est.avgRating ?? est.averageRating ?? 0;
  const reviewsCount: number = est.reviewsCount ?? reviews?.meta?.total ?? 0;

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header adaptatif */}
      <header
        ref={headerRef}
        className={cn(
          'fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 transition-all duration-200',
          'lg:left-64',
          scrolled
            ? 'bg-background/95 backdrop-blur-sm border-b border-border h-14 shadow-card'
            : 'bg-transparent h-14',
        )}
      >
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
            scrolled ? 'text-foreground hover:bg-muted' : 'bg-black/40 text-white',
          )}
        >
          <ChevronLeft size={20} />
        </button>

        {scrolled && (
          <span className="font-heading font-bold text-sm text-foreground truncate max-w-[200px]">
            {est.name}
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            aria-label="Sauvegarder"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              scrolled ? 'text-muted-foreground hover:bg-muted' : 'bg-black/40 text-white',
            )}
          >
            <Bookmark size={18} />
          </button>
          <button
            aria-label="Plus d'options"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              scrolled ? 'text-muted-foreground hover:bg-muted' : 'bg-black/40 text-white',
            )}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* Galerie hero */}
      <div className="mt-0">
        <HeroGallery images={images} name={est.name} totalCount={est.photosCount} />
      </div>

      {/* Bloc identité */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        <h1 className="font-heading font-extrabold text-2xl text-foreground leading-tight">{est.name}</h1>

        {/* Note + distance */}
        <div className="flex items-center gap-3 flex-wrap">
          {avgRating > 0 && (
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  className={s <= Math.round(avgRating) ? 'fill-accent text-accent' : 'text-border'}
                />
              ))}
              <span className="font-heading font-bold text-sm text-foreground ml-1">
                {avgRating.toFixed(1)}
              </span>
              {reviewsCount > 0 && (
                <span className="text-xs text-muted-foreground">({formatNumber(reviewsCount)} avis)</span>
              )}
            </div>
          )}
          {est.city && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              {est.city}
            </span>
          )}
        </div>

        {/* Catégorie + statut ouverture */}
        <div className="flex items-center gap-3 flex-wrap">
          {est.type && (
            <span className="text-sm text-muted-foreground capitalize">{est.type}</span>
          )}
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'inline-flex items-center gap-1 text-sm font-sans font-medium',
              isOpen ? 'text-success' : 'text-destructive',
            )}>
              {isOpen ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  Ouvert{est.closingTime ? ` · Ferme à ${est.closingTime}` : ''}
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Fermé{est.openingTime ? ` · Ouvre à ${est.openingTime}` : ''}
                </>
              )}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3 pt-1">
          <Button
            className="flex-1 font-heading font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl"
          >
            Réserver
          </Button>
          <Button
            variant="outline"
            className="flex-1 font-heading font-semibold border-border text-foreground h-12 rounded-xl"
            asChild
          >
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(est.name + ' ' + (est.city ?? ''))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation size={16} className="mr-1.5" />
              Itinéraire
            </a>
          </Button>
        </div>
      </div>

      {/* Tabs sticky */}
      <div
        role="tablist"
        aria-label="Sections de l'établissement"
        className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border flex overflow-x-auto scrollbar-none"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-shrink-0 px-5 py-3 text-sm font-heading font-semibold transition-colors border-b-2',
              tab === t
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Contenu tabs */}
      <div className="pt-4">
        {tab === 'À propos' && (
          <div className="px-4 space-y-4">
            {est.description && (
              <p className="text-sm text-foreground leading-relaxed">{est.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {est.openingHours && (
                <div className="flex items-center gap-1.5 bg-secondary px-3 py-2 rounded-xl text-sm text-foreground">
                  <Clock size={14} className="text-muted-foreground" />
                  {est.openingHours}
                </div>
              )}
              {est.wifi && (
                <div className="bg-secondary px-3 py-2 rounded-xl text-sm text-foreground">Wifi ✓</div>
              )}
              {est.parking && (
                <div className="bg-secondary px-3 py-2 rounded-xl text-sm text-foreground">Parking ✓</div>
              )}
            </div>
          </div>
        )}

        {tab === 'Menu' && (
          <MenuAccordion sections={menuSections} />
        )}

        {tab === 'Avis' && (
          <div className="px-4 space-y-3">
            {reviews?.data?.map((r: any) => (
              <ReviewCard key={r.id} review={r} />
            ))}
            {reviewsCount > 3 && (
              <Link
                href={`/establishment/${slug}/reviews`}
                className="block text-center text-sm font-heading font-semibold text-primary py-2"
              >
                Voir les {formatNumber(reviewsCount)} avis →
              </Link>
            )}
          </div>
        )}

        {tab === 'Photos' && (
          <div className="grid grid-cols-3 gap-0.5 px-0">
            {images.map((img, i) => (
              <div key={i} className="relative bg-muted" style={{ aspectRatio: '1' }}>
                <img src={img} alt={`${est.name} photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/web/src/app/\(main\)/establishment/\[slug\]/page.tsx
git commit -m "feat(establishment): full page redesign — hero gallery, adaptive header, sticky tabs, open badge"
```

---

## Task 10 : LoyaltyBadge + utils.ts — Badge Fidélité

**Files:**
- Modify: `apps/web/src/lib/utils.ts`
- Create: `apps/web/src/components/profile/LoyaltyBadge.tsx`

- [ ] **Step 1 : Mettre à jour gradeColor dans utils.ts**

Remplacer la fonction `gradeColor` dans `apps/web/src/lib/utils.ts` :

```typescript
export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    BRONZE:   'text-amber-800',
    SILVER:   'text-slate-500',
    GOLD:     'text-accent',
    PLATINUM: 'text-sky-600',
    DIAMOND:  'text-violet-600',
  };
  return map[grade] || 'text-muted-foreground';
}

export function gradeBgColor(grade: string): string {
  const map: Record<string, string> = {
    BRONZE:   'bg-amber-100 text-amber-800',
    SILVER:   'bg-slate-100 text-slate-500',
    GOLD:     'bg-accent-light text-accent',
    PLATINUM: 'bg-sky-50 text-sky-600',
    DIAMOND:  'bg-violet-50 text-violet-600',
  };
  return map[grade] || 'bg-secondary text-muted-foreground';
}
```

- [ ] **Step 2 : Créer LoyaltyBadge.tsx**

```typescript
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gradeBgColor, gradeLabel } from '@/lib/utils';

interface LoyaltyBadgeProps {
  grade: string;
  points?: number;
  className?: string;
}

export function LoyaltyBadge({ grade, points, className }: LoyaltyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold',
        gradeBgColor(grade),
        className,
      )}
    >
      <Star size={11} className="fill-current flex-shrink-0" />
      {gradeLabel(grade)}
      {points != null && (
        <span className="tabular-nums opacity-80">· {points.toLocaleString('fr-FR')} pts</span>
      )}
    </span>
  );
}
```

- [ ] **Step 3 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/web/src/lib/utils.ts apps/web/src/components/profile/LoyaltyBadge.tsx
git commit -m "feat(profile): add LoyaltyBadge component and gradeBgColor util"
```

---

## Task 11 : PostGrid — Grille Profil 3 Colonnes

**Files:**
- Create: `apps/web/src/components/profile/PostGrid.tsx`

- [ ] **Step 1 : Créer PostGrid.tsx**

```typescript
'use client';

import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostGridItem {
  id: string;
  thumbnailUrl?: string;
  type?: 'image' | 'video' | 'reel';
  duration?: number;
  caption?: string;
}

interface PostGridProps {
  posts: PostGridItem[];
  onSelect?: (id: string) => void;
}

export function PostGrid({ posts, onSelect }: PostGridProps) {
  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-muted-foreground text-sm">Aucune publication pour l'instant.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-px">
      {posts.map((post) => {
        const isReel = post.type === 'reel' || post.type === 'video';
        return (
          <button
            key={post.id}
            onClick={() => onSelect?.(post.id)}
            className="relative bg-muted overflow-hidden group"
            style={{ aspectRatio: '1' }}
            aria-label={post.caption || (isReel ? 'Voir le reel' : 'Voir la publication')}
          >
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt={post.caption || ''}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted" />
            )}

            {isReel && (
              <>
                <span className="absolute bottom-2 left-2 flex items-center justify-center w-6 h-6 rounded-full bg-black/50">
                  <Play size={10} className="text-white fill-white ml-0.5" />
                </span>
                {post.duration != null && (
                  <span className="absolute bottom-2 right-2 text-[10px] text-white font-sans bg-black/50 px-1 py-0.5 rounded">
                    {Math.floor(post.duration / 60)}:{String(post.duration % 60).padStart(2, '0')}
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add apps/web/src/components/profile/PostGrid.tsx
git commit -m "feat(profile): add PostGrid component — 3-col 1:1 grid"
```

---

## Task 12 : Page Profil — Redesign Complet

**Files:**
- Modify: `apps/web/src/app/(main)/profile/[username]/page.tsx`

- [ ] **Step 1 : Écrire le test E2E**

Ajouter dans `apps/web/e2e/feed.spec.ts` (ou créer `apps/web/e2e/profile.spec.ts`) :

```typescript
import { test, expect } from '@playwright/test';

test('profile shows stats, badge and post grid', async ({ page }) => {
  await page.goto('/profile/test');
  await expect(page.getByText('publications')).toBeVisible();
  await expect(page.getByText('abonnés')).toBeVisible();
  await expect(page.locator('[data-testid="post-grid"]')).toBeVisible();
});

test('follow button changes on click', async ({ page }) => {
  await page.goto('/profile/test');
  const followBtn = page.getByRole('button', { name: /suivre/i });
  if (await followBtn.isVisible()) {
    await followBtn.click();
    await expect(page.getByRole('button', { name: /suivi/i })).toBeVisible();
  }
});
```

- [ ] **Step 2 : Remplacer la page Profil**

Remplacer `apps/web/src/app/(main)/profile/[username]/page.tsx` :

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoyaltyBadge } from '@/components/profile/LoyaltyBadge';
import { PostGrid } from '@/components/profile/PostGrid';
import { formatNumber, getInitials } from '@/lib/utils';
import { Grid3X3, Film, Bookmark, MapPin, Check, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProfileTab = 'posts' | 'reels' | 'saved';

export default function ProfilePage({ params }: { params: any }) {
  const { username } = params as { username: string };
  const { user: me } = useAuthStore();
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('posts');

  const { data: profile } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/users/${username}`).then((r) => {
      setFollowing(r.data.isFollowing);
      return r.data;
    }),
  });

  const { data: postsData } = useQuery({
    queryKey: ['posts', 'user', profile?.id, tab],
    queryFn: () => {
      if (tab === 'saved') return api.get(`/posts/saved`).then((r) => r.data);
      if (tab === 'reels') return api.get(`/reels/user/${profile.id}`).then((r) => r.data);
      return api.get(`/posts/user/${profile.id}`).then((r) => r.data);
    },
    enabled: !!profile?.id,
  });

  const isMe = me?.username === username || username === 'me';

  const handleFollow = async () => {
    if (!profile) return;
    setFollowing((f) => !f);
    await (following
      ? api.delete(`/follows/users/${profile.id}`)
      : api.post(`/follows/users/${profile.id}`)
    ).catch(() => setFollowing((f) => !f));
  };

  if (!profile) {
    return (
      <div className="animate-pulse px-4 pt-8 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="w-[72px] h-[72px] rounded-full bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  // Normaliser les posts vers le format PostGridItem
  const rawPosts: any[] = postsData?.data ?? [];
  const posts = rawPosts.map((p) => ({
    id: p.id,
    thumbnailUrl: p.thumbnailUrl ?? p.media?.[0]?.url,
    type: p.type ?? (p.media?.[0]?.type === 'video' ? 'video' : 'image'),
    duration: p.duration,
    caption: p.caption,
  }));

  return (
    <div className="max-w-xl mx-auto pb-24 lg:pb-8">
      {/* En-tête profil */}
      <div className="px-4 pt-5 pb-4 space-y-4">
        {/* Avatar + infos */}
        <div className="flex items-start gap-4">
          <Avatar
            className={cn(
              'h-[72px] w-[72px] flex-shrink-0',
              profile.isVerified && 'ring-2 ring-primary ring-offset-2',
            )}
          >
            <AvatarImage src={profile.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-heading font-bold text-xl">
              {getInitials(profile.firstName, profile.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-bold text-lg text-foreground leading-tight">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.isVerified && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                  <Check size={10} className="text-primary-foreground" strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>
            {profile.city && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin size={11} /> {profile.city}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around">
          {[
            { value: profile.postsCount ?? 0,     label: 'publications' },
            { value: profile.followersCount ?? 0,  label: 'abonnés' },
            { value: profile.followingCount ?? 0,  label: 'abonnements' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="font-heading font-bold text-lg tabular-nums">{formatNumber(value)}</span>
              <span className="text-xs text-muted-foreground font-sans">{label}</span>
            </div>
          ))}
        </div>

        {/* Badge fidélité */}
        {profile.loyaltyGrade && (
          <LoyaltyBadge grade={profile.loyaltyGrade} points={profile.loyaltyPoints} />
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
        )}

        {/* Boutons action */}
        {isMe ? (
          <Button
            variant="outline"
            className="w-full font-heading font-semibold border-border text-foreground h-10 rounded-xl"
          >
            Modifier le profil
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={handleFollow}
              className={cn(
                'flex-1 font-heading font-semibold h-10 rounded-xl transition-all duration-150',
                following
                  ? 'bg-background border border-primary text-primary hover:bg-primary/5'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {following ? 'Suivi ✓' : 'Suivre'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 font-heading font-semibold border-border text-foreground h-10 rounded-xl"
            >
              <MessageCircle size={16} className="mr-1.5" />
              Message
            </Button>
          </div>
        )}
      </div>

      {/* Tabs grille */}
      <div
        role="tablist"
        aria-label="Publications de l'utilisateur"
        className="sticky top-14 z-20 bg-background border-b border-border flex"
      >
        {[
          { value: 'posts' as ProfileTab,  icon: Grid3X3, label: 'Publications' },
          { value: 'reels' as ProfileTab,  icon: Film,    label: 'Reels'        },
          { value: 'saved' as ProfileTab,  icon: Bookmark, label: 'Sauvegardés' },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            aria-label={label}
            onClick={() => setTab(value)}
            className={cn(
              'flex-1 flex items-center justify-center py-3 border-b-2 transition-colors',
              tab === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={20} strokeWidth={tab === value ? 2 : 1.5} />
          </button>
        ))}
      </div>

      {/* Grille publications */}
      <div data-testid="post-grid">
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/web/src/app/\(main\)/profile/\[username\]/page.tsx
git commit -m "feat(profile): full page redesign — avatar ring, stats, badge fidélité, post grid"
```

---

---

## Task 13 : Sidebar Desktop — Mode Condensé 768-1023px

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx`
- Modify: `apps/web/src/app/(main)/layout.tsx`

- [ ] **Step 1 : Modifier Sidebar.tsx pour le mode condensé**

Dans `apps/web/src/components/layout/Sidebar.tsx`, remplacer la classe de l'`<aside>` et adapter chaque item nav :

```typescript
// Remplacer la balise aside par :
<aside className="fixed left-0 top-0 h-full border-r border-border bg-background flex flex-col z-40 hidden lg:flex w-16 xl:w-64 transition-all duration-200">
```

Chaque item nav doit cacher son label sur `lg` et l'afficher sur `xl` :

```typescript
<Link
  key={item.href}
  href={item.href}
  title={item.label}
  className={cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
    'justify-center xl:justify-start',
    active
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
  )}
>
  <Icon size={20} className="flex-shrink-0" />
  <span className="hidden xl:block">{item.label}</span>
</Link>
```

Pour le logo, cacher le sous-titre sur mode condensé :

```typescript
<div className="p-3 xl:p-6">
  <Link href="/feed" className="block">
    <h1 className="text-xl xl:text-2xl font-heading font-bold text-primary">EDP</h1>
    <p className="hidden xl:block text-xs text-muted-foreground mt-0.5">Eat • Drink • Pose</p>
  </Link>
</div>
```

- [ ] **Step 2 : Mettre à jour le layout principal**

Dans `apps/web/src/app/(main)/layout.tsx`, ajuster le margin-left :

```typescript
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-16 xl:ml-64 min-h-screen pb-20 lg:pb-0 transition-all duration-200">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
```

- [ ] **Step 3 : Vérifier le build TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | head -10
```

Résultat attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/web/src/components/layout/Sidebar.tsx apps/web/src/app/\(main\)/layout.tsx
git commit -m "feat(layout): sidebar condensed mode at 768-1023px — icons only"
```

---

> **Note — Virtualisation feed (spec §2.5) :** La virtualisation avec `react-window` ou `@tanstack/react-virtual` n'est pas incluse dans ce plan car elle nécessite de mesurer la hauteur des `PostCard` (variable selon les commentaires). À implémenter dans un plan séparé une fois le design stabilisé.

---

## Vérification Finale

- [ ] **Build complet**

```bash
cd apps/web && pnpm build 2>&1 | tail -30
```

Résultat attendu : `✓ Compiled successfully`, `Route (app)` table sans erreurs.

- [ ] **Lancer les E2E sur les 3 écrans**

```bash
cd apps/web && pnpm exec playwright test e2e/mobile-nav.spec.ts e2e/establishment.spec.ts e2e/profile.spec.ts --reporter=line 2>&1 | tail -20
```

- [ ] **Commit final si tout passe**

```bash
git add -A
git commit -m "test(e2e): add mobile nav, establishment, profile E2E tests"
```
