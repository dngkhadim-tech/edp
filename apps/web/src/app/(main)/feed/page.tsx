'use client';

import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { api } from '@/lib/api';
import { PinCard } from '@/components/feed/PinCard';
import { PinCardSkeleton } from '@/components/feed/PinCardSkeleton';
import { CategoryPills, type FeedCategory } from '@/components/feed/CategoryPills';
import { Loader2, Play, Heart, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

type HomeTab = 'feed' | 'reels';

/* ─── Reel types ─── */
interface ReelAuthor { username?: string; avatar?: string; firstName?: string; lastName?: string }
interface ReelMedia  { url: string; type: 'image' | 'video' }
interface Reel {
  id: string; isLiked: boolean; likesCount: number; commentsCount: number;
  caption?: string; hashtags?: string[]; author?: ReelAuthor; media?: ReelMedia[];
}

/* ─── Single Reel item (full-screen) ─── */
function ReelItem({ reel, isActive }: { reel: Reel; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked]       = useState(reel.isLiked);
  const [count, setCount]       = useState(reel.likesCount);
  const [muted, setMuted]       = useState(true);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) videoRef.current.play().catch(() => {});
    else          videoRef.current.pause();
  }, [isActive]);

  const handleLike = async () => {
    setLiked((v) => !v);
    setCount((c) => liked ? c - 1 : c + 1);
    await api.post(`/posts/${reel.id}/like`).catch(() => {});
  };

  return (
    <div className="snap-start h-[calc(100dvh-112px)] w-full flex-shrink-0 relative bg-black overflow-hidden">
      {reel.media?.[0]?.type === 'video' ? (
        <video
          ref={videoRef}
          src={reel.media[0].url}
          className="w-full h-full object-cover"
          loop muted={muted} playsInline
          onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
        />
      ) : reel.media?.[0] ? (
        <img src={reel.media[0].url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-black" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Actions droite */}
      <div className="absolute right-3 bottom-16 flex flex-col gap-5 items-center">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <Heart size={26} className={cn(liked ? 'fill-red-500 text-red-500' : 'text-white')} />
          <span className="text-white text-[11px] font-bold">{formatNumber(count)}</span>
        </button>
        <Link href={`/post/${reel.id}`} className="flex flex-col items-center gap-1">
          <MessageCircle size={26} className="text-white" />
          <span className="text-white text-[11px] font-bold">{formatNumber(reel.commentsCount)}</span>
        </Link>
        <button onClick={() => setMuted((v) => !v)} className="text-white">
          {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Infos bas gauche */}
      <div className="absolute left-3 bottom-4 right-16">
        <Link href={`/profile/${reel.author?.username}`} className="flex items-center gap-2 mb-2">
          <Avatar className="h-9 w-9 border-2 border-white">
            <AvatarImage src={reel.author?.avatar} />
            <AvatarFallback className="bg-primary/30 text-white text-xs">
              {getInitials(reel.author?.firstName, reel.author?.lastName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white font-bold text-sm">@{reel.author?.username}</span>
        </Link>
        {reel.caption && <p className="text-white text-sm line-clamp-2">{reel.caption}</p>}
      </div>
    </div>
  );
}

/* ─── Reels panel ─── */
function ReelsPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['reels', 'feed-panel'],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/feed/reels?page=${pageParam}&limit=5`).then((r) => r.data),
    getNextPageParam: (last) => last.meta?.page < last.meta?.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  const reels: Reel[] = data?.pages.flatMap((p) => p.data) ?? [];

  const handleScroll = () => {
    if (!containerRef.current) return;
    const h = containerRef.current.clientHeight;
    const idx = Math.round(containerRef.current.scrollTop / h);
    setActiveIdx(idx);
    if (idx >= reels.length - 2 && hasNextPage) fetchNextPage();
  };

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Play size={40} className="text-primary/30" />
        <p className="text-sm font-medium">Aucun Reel pour l&apos;instant</p>
        <Link href="/post/new" className="text-primary text-sm font-semibold hover:underline">
          Créer un Reel →
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-scroll snap-y snap-mandatory h-[calc(100dvh-112px)]"
      onScroll={handleScroll}
    >
      {reels.map((reel, i) => (
        <ReelItem key={reel.id} reel={reel} isActive={i === activeIdx} />
      ))}
    </div>
  );
}

/* ─── Feed panel ─── */
function FeedPanel() {
  const { ref, inView } = useInView();
  const [category, setCategory] = useState<FeedCategory>('all');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['feed', category],
      queryFn: ({ pageParam = 1 }) =>
        api.get(`/feed?page=${pageParam}&limit=12${category !== 'all' ? `&type=${category}` : ''}`).then((r) => r.data),
      getNextPageParam: (last) => last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
      initialPageParam: 1,
    });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p) => p.data) ?? [];
  const leftPosts  = posts.filter((_, i) => i % 2 === 0);
  const rightPosts = posts.filter((_, i) => i % 2 !== 0);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <p className="font-heading font-bold">Impossible de charger le feed</p>
        <button onClick={() => refetch()} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      <CategoryPills value={category} onChange={setCategory} />

      {isLoading ? (
        <div className="flex gap-1.5 px-1.5 mt-1.5">
          <div className="flex-1 flex flex-col gap-1.5">
            {[0, 1, 2].map((i) => <PinCardSkeleton key={i} tall={i % 2 === 0} />)}
          </div>
          <div className="flex-1 flex flex-col gap-1.5 mt-6">
            {[0, 1, 2].map((i) => <PinCardSkeleton key={i} tall={i % 2 !== 0} />)}
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1.5 px-1.5 mt-1.5 items-start">
            <div className="flex-1 flex flex-col gap-1.5">
              {leftPosts.map((post, i) => <PinCard key={post.id} post={post} tall={i % 3 === 0} />)}
            </div>
            <div className="flex-1 flex flex-col gap-1.5 mt-6">
              {rightPosts.map((post, i) => <PinCard key={post.id} post={post} tall={i % 3 === 2} />)}
            </div>
          </div>
          <div ref={ref} className="flex justify-center py-6">
            {isFetchingNextPage && <Loader2 className="animate-spin text-primary" size={22} />}
          </div>
        </>
      )}
    </>
  );
}

/* ─── Home page ─── */
export default function FeedPage() {
  const [tab, setTab] = useState<HomeTab>('feed');

  return (
    <div className="pb-24 lg:pb-8">
      {/* Tab switcher */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 flex">
        <button
          onClick={() => setTab('feed')}
          className={cn(
            'flex-1 py-3 text-sm font-heading font-semibold transition-colors border-b-2',
            tab === 'feed'
              ? 'text-foreground border-foreground'
              : 'text-muted-foreground border-transparent hover:text-foreground',
          )}
        >
          Pour toi
        </button>
        <button
          onClick={() => setTab('reels')}
          className={cn(
            'flex-1 py-3 text-sm font-heading font-semibold transition-colors border-b-2',
            tab === 'reels'
              ? 'text-foreground border-foreground'
              : 'text-muted-foreground border-transparent hover:text-foreground',
          )}
        >
          Reels
        </button>
      </div>

      {tab === 'feed'  && <FeedPanel />}
      {tab === 'reels' && <ReelsPanel />}
    </div>
  );
}
