import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, RefreshControl, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { usePulse } from '../../src/hooks/usePulse';
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
  const pulseOpacity = usePulse();

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
        <Animated.View style={[styles.skeletonWrap, { opacity: pulseOpacity }]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeleton}>
              <View style={styles.skeletonHeader}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonMeta}>
                  <View style={[styles.skeletonLine, { width: '50%' }]} />
                  <View style={[styles.skeletonLine, { width: '30%', marginTop: 4 }]} />
                </View>
              </View>
              <View style={styles.skeletonImage} />
              <View style={{ padding: 12, gap: 6 }}>
                <View style={[styles.skeletonLine, { width: '80%' }]} />
                <View style={[styles.skeletonLine, { width: '60%' }]} />
              </View>
            </View>
          ))}
        </Animated.View>
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
  skeleton: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  skeletonAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface },
  skeletonMeta: { flex: 1, gap: 0 },
  skeletonLine: { height: 10, borderRadius: 5, backgroundColor: colors.surface },
  skeletonImage: { height: 260, backgroundColor: colors.surface },
});
