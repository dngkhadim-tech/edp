'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play } from 'lucide-react';
import { formatNumber, timeAgo, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { api as apiClient } from '@/lib/api';

interface ReelAuthor {
  username?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

interface ReelMedia {
  url: string;
  type: 'image' | 'video';
}

interface Reel {
  id: string;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  caption?: string;
  hashtags?: string[];
  author?: ReelAuthor;
  media?: ReelMedia[];
}

function ReelItem({ reel, isActive }: { reel: Reel; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(reel.isLiked);
  const [likesCount, setLikesCount] = useState(reel.likesCount);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const author = reel.author;

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setPlaying(false);
      }
    }
  }, [isActive]);

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount((c: number) => liked ? c - 1 : c + 1);
    await apiClient.post(`/posts/${reel.id}/like`).catch(() => {});
  };

  return (
    <div className="snap-start h-screen w-full flex-shrink-0 relative bg-black overflow-hidden">
      {reel.media?.[0]?.type === 'video' ? (
        <video
          ref={videoRef}
          src={reel.media[0].url}
          className="w-full h-full object-cover"
          loop
          muted={muted}
          playsInline
          onClick={() => {
            if (videoRef.current?.paused) { videoRef.current.play(); setPlaying(true); }
            else { videoRef.current?.pause(); setPlaying(false); }
          }}
        />
      ) : reel.media?.[0] ? (
        <img src={reel.media[0].url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-black" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      <div className="absolute right-4 bottom-24 flex flex-col gap-5">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <Heart size={28} className={cn(liked ? 'fill-red-500 text-red-500' : 'text-white')} />
          <span className="text-white text-xs font-bold">{formatNumber(likesCount)}</span>
        </button>
        <Link href={`/post/${reel.id}`} className="flex flex-col items-center gap-1">
          <MessageCircle size={28} className="text-white" />
          <span className="text-white text-xs font-bold">{formatNumber(reel.commentsCount)}</span>
        </Link>
        <button className="flex flex-col items-center gap-1">
          <Share2 size={26} className="text-white" />
          <span className="text-white text-xs font-bold">Partager</span>
        </button>
        <button onClick={() => setMuted(!muted)} className="text-white">
          {muted ? <VolumeX size={26} /> : <Volume2 size={26} />}
        </button>
      </div>

      <div className="absolute left-4 bottom-8 right-16">
        <Link href={`/profile/${author?.username}`} className="flex items-center gap-2 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={author?.avatar} />
            <AvatarFallback className="bg-primary/30 text-white text-sm">
              {getInitials(author?.firstName, author?.lastName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white font-bold text-sm">@{author?.username}</span>
        </Link>
        {reel.caption && (
          <p className="text-white text-sm line-clamp-2 mb-1">{reel.caption}</p>
        )}
        {reel.hashtags?.length > 0 && (
          <p className="text-[#C9A84C] text-sm">{reel.hashtags.map((t: string) => `#${t}`).join(' ')}</p>
        )}
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['reels'],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/feed/reels?page=${pageParam}&limit=5`).then((r) => r.data),
    getNextPageParam: (last) => last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  const reels = data?.pages.flatMap((p) => p.data) ?? [];

  const handleScroll = () => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / window.innerHeight);
    setActiveIndex(idx);
    if (idx >= reels.length - 2 && hasNextPage) fetchNextPage();
  };

  if (reels.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Play size={48} className="text-primary opacity-30" />
        <div className="text-center">
          <p className="font-semibold text-foreground">Aucun Reel pour l'instant</p>
          <p className="text-sm mt-1">Publiez votre premier Reel !</p>
        </div>
        <Link href="/post/new" className="text-primary hover:underline text-sm font-medium">
          Créer un Reel →
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      onScroll={handleScroll}
    >
      {reels.map((reel: Reel, i: number) => (
        <ReelItem key={reel.id} reel={reel} isActive={i === activeIndex} />
      ))}
    </div>
  );
}
