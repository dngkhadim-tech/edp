# Mobile Messages · Profil · Reels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `messages.tsx` et `profile.tsx` vers le thème light EDP, nettoyer les types dans `reels.tsx`, et installer la dépendance manquante `lucide-react-native`.

**Architecture:** Chaque fichier tab est modifié en isolation. `gradeLabel` est déplacé dans `src/lib/utils.ts` avant la réécriture de `profile.tsx`. Aucun nouveau composant partagé — tout reste colocalisé. `lucide-react-native` est installé en Task 1 car toutes les screens existantes l'importent déjà.

**Tech Stack:** React Native 0.74, Expo 51, expo-image, lucide-react-native, @tanstack/react-query, react-native-safe-area-context, TypeScript 5.5

---

## File Map

| Action | Fichier | Rôle |
|---|---|---|
| Modify | `apps/mobile/package.json` | Ajouter lucide-react-native |
| Modify | `apps/mobile/src/lib/utils.ts` | Ajouter gradeLabel |
| Modify | `apps/mobile/app/(tabs)/messages.tsx` | Réécriture light theme |
| Modify | `apps/mobile/app/(tabs)/profile.tsx` | Réécriture light theme + spec complète |
| Modify | `apps/mobile/app/(tabs)/reels.tsx` | Types stricts, couleur hashtags |

---

## Task 1 : Installer lucide-react-native

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1 : Installer le package**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && pnpm add lucide-react-native
```

Expected : `lucide-react-native` ajouté dans `package.json` dependencies, pas d'erreur.

- [ ] **Step 2 : Vérifier l'installation**

```bash
ls /Users/khadimdiongue/edp/apps/mobile/node_modules/lucide-react-native
```

Expected : le répertoire existe.

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/package.json apps/mobile/pnpm-lock.yaml pnpm-lock.yaml && git commit -m "feat(mobile): install lucide-react-native"
```

---

## Task 2 : Ajouter gradeLabel dans utils.ts

**Files:**
- Modify: `apps/mobile/src/lib/utils.ts`

La fonction `gradeLabel` est déclarée localement dans `profile.tsx` mais aussi importée depuis `utils` (import cassé). Il faut l'ajouter dans `utils.ts` comme source unique de vérité.

- [ ] **Step 1 : Ajouter gradeLabel à la fin de utils.ts**

Remplacer le contenu de `apps/mobile/src/lib/utils.ts` par :

```ts
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export function getInitials(first: string, last: string): string {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
}

export function gradeLabel(grade: string): string {
  const map: Record<string, string> = {
    BRONZE: 'Bronze',
    SILVER: 'Silver',
    GOLD: 'Gold',
    PLATINUM: 'Platinum',
    DIAMOND: 'Diamond',
  };
  return map[grade] || grade;
}
```

- [ ] **Step 2 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/src/lib/utils.ts && git commit -m "feat(mobile/utils): add gradeLabel"
```

---

## Task 3 : Redesign messages.tsx — thème light

**Files:**
- Modify: `apps/mobile/app/(tabs)/messages.tsx`

- [ ] **Step 1 : Remplacer le fichier entier**

```tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getInitials, timeAgo } from '../../src/lib/utils';
import { colors, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

interface Conversation {
  conversation_id: string;
  sender_id: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  content: string;
  created_at: string;
  unread_count?: number;
}

export default function MessagesScreen() {
  const router = useRouter();

  const { data } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages').then((r) => r.data),
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={data || []}
        keyExtractor={(item) => item.conversation_id}
        renderItem={({ item }) => {
          const hasUnread = item.unread_count != null && item.unread_count > 0;
          return (
            <TouchableOpacity
              style={styles.conv}
              onPress={() => router.push(`/chat/${item.sender_id}`)}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {getInitials(item.first_name, item.last_name)}
                  </Text>
                </View>
              )}

              <View style={styles.convBody}>
                <View style={styles.convHeader}>
                  <Text style={[styles.convName, hasUnread && styles.convNameUnread]}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text style={styles.convTime}>{timeAgo(item.created_at)}</Text>
                </View>
                <Text style={styles.convPreview} numberOfLines={1}>
                  {item.content}
                </Text>
              </View>

              {hasUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune conversation</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.heading.bold, fontSize: 20, color: colors.foreground },
  conv: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.heading.bold, fontSize: 16, color: colors.primary },
  convBody: { flex: 1, minWidth: 0 },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  convName: { fontFamily: fonts.heading.semibold, fontSize: 14, color: colors.foreground },
  convNameUnread: { fontFamily: fonts.heading.bold },
  convTime: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted },
  convPreview: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.muted },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  empty: {
    fontFamily: fonts.body.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 60,
  },
});
```

- [ ] **Step 2 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/\(tabs\)/messages.tsx && git commit -m "feat(mobile/messages): redesign — light theme, typed conversations, unread badge"
```

