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
