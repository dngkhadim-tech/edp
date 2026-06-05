# EDP Mobile — Core Screens Design Spec (P3)

**Date :** 2026-06-05
**Périmètre :** PostCard, CategoryPills, ReelsRow, Feed screen, EstablishmentCard, Explore screen, Établissement detail
**Référence design system :** `docs/superpowers/specs/2026-06-04-edp-design.md`
**Tokens :** `src/constants/theme.ts` + `src/constants/fonts.ts`

---

## 1. Composants Feed

### 1.1 PostCard — `src/components/feed/PostCard.tsx`

Structure :
```
View container (bg: colors.card, mb: 8, borderBottom: colors.border)
  Header (px 12, py 10)
    Avatar 32px + Nom auteur (fonts.heading.semibold 14) + timestamp (muted 11)
    MoreHorizontal icon (colors.muted)

  Photo (ratio 4:5, borderRadius 16 top only)
    expo-image contentFit="cover"
    LinearGradient overlay: transparent → rgba(0,0,0,0.25) (bottom 40%)
    Badge établissement bas-gauche :
      bg rgba(255,255,255,0.85), blur, rounded-full
      MapPin 11px (colors.primary) + nom tronqué max 140px

  Actions (px 12, py 10, row)
    Heart (24, animé scale 1→1.3→1 via Animated.spring) → colors.primary si liké
    MessageCircle (22)
    Bookmark (20, colors.primary si sauvegardé) → aligné à droite

  Content (px 12, pb 12)
    Caption 2 lignes max (DM Sans 400 13px)
    Hashtags (colors.primary 12px)
    Timestamp (colors.muted 11px)
```

Animations :
- Like : `Animated.spring(scale, { toValue: 1.3, ... })` suivi de `toValue: 1`, `useNativeDriver: true`
- Spring config : `{ damping: 15, stiffness: 200 }`

Props interface :
```ts
interface Post {
  id: string;
  media?: { url: string; type: 'image' | 'video' }[];
  caption?: string;
  hashtags?: string[];
  createdAt: string;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  isSaved: boolean;
  location?: string;
  establishment?: { slug: string; name: string };
  author?: { firstName: string; lastName: string; avatar?: string; username?: string };
  authorType?: 'USER' | 'ESTABLISHMENT';
}
```

### 1.2 CategoryPills — `src/components/feed/CategoryPills.tsx`

```
FlatList horizontal, showsHorizontalScrollIndicator={false}
  keyExtractor: item.value
  contentContainerStyle: paddingHorizontal 16, gap 8
  renderItem: pill TouchableOpacity
    Inactif : bg colors.surface, border colors.border, text colors.muted
    Actif : bg colors.primary, text #FFFFFF
    padding: 8 16, borderRadius: radius.pill, fontFamily: fonts.body.medium, fontSize 13
```

Options hardcodées :
```ts
[
  { value: '', label: 'Tout' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'BAR', label: 'Bar' },
  { value: 'HOTEL', label: 'Hôtel' },
  { value: 'CAFE', label: 'Café' },
]
```

Props : `value: string`, `onChange: (v: string) => void`

### 1.3 ReelsRow — `src/components/feed/ReelsRow.tsx`

```
Section header "Reels" (fonts.heading.bold 16, colors.foreground, px 16, mb 8)
FlatList horizontal, showsHorizontalScrollIndicator={false}
  contentContainerStyle: paddingHorizontal 16, gap 8
  Card : width 100, aspectRatio 9/16, borderRadius 12, overflow hidden
    expo-image contentFit="cover"
    Overlay foncé semi-transparent
    ▶ centré : View 28×28 bg rgba(0,0,0,0.45), borderRadius 14, Play icon 14px blanc
    Durée bas-droite : Text 10px blanc, bg rgba(0,0,0,0.55), px 4 py 1, borderRadius 4
```

Props : `reels: { id: string; thumbnail?: string; duration?: string }[]`

---

## 2. Feed Screen — `app/(tabs)/feed.tsx`