---

## Task 4 : Redesign profile.tsx — thème light + spec complète

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1 : Remplacer le fichier entier**

```tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth.store';
import {
  Settings, Trophy, CalendarDays, HelpCircle, LogOut,
  ChevronRight, LayoutGrid, Film, Bookmark, Star,
} from 'lucide-react-native';
import { formatNumber, getInitials, gradeLabel } from '../../src/lib/utils';
import { colors, radius, spacing } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - 4) / 3;

const GRADE_STYLES: Record<string, { bg: string; color: string }> = {
  BRONZE:   { bg: '#FEF3C7', color: '#92400E' },
  SILVER:   { bg: '#F1F5F9', color: '#475569' },
  GOLD:     { bg: '#FEF9C3', color: '#A16207' },
  PLATINUM: { bg: '#F0F9FF', color: '#0369A1' },
  DIAMOND:  { bg: '#FAF5FF', color: '#7C3AED' },
};

const MENU_ITEMS = [
  { label: 'Programme de fidélité', icon: Trophy },
  { label: 'Mes réservations',      icon: CalendarDays },
  { label: 'Paramètres',            icon: Settings },
  { label: 'Aide & Support',        icon: HelpCircle },
] as const;

type Tab = 'posts' | 'reels' | 'saved';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('posts');

  if (!user) return null;

  const gradeStyle = GRADE_STYLES[user.loyaltyGrade] ?? GRADE_STYLES.BRONZE;
  const placeholderCount = Math.max(user.postsCount, 6);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsBtn} accessibilityLabel="Paramètres">
            <Settings size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Identity block */}
        <View style={styles.identity}>
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={[styles.avatar, user.isVerified && styles.avatarVerified]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, user.isVerified && styles.avatarVerified]}>
              <Text style={styles.avatarInitials}>{getInitials(user.firstName, user.lastName)}</Text>
            </View>
          )}

          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.username}>@{user.username}</Text>

          {/* Loyalty badge */}
          <View style={[styles.loyaltyBadge, { backgroundColor: gradeStyle.bg }]}>
            <Star size={12} color={gradeStyle.color} strokeWidth={1.5} />
            <Text style={[styles.loyaltyText, { color: gradeStyle.color }]}>
              {gradeLabel(user.loyaltyGrade)} · {formatNumber(user.loyaltyPoints)} pts
            </Text>
          </View>

          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatNumber(user.postsCount)}</Text>
            <Text style={styles.statLabel}>Publications</Text>
          </View>
          <View style={[styles.stat, styles.statMiddle]}>
            <Text style={styles.statValue}>{formatNumber(user.followersCount)}</Text>
            <Text style={styles.statLabel}>Abonnés</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatNumber(user.followingCount)}</Text>
            <Text style={styles.statLabel}>Abonnements</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([
            { key: 'posts' as Tab,  Icon: LayoutGrid, label: 'Publications' },
            { key: 'reels' as Tab,  Icon: Film,       label: 'Reels' },
            { key: 'saved' as Tab,  Icon: Bookmark,   label: 'Sauvegardés' },
          ]).map(({ key, Icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
              accessibilityLabel={label}
            >
              <Icon size={22} color={activeTab === key ? colors.primary : colors.muted} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Post grid */}
        <View style={styles.grid}>
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <View key={i} style={styles.cell} />
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU_ITEMS.map(({ label, icon: Icon }) => (
            <TouchableOpacity key={label} style={styles.menuItem}>
              <Icon size={18} color={colors.muted} strokeWidth={1.5} />
              <Text style={styles.menuLabel}>{label}</Text>
              <ChevronRight size={18} color={colors.muted} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
            <LogOut size={18} color={colors.destructive} strokeWidth={1.5} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 12 },
  settingsBtn: { padding: 4 },

  identity: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 },
  avatarVerified: { borderWidth: 2, borderColor: colors.primary },
  avatarFallback: { backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: fonts.heading.bold, fontSize: 24, color: colors.primary },

  name: { fontFamily: fonts.heading.bold, fontSize: 18, color: colors.foreground, marginBottom: 2 },
  username: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.muted, marginBottom: 8 },

  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  loyaltyText: { fontFamily: fonts.body.medium, fontSize: 11 },

  bio: {
    fontFamily: fonts.body.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },

  editBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  editBtnText: { fontFamily: fonts.body.medium, fontSize: 13, color: colors.foreground },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontFamily: fonts.heading.bold, fontSize: 20, color: colors.foreground },
  statLabel: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted, marginTop: 2 },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderColor: colors.primary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    backgroundColor: colors.surface,
  },

  menu: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
  },
  menuLabel: { flex: 1, fontFamily: fonts.body.regular, fontSize: 15, color: colors.foreground },
  logoutItem: { marginTop: 8, backgroundColor: '#FEF2F2' },
  logoutText: { flex: 1, fontFamily: fonts.body.regular, fontSize: 15, color: colors.destructive },
});
```

