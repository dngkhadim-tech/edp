'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { PostCard } from '@/components/feed/PostCard';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { Suggestions } from '@/components/feed/Suggestions';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/feed?page=${pageParam}&limit=10`).then((r) => r.data),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <StoriesBar />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <>
              {posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
              <div ref={ref} className="flex justify-center py-4">
                {isFetchingNextPage && <Loader2 className="animate-spin text-primary" size={24} />}
              </div>
            </>
          )}
        </div>

        <aside className="hidden xl:block">
          <Suggestions />
        </aside>
      </div>
    </div>
  );
}
