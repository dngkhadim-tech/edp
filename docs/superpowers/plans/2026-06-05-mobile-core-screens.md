# Mobile Core Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réécrire les composants feed (PostCard, CategoryPills, ReelsRow), le Feed screen, l'EstablishmentCard, l'Explore screen, et la fiche Établissement mobile en thème light/rose spec-conforme.

**Architecture:** Nouveaux composants isolés dans `src/components/feed/` et `src/components/establishment/`. Chaque composant importe exclusivement depuis `src/constants/theme.ts` et `src/constants/fonts.ts`. Les screens consomment ces composants via les imports relatifs habituels d'expo-router.

**Tech Stack:** React Native 0.74, Expo 51, expo-image, expo-linear-gradient, lucide-react-native, @tanstack/react-query, TypeScript 5.5

---

## File Map

| Action | Fichier | Rôle |
|---|---|---|
| Create | `apps/mobile/src/components/feed/CategoryPills.tsx` | Pills horizontales filtre feed/explore |
| Create | `apps/mobile/src/components/feed/ReelsRow.tsx` | Rangée Reels horizontale 9:16 |
| Modify | `apps/mobile/src/components/feed/PostCard.tsx` | Réécriture complète light/rose, 4:5, badge, animations |
| Create | `apps/mobile/src/components/establishment/EstablishmentCard.tsx` | Card établissement 4:3 pour grilles |
| Modify | `apps/mobile/app/(tabs)/feed.tsx` | Header EDP, CategoryPills, PostCard, ReelsRow |
| Modify | `apps/mobile/app/(tabs)/explore.tsx` | Header, SearchBar debounce, CategoryPills, EstablishmentCard 2-col |
| Modify | `apps/mobile/app/establishment/[slug].tsx` | Réécriture complète light/rose, hero 4:3, CTA, tabs |

---

## Task 1 : CategoryPills component

**Files:**
- Create: `apps/mobile/src/components/feed/CategoryPills.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
import React from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

export interface PillOption {
  value: string;
  label: string;
}

interface Props {
  options: PillOption[];
  value: string;
  onChange: (v: string) => void;
}

export function CategoryPills({ options, value, onChange }: Props) {
  return (
    <FlatList
      data={options}
      keyExtractor={(item) => item.value}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const active = item.value === value;
        return (
          <TouchableOpacity
            onPress={() => onChange(item.value)}
            style={[styles.pill, active && styles.pillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontFamily: fonts.body.medium,
    fontSize: 13,
    color: colors.muted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
```

- [ ] **Step 2 : TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i "error TS" | head -10
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/src/components/feed/CategoryPills.tsx && git commit -m "feat(mobile): add CategoryPills component"
```

---

## Task 2 : ReelsRow component

**Files:**
- Create: `apps/mobile/src/components/feed/ReelsRow.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

export interface Reel {
  id: string;
  thumbnail?: string;
  duration?: string;
}

interface Props {
  reels: Reel[];
}

const CARD_WIDTH = 100;
const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