- [ ] **Step 2 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/\(tabs\)/profile.tsx && git commit -m "feat(mobile/profile): redesign — light theme, loyalty badge, tabs, post grid, lucide menu"
```

---

## Task 5 : Nettoyage reels.tsx — types stricts

**Files:**
- Modify: `apps/mobile/app/(tabs)/reels.tsx`

- [ ] **Step 1 : Remplacer le fichier entier**

```tsx
import React, { useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, Dimensions, TouchableOpacity, Text,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Share2, Music2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatNumber } from '../../src/lib/utils';
import { colors } from '../../src/constants/theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReelMedia {
  url: string;
  type: 'video' | 'image';
}

interface ReelAuthor {
  username: string;
  avatar?: string;
}

interface Reel {
  id: string;
  media?: ReelMedia[];
  caption?: string;
  hashtags?: string[];
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  author?: ReelAuthor;
}

interface ReelItemProps {
  item: Reel;
  isActive: boolean;
}

function ReelItem({ item, isActive }: ReelItemProps) {
  const videoRef = useRef<Video>(null);
  const [liked, setLiked] = useState(item.isLiked);
  const [likesCount, setLikesCount] = useState(item.likesCount);

  const handleLike = async () => {
    setLiked((prev) => !prev);
    setLikesCount((c) => liked ? c - 1 : c + 1);
    await api.post(`/posts/${item.id}/like`).catch(() => {});
  };

  return (
    <View style={[styles.reelContainer, { height: SCREEN_HEIGHT }]}>
      {item.media?.[0]?.url && (
        <Video
          ref={videoRef}
          source={{ uri: item.media[0].url }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          isMuted={false}
        />
      )}
      <View style={styles.overlay}>
        <View style={styles.sidebar}>
          <TouchableOpacity onPress={handleLike} style={styles.action}>
            <Heart size={28} color={liked ? '#EF4444' : '#fff'} fill={liked ? '#EF4444' : 'none'} />
            <Text style={styles.actionText}>{formatNumber(likesCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action}>
            <MessageCircle size={28} color="#fff" />
            <Text style={styles.actionText}>{formatNumber(item.commentsCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action}>
            <Share2 size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomInfo}>
          <Text style={styles.username}>@{item.author?.username}</Text>
          {item.caption ? (
            <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
          ) : null}
          {item.hashtags && item.hashtags.length > 0 ? (
            <Text style={styles.hashtags}>
              {item.hashtags.map((t) => `#${t}`).join(' ')}
            </Text>
          ) : null}
          <View style={styles.musicRow}>
            <Music2 size={12} color="#ccc" />
            <Text style={styles.music}>EDP Original Audio</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

interface ReelsPage {
  data: Reel[];
  meta: { page: number; totalPages: number };
}

export default function ReelsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data } = useInfiniteQuery<ReelsPage>({
    queryKey: ['reels'],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/feed/reels?page=${pageParam}&limit=5`).then((r) => r.data),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  const reels = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReelItem item={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.y / SCREEN_HEIGHT));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  reelContainer: { width: SCREEN_WIDTH, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16 },
  sidebar: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
    gap: 20,
  },
  action: { alignItems: 'center', gap: 4 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bottomInfo: { flex: 1, justifyContent: 'flex-end', paddingRight: 60 },
  username: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  caption: { color: '#fff', fontSize: 13, lineHeight: 18, marginBottom: 4 },
  hashtags: { color: colors.primary, fontSize: 12, marginBottom: 4 },
  musicRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  music: { color: '#ccc', fontSize: 12 },
});
```

- [ ] **Step 2 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/\(tabs\)/reels.tsx && git commit -m "feat(mobile/reels): strict types, hashtags in primary color"
```
