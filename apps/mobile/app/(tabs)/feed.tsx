import React, { useCallback } from 'react';
import {
  View, Text, FlatList, RefreshControl, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { PostCard } from '../../src/components/feed/PostCard';
import { StoriesBar } from '../../src/components/feed/StoriesBar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FeedScreen() {
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch,
  } = useInfiniteQuery({
    queryKey: ['mobile-feed'],
    queryFn: ({ pageParam = 1 }) => api.get(`/feed?page=${pageParam}&limit=10`).then((r) => r.data),
    getNextPageParam: (last) => last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  const renderHeader = useCallback(() => <StoriesBar />, []);
  const renderFooter = () =>
    isFetchingNextPage ? <ActivityIndicator color="#C9A84C" style={{ padding: 16 }} /> : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>EDP</Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#C9A84C" />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C9A84C',
    letterSpacing: 2,
  },
});