```
SafeAreaView (bg: colors.background)
  Header sticky
    "EDP" (fonts.heading.black 22, colors.primary, letterSpacing 2)
    Bell + Search icons (colors.muted, 22px)

  FlatList data={posts} (FlatList standard — FlashList non installé)
    ListHeaderComponent: CategoryPills + (après 3ème post) ReelsRow
    renderItem: PostCard
    onEndReached: fetchNextPage
    onEndReachedThreshold: 0.5
    refreshControl: RefreshControl tintColor={colors.primary}
    ListHeaderComponent: sticky via `stickyHeaderIndices={[0]}`

  Skeleton loading (3 placeholders animate-pulse bg: colors.surface)
```

Data : `useInfiniteQuery` sur `/feed?page=N&limit=10&type=CATEGORY`

Quand la catégorie change → reset la query + scroll en haut.

---

## 3. EstablishmentCard — `src/components/establishment/EstablishmentCard.tsx`

```
TouchableOpacity → router.push(`/establishment/${est.slug}`)
  View card (bg: colors.card, borderRadius: radius.card, overflow hidden, shadow: shadows.card)
    Image ratio 4:3 (expo-image contentFit="cover")
      Badge type : position absolute bottom-left
        bg rgba(0,0,0,0.65), rounded-full, text #FFF 10px, px 8 py 3
    Content (p 10, gap 4)
      Nom (fonts.heading.bold 14, colors.foreground, truncate 1 ligne)
      Row étoiles + note (Star 13px fill/text colors.accent) + nb avis (muted 11px)
      Row MapPin 11px + ville (muted 11px)
```

Props : même interface `Establishment` que le web.

---

## 4. Explore Screen — `app/(tabs)/explore.tsx`

```
SafeAreaView (bg: colors.background)
  Header sticky
    "Découvrir" (fonts.heading.bold 18, colors.foreground)
    SlidersHorizontal (colors.muted)

  SearchBar (TextInput, debounce 300ms)
    Search icon gauche, bg colors.surface, border colors.border, borderRadius radius.button
    h 44, px 12, fonts.body.regular 15

  CategoryPills (même composant partagé, remplacer type d'établissement)

  FlatList/FlashList 2 colonnes (numColumns 2, columnWrapperStyle: gap 12)
    EstablishmentCard par item
    Skeleton 6 placeholders pendant loading
    EmptyState si 0 résultats : SearchX 48px + message
```

Debounce : `useEffect` avec `setTimeout 300ms` sur la valeur de recherche → déclenche une nouvelle query.

---

## 5. Établissement Detail — `app/establishment/[slug].tsx`

```
View (flex 1, bg: colors.background)
  Scrollable :
    Hero image pleine largeur, ratio 4:3 (spec mobile)
      Image (expo-image contentFit="cover")
      Header overlay (position absolute top)
        ← Back (bg rgba(0,0,0,0.4) si non scrollé, bg colors.background si scrollé)
        Bookmark + More (mêmes états)

    Bloc identité (px 16, pt 16, gap 8)
      Nom (fonts.heading.black 24, colors.foreground)
      Étoiles + note + nb avis + ville
      Badge ouvert (point pulsant vert, colors.success) / fermé (colors.destructive)
      CTA Row : [Réserver] (flex:1, bg primary, h 48) + [Itinéraire] (flex:1, outline, h 48)

    Tabs sticky : À propos | Avis | Menu
      Indicateur : borderBottom 3px colors.primary
      bg: colors.background, borderBottom: colors.border

    Contenu tab actif
```

---

## 6. Checklist pré-livraison

- [ ] Tous les styles via `colors.*`, `spacing.*`, `radius.*`, `fonts.*`
- [ ] `expo-image` à la place de `Image` React Native (meilleures perfs)
- [ ] `accessibilityLabel` sur Heart, Bookmark, Back, + button
- [ ] `numberOfLines` sur les textes tronqués
- [ ] `keyExtractor` sur toutes les FlatList/FlashList
- [ ] Pas de `any` dans les interfaces de props
