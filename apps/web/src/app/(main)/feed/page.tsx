'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
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