export function ReelsRow({ reels }: Props) {
  const router = useRouter();
  if (reels.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Reels</Text>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/reels')}
            accessibilityLabel="Voir le reel"
            activeOpacity={0.85}
          >
            {item.thumbnail ? (
              <Image source={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
            )}
            <View style={styles.overlay} />
            <View style={styles.playBtn}>
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            {item.duration && (
              <Text style={styles.duration}>{item.duration}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginVertical: spacing.md },
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: 16,
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  placeholder: { backgroundColor: colors.surface },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -14 }, { translateY: -14 }],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.body.regular,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
```

- [ ] **Step 2 : TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i "error TS" | head -10
```

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/src/components/feed/ReelsRow.tsx && git commit -m "feat(mobile): add ReelsRow component"
```

---

## Task 3 : PostCard redesign

**Files:**
- Modify: `apps/mobile/src/components/feed/PostCard.tsx`

- [ ] **Step 1 : Remplacer entièrement le fichier**

```tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { formatNumber, timeAgo } from '../../lib/utils';
import { colors, spacing, radius } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_HEIGHT = SCREEN_WIDTH * (5 / 4);

export interface Post {
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
  author?: { firstName?: string; lastName?: string; avatar?: string; username?: string; name?: string };
}

interface Props { post: Post }

export function PostCard({ post }: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSaved);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const author = post.author;
  const authorName = author
    ? (`${author.firstName || ''} ${author.lastName || ''}`.trim() || author.name || 'EDP')
    : 'EDP';
  const initials = authorName.slice(0, 2).toUpperCase();
  const mediaItem = post.media?.[0];

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => next ? c + 1 : c - 1);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, damping: 15, stiffness: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
    ]).start();
    await api.post(`/posts/${post.id}/like`).catch(() => {
      setLiked(!next);
      setLikesCount((c) => next ? c - 1 : c + 1);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => author?.username && router.push(`/profile/${author.username}` as any)}
        >
          {author?.avatar ? (
            <Image source={author.avatar} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Options" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MoreHorizontal size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Media 4:5 */}
      {mediaItem && (
        <View style={styles.mediaContainer}>
          <Image source={mediaItem.url} style={styles.media} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.25)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {post.establishment && (
            <TouchableOpacity
              style={styles.badge}
              onPress={() => router.push(`/establishment/${post.establishment!.slug}` as any)}
            >
              <MapPin size={11} color={colors.primary} />
              <Text style={styles.badgeText} numberOfLines={1}>{post.establishment.name}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={handleLike}
            accessibilityLabel={liked ? "Je n'aime plus" : "J'aime"}
            style={styles.actionItem}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Heart size={24} color={liked ? colors.primary : colors.muted} fill={liked ? colors.primary : 'none'} />
            </Animated.View>
            <Text style={styles.actionCount}>{formatNumber(likesCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/post/${post.id}` as any)}
            style={styles.actionItem}
            accessibilityLabel="Commentaires"
          >
            <MessageCircle size={22} color={colors.muted} />
            <Text style={styles.actionCount}>{formatNumber(post.commentsCount)}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => setSaved((v) => !v)}
          accessibilityLabel={saved ? 'Retirer des sauvegardes' : 'Sauvegarder'}
        >
          <Bookmark size={20} color={saved ? colors.primary : colors.muted} fill={saved ? colors.primary : 'none'} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {post.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            <Text style={styles.captionAuthor}>{authorName} </Text>
            {post.caption}
          </Text>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <Text style={styles.hashtags} numberOfLines={1}>
            {post.hashtags.map((t) => `#${t}`).join(' ')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontFamily: fonts.heading.semibold, fontSize: 13, color: colors.primary },
  authorName: { fontFamily: fonts.heading.semibold, fontSize: 14, color: colors.foreground },
  timestamp: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted, marginTop: 1 },
  mediaContainer: { width: SCREEN_WIDTH, height: PHOTO_HEIGHT, backgroundColor: colors.surface, overflow: 'hidden' },
  media: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    bottom: spacing.sm + 4,
    left: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    maxWidth: 160,
  },
  badgeText: { fontFamily: fonts.heading.semibold, fontSize: 11, color: colors.foreground, flex: 1 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontFamily: fonts.body.medium, fontSize: 13, color: colors.muted },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 4 },
  caption: { fontFamily: fonts.body.regular, fontSize: 13, color: colors.foreground, lineHeight: 18 },
  captionAuthor: { fontFamily: fonts.heading.semibold, fontSize: 13, color: colors.foreground },
  hashtags: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.primary },
});
```

- [ ] **Step 2 : TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i "error TS" | head -10
```

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/src/components/feed/PostCard.tsx && git commit -m "feat(mobile): redesign PostCard — light theme, 4:5 ratio, badge, spring animation"
```

---

## Task 4 : EstablishmentCard component

**Files:**
- Create: `apps/mobile/src/components/establishment/EstablishmentCard.tsx`

- [ ] **Step 1 : Créer le répertoire et le fichier**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Star, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  banner?: string | null;
  type: string;
  averageRating: number;
  city: string;
  country: string;
  reviewsCount?: number;
  isOpen?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  HOTEL: 'Hôtel',
  BAR: 'Bar',
  CAFE: 'Café',
  TOURIST_SPOT: 'Tourisme',
  EXPERIENCE: 'Expérience',
};

interface Props { establishment: Establishment }

export function EstablishmentCard({ establishment: est }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/establishment/${est.slug}` as any)}
      activeOpacity={0.9}
    >
      <View style={styles.photo}>
        {est.banner ? (
          <Image source={est.banner} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.photoPlaceholder]}>
            <Text style={styles.photoInitial}>{est.name?.[0]}</Text>
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[est.type] ?? est.type}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{est.name}</Text>
        <View style={styles.row}>
          <Star size={13} color={colors.accent} fill={colors.accent} />
          <Text style={styles.rating}>{Number(est.averageRating).toFixed(1)}</Text>
          {est.reviewsCount != null && (
            <Text style={styles.reviewCount}>({est.reviewsCount})</Text>
          )}
        </View>
        <View style={styles.row}>
          <MapPin size={11} color={colors.muted} />
          <Text style={styles.city} numberOfLines={1}>{est.city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  photo: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.surface,
  },
  photoPlaceholder: {
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: { fontFamily: fonts.heading.black, fontSize: 28, color: `${colors.primary}50` },
  typeBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  typeBadgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: fonts.body.medium },
  content: { padding: spacing.sm + 2, gap: 3 },
  name: { fontFamily: fonts.heading.bold, fontSize: 14, color: colors.foreground },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontFamily: fonts.heading.semibold, fontSize: 12, color: colors.accent },
  reviewCount: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted },
  city: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted, flex: 1 },
});
```

- [ ] **Step 2 : TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i "error TS" | head -10
```

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/src/components/establishment/EstablishmentCard.tsx && git commit -m "feat(mobile): add EstablishmentCard component — 4:3, badge, gold stars"
```

---

## Task 5 : Feed screen redesign

**Files:**
- Modify: `apps/mobile/app/(tabs)/feed.tsx`

- [ ] **Step 1 : Remplacer entièrement le fichier**

```tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, RefreshControl, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Search } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { PostCard, type Post } from '../../src/components/feed/PostCard';
import { CategoryPills, type PillOption } from '../../src/components/feed/CategoryPills';
import { ReelsRow, type Reel } from '../../src/components/feed/ReelsRow';
import { colors, spacing } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

