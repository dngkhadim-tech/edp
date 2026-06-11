'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { api } from '@/lib/api';
import { PinCard } from '@/components/feed/PinCard';
import { PinCardSkeleton } from '@/components/feed/PinCardSkeleton';
import { CategoryPills, type FeedCategory } from '@/components/feed/CategoryPills';
import { ReelsRow } from '@/components/feed/ReelsRow';
import { Loader2 } from 'lucide-react';

const REELS_AFTER_N_POSTS = 4;

export default function FeedPage() {
  const { ref, inView } = useInView();
  const [category, setCategory] = useState<FeedCategory>('all');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['feed', category],
      queryFn: ({ pageParam = 1 }) =>
        api
          .get(`/feed?page=${pageParam}&limit=12${category !== 'all' ? `&type=${category}` : ''}`)
          .then((r) => r.data),
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

  // Split posts into two columns for masonry layout
  const leftPosts = posts.filter((_, i) => i % 2 === 0);
  const rightPosts = posts.filter((_, i) => i % 2 !== 0);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <p className="font-heading font-bold text-foreground">Impossible de charger le feed</p>
        <p className="text-sm text-muted-foreground">Vérifiez votre connexion et réessayez.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header mobile */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 lg:hidden flex items-center justify-between">
        <span className="font-heading font-extrabold text-xl tracking-tight">VEYA</span>
        <span className="text-[11px] text-muted-foreground font-medium tracking-widest uppercase">Eat · Drink · Pose</span>
      </header>

      <CategoryPills value={category} onChange={setCategory} />

      {isLoading ? (
        /* Skeleton masonry */
        <div className="flex gap-3 px-3 mt-2">
          <div className="flex-1 flex flex-col gap-3">
            {[0, 1, 2].map((i) => <PinCardSkeleton key={i} tall={i % 2 === 0} />)}
          </div>
          <div className="flex-1 flex flex-col gap-3 mt-8">
            {[0, 1, 2].map((i) => <PinCardSkeleton key={i} tall={i % 2 !== 0} />)}
          </div>
        </div>
      ) : (
        <>
          {/* ReelsRow — full width, above the grid */}
          {reelsData?.length > 0 && posts.length >= REELS_AFTER_N_POSTS && (
            <div className="-mx-0 mb-2">
              <ReelsRow reels={reelsData} />
            </div>
          )}

          {/* Masonry 2-column grid */}
          <div className="flex gap-3 px-3 mt-2 items-start">
            {/* Left column */}
            <div className="flex-1 flex flex-col gap-3">
              {leftPosts.map((post, i) => (
                <PinCard key={post.id} post={post} tall={i % 3 === 0} />
              ))}
            </div>

            {/* Right column — offset for natural stagger */}
            <div className="flex-1 flex flex-col gap-3 mt-8">
              {rightPosts.map((post, i) => (
                <PinCard key={post.id} post={post} tall={i % 3 === 2} />
              ))}
            </div>
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={ref} className="flex justify-center py-6">
            {isFetchingNextPage && <Loader2 className="animate-spin text-primary" size={22} />}
          </div>
        </>
      )}
    </div>
  );
}