const PILLS: PillOption[] = [
  { value: '', label: 'Tout' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'BAR', label: 'Bar' },
  { value: 'HOTEL', label: 'Hôtel' },
  { value: 'CAFE', label: 'Café' },
];

const REELS_AFTER = 3;

export default function FeedScreen() {
  const [category, setCategory] = useState('');

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch,
  } = useInfiniteQuery({
    queryKey: ['mobile-feed', category],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/feed?page=${pageParam}&limit=10${category ? `&type=${category}` : ''}`).then((r) => r.data),
    getNextPageParam: (last) => last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  const { data: reelsData } = useQuery<Reel[]>({
    queryKey: ['mobile-reels-preview'],
    queryFn: () => api.get('/reels?limit=6').then((r) => r.data?.data ?? []),
  });

  const posts: Post[] = data?.pages.flatMap((p) => p.data) ?? [];
  const reels: Reel[] = reelsData ?? [];

  const renderItem = useCallback(({ item, index }: { item: Post; index: number }) => (
    <>
      <PostCard post={item} />
      {index === REELS_AFTER - 1 && reels.length > 0 && (
        <ReelsRow reels={reels} />
      )}
    </>
  ), [reels]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>EDP</Text>
        <View style={styles.icons}>
          <Bell size={22} color={colors.muted} />
          <Search size={22} color={colors.muted} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <CategoryPills options={PILLS} value={category} onChange={setCategory} />
          }
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={colors.primary} style={{ padding: spacing.md }} />
              : null
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { fontFamily: fonts.heading.black, fontSize: 22, color: colors.primary, letterSpacing: 2 },
  icons: { flexDirection: 'row', gap: spacing.md },
  skeletonWrap: { padding: spacing.md, gap: spacing.md },
  skeleton: { height: 300, backgroundColor: colors.surface, borderRadius: 12 },
});
```

- [ ] **Step 2 : TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i "error TS" | head -10
```

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/\(tabs\)/feed.tsx && git commit -m "feat(mobile/feed): header EDP, CategoryPills, PostCard, ReelsRow — light theme"
```

---

## Task 6 : Explore screen redesign

**Files:**
- Modify: `apps/mobile/app/(tabs)/explore.tsx`

- [ ] **Step 1 : Remplacer entièrement le fichier**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, SearchX } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { EstablishmentCard, type Establishment } from '../../src/components/establishment/EstablishmentCard';
import { CategoryPills, type PillOption } from '../../src/components/feed/CategoryPills';
import { colors, spacing, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

const TYPES: PillOption[] = [
  { value: '', label: 'Tout' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'BAR', label: 'Bar' },
  { value: 'HOTEL', label: 'Hôtel' },
  { value: 'CAFE', label: 'Café' },
  { value: 'TOURIST_SPOT', label: 'À visiter' },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['mobile-establishments', debouncedSearch, type],
    queryFn: () =>
      api.get('/establishments/search', { params: { q: debouncedSearch, type, limit: 20 } })
        .then((r) => r.data),
  });

  const items: Establishment[] = data?.data ?? [];

  const renderItem = useCallback(({ item }: { item: Establishment }) => (
    <View style={styles.cardWrap}>
      <EstablishmentCard establishment={item} />
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Découvrir</Text>
        <TouchableOpacity accessibilityLabel="Filtres avancés" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <SlidersHorizontal size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Search size={16} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Restaurants, bars, hôtels..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
        />
      </View>

      <CategoryPills options={TYPES} value={type} onChange={setType} />

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeleton} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <SearchX size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>
            {debouncedSearch ? `Aucun résultat pour «${debouncedSearch}»` : 'Aucun établissement'}
          </Text>
          <Text style={styles.emptySubtitle}>Essayez un autre mot-clé ou changez les filtres</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.heading.bold, fontSize: 18, color: colors.foreground },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: 15,
    color: colors.foreground,
  },
  row: { paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.md },
  cardWrap: { flex: 1 },
  listContent: { paddingTop: spacing.sm, paddingBottom: 80 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.md },
  skeleton: { width: '47%', aspectRatio: 3 / 4, backgroundColor: colors.surface, borderRadius: radius.card },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontFamily: fonts.heading.semibold, fontSize: 16, color: colors.foreground, textAlign: 'center' },
  emptySubtitle: { fontFamily: fonts.body.regular, fontSize: 13, color: colors.muted, textAlign: 'center' },
});
```

- [ ] **Step 2 : TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i "error TS" | head -10
```

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/\(tabs\)/explore.tsx && git commit -m "feat(mobile/explore): redesign — header, debounced search, CategoryPills, 2-col grid"
```

---

## Task 7 : Establishment detail screen redesign

**Files:**
- Modify: `apps/mobile/app/establishment/[slug].tsx`

- [ ] **Step 1 : Remplacer entièrement le fichier**

```tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Star, MapPin, Navigation, Bookmark, MoreHorizontal,
} from 'lucide-react-native';
import { colors, spacing, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';
import { formatNumber } from '../../src/lib/utils';

const { width: W } = Dimensions.get('window');
const HERO_HEIGHT = W * (3 / 4);

type Tab = 'about' | 'reviews' | 'menu';

export default function EstablishmentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('about');

  const { data: est, isLoading } = useQuery({
    queryKey: ['establishment', slug],
    queryFn: () => api.get(`/establishments/${slug}`).then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', est?.id],
    queryFn: () => api.get(`/reviews/establishment/${est.id}?limit=3`).then((r) => r.data),
    enabled: !!est?.id,
  });

  if (isLoading || !est) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const avgRating: number = est.avgRating ?? est.averageRating ?? 0;
  const reviewsCount: number = est.reviewsCount ?? reviews?.meta?.total ?? 0;
  const isOpen: boolean = est.isOpen ?? false;

  const openMaps = () => {
    const query = encodeURIComponent(`${est.name} ${est.city ?? ''}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'about', label: 'À propos' },
    { key: 'reviews', label: 'Avis' },
    { key: 'menu', label: 'Menu' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Hero 4:3 */}
        <View style={styles.hero}>
          {est.banner ? (
            <Image source={est.banner} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroPH]}>
              <Text style={styles.heroPHText}>{est.name?.[0]}</Text>
            </View>
          )}
          {/* Back + actions overlay */}
          <View style={[styles.heroOverlay, { paddingTop: insets.top + spacing.sm }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.heroBtn}
              accessibilityLabel="Retour"
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.heroRight}>
              <TouchableOpacity style={styles.heroBtn} accessibilityLabel="Sauvegarder">
                <Bookmark size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBtn} accessibilityLabel="Plus d'options">
                <MoreHorizontal size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Identity block */}
        <View style={styles.identity}>
          <Text style={styles.name}>{est.name}</Text>

          {avgRating > 0 && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  color={colors.accent}
                  fill={s <= Math.round(avgRating) ? colors.accent : 'none'}
                />
              ))}
              <Text style={styles.ratingVal}>{avgRating.toFixed(1)}</Text>
              {reviewsCount > 0 && (
                <Text style={styles.ratingCount}>({formatNumber(reviewsCount)} avis)</Text>
              )}
            </View>
          )}

          <View style={styles.metaRow}>
            {est.type && <Text style={styles.metaText}>{est.type}</Text>}
            {est.city && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={colors.muted} />
                <Text style={styles.metaText}>{est.city}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              {isOpen ? (
                <>
                  <View style={styles.openDot} />
                  <Text style={[styles.metaText, { color: colors.success }]}>
                    Ouvert{est.closingTime ? ` · Ferme à ${est.closingTime}` : ''}
                  </Text>
                </>
              ) : (
                <Text style={[styles.metaText, { color: colors.destructive }]}>Fermé</Text>
              )}
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.ctaPrimary} accessibilityLabel="Réserver">
              <Text style={styles.ctaPrimaryText}>Réserver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaOutline} onPress={openMaps} accessibilityLabel="Itinéraire">
              <Navigation size={16} color={colors.foreground} />
              <Text style={styles.ctaOutlineText}>Itinéraire</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, tab === key && styles.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {tab === 'about' && (
            <View style={styles.section}>
              {est.description ? (
                <Text style={styles.description}>{est.description}</Text>
              ) : (
                <Text style={styles.emptyText}>Aucune description disponible.</Text>
              )}
            </View>
          )}

          {tab === 'reviews' && (
            <View style={styles.section}>
              {reviews?.data?.length > 0 ? (
                reviews.data.map((r: any) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewAuthor}>
                        {r.user?.firstName} {r.user?.lastName}
                      </Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            color={colors.accent}
                            fill={s <= r.rating ? colors.accent : 'none'}
                          />
                        ))}
                      </View>
                    </View>
                    {r.comment && (
                      <Text style={styles.reviewText} numberOfLines={3}>{r.comment}</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Aucun avis pour le moment.</Text>
              )}
            </View>
          )}

          {tab === 'menu' && (
            <View style={styles.section}>
              {est.menu?.length > 0 ? (
                est.menu.map((section: any) => (
                  <View key={section.name} style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>{section.name}</Text>
                    {section.items?.map((item: any) => (
                      <View key={item.name} style={styles.menuItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.menuItemName}>{item.name}</Text>
                          {item.description && (
                            <Text style={styles.menuItemDesc} numberOfLines={1}>{item.description}</Text>
                          )}
                        </View>
                        {item.price && (
                          <Text style={styles.menuItemPrice}>{item.price}€</Text>
                        )}
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Menu non disponible.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  hero: { width: W, height: HERO_HEIGHT, backgroundColor: colors.surface },
  heroPH: { backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  heroPHText: { fontFamily: fonts.heading.black, fontSize: 64, color: `${colors.primary}40` },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  heroBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRight: { flexDirection: 'row', gap: spacing.sm },
  identity: { padding: spacing.md, gap: spacing.sm },
  name: { fontFamily: fonts.heading.black, fontSize: 24, color: colors.foreground },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingVal: { fontFamily: fonts.heading.bold, fontSize: 13, color: colors.foreground, marginLeft: 4 },
  ratingCount: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.muted },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.body.regular, fontSize: 13, color: colors.muted },
  openDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  ctaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  ctaPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: { fontFamily: fonts.heading.bold, fontSize: 15, color: '#FFFFFF' },
  ctaOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ctaOutlineText: { fontFamily: fonts.heading.bold, fontSize: 15, color: colors.foreground },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontFamily: fonts.heading.semibold, fontSize: 14, color: colors.muted },
  tabTextActive: { color: colors.primary },
  tabContent: { minHeight: 200 },
  section: { padding: spacing.md, gap: spacing.md },
  description: { fontFamily: fonts.body.regular, fontSize: 14, color: colors.foreground, lineHeight: 22 },
  emptyText: { fontFamily: fonts.body.regular, fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: spacing.xl },
  reviewCard: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.md, gap: spacing.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewAuthor: { fontFamily: fonts.heading.semibold, fontSize: 13, color: colors.foreground },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontFamily: fonts.body.regular, fontSize: 13, color: colors.muted, lineHeight: 18 },
  menuSection: { gap: spacing.sm },
  menuSectionTitle: { fontFamily: fonts.heading.bold, fontSize: 15, color: colors.foreground },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  menuItemName: { fontFamily: fonts.body.medium, fontSize: 14, color: colors.foreground },
  menuItemDesc: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  menuItemPrice: { fontFamily: fonts.heading.semibold, fontSize: 14, color: colors.foreground },
});
```

- [ ] **Step 2 : TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i "error TS" | head -10
```

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/establishment/\[slug\].tsx && git commit -m "feat(mobile/establishment): redesign detail — hero 4:3, identity, CTA, tabs light theme"
```

---

## Self-Review

### Couverture spec

| Requirement | Task |
|---|---|
| PostCard : photo ratio 4:5 | T3 |
| PostCard : LinearGradient overlay transparent→rgba(0,0,0,0.25) | T3 |
| PostCard : badge établissement bas-gauche, rgba(255,255,255,0.85) + MapPin | T3 |
| PostCard : Avatar 36px + nom + timestamp | T3 |
| PostCard : Heart animé Animated.spring damping 15 stiffness 200 | T3 |
| PostCard : Bookmark colors.primary si sauvegardé | T3 |
| PostCard : expo-image contentFit="cover" | T3 |
| CategoryPills : FlatList horizontal, active bg primary/text blanc | T1 |
| CategoryPills : accessibilityRole + accessibilityState | T1 |
| ReelsRow : FlatList horizontal, cards 100×178 9:16, Play centré | T2 |
| ReelsRow : durée bas-droite, overlay sombre | T2 |
| EstablishmentCard : photo 4:3, badge type bottom-left, étoiles accent | T4 |
| EstablishmentCard : expo-image + shadows.card | T4 |
| Feed : header EDP logo primary + Bell + Search | T5 |
| Feed : CategoryPills + insertions ReelsRow après 3ème post | T5 |
| Feed : skeleton 3 placeholders pendant loading | T5 |
| Feed : RefreshControl tintColor primary | T5 |
| Explore : header + SlidersHorizontal | T6 |
| Explore : TextInput debounce 300ms | T6 |
| Explore : CategoryPills types établissement | T6 |
| Explore : FlatList 2 colonnes + EstablishmentCard | T6 |
| Explore : empty state SearchX + messages | T6 |
| Établissement : hero Image 4:3 expo-image | T7 |
| Établissement : back + bookmark + more overlay | T7 |
| Établissement : nom Outfit black 24, étoiles accent, badge ouvert/fermé | T7 |
| Établissement : CTA Réserver (primary) + Itinéraire (outline) | T7 |
| Établissement : tabs À propos / Avis / Menu, indicateur primary | T7 |
| Aucun hex en dur dans composants (sauf rgba et overlays) | T1-T7 |
| accessibilityLabel sur boutons icône-only | T2-T7 |

### Placeholder scan : aucun TBD/TODO.

### Cohérence types :
- `Post` interface exportée depuis `PostCard.tsx`, importée par `feed.tsx`
- `Reel` interface exportée depuis `ReelsRow.tsx`, importée par `feed.tsx`
- `PillOption` exportée depuis `CategoryPills.tsx`, importée par `feed.tsx` et `explore.tsx`
- `Establishment` exportée depuis `EstablishmentCard.tsx`, importée par `explore.tsx`
- `colors.accent` pour étoiles (T4, T7) — défini dans `theme.ts` Task 1 précédent
- `shadows.card` utilisé dans EstablishmentCard (T4) — défini dans `theme.ts`
