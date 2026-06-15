'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Bookmark, MapPin, Play } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatNumber, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PostAuthor {
  id?: string;
  firstName: string;
  lastName: string;
  username?: string;
  avatar?: string;
  name?: never;
  slug?: never;
  logo?: never;
}

interface PostEstablishment {
  id?: string;
  name: string;
  slug: string;
  avatar?: string;
  logo?: string;
  firstName?: never;
  lastName?: never;
  username?: never;
}

interface PostMedia {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

interface FeedPost {
  id: string;
  authorType: 'USER' | 'ESTABLISHMENT';
  caption?: string;
  hashtags: string[];
  location?: string;
  media?: PostMedia[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string | Date;
  author?: PostAuthor;
  establishment?: PostEstablishment;
}

interface PinCardProps {
  post: FeedPost;
  tall?: boolean;
}

export function PinCard({ post, tall = false }: PinCardProps) {
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSaved ?? false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = liked;
    setLiked(!prev);
    setLikeAnimating(true);
    setLikesCount((c) => (prev ? c - 1 : c + 1));
    await api.post(`/posts/${post.id}/like`).catch(() => {
      setLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : c - 1));
    });
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = saved;
    setSaved(!prev);
    await api[prev ? 'delete' : 'post'](`/posts/${post.id}/save`).catch(() => setSaved(prev));
  };

  const author = post.author || post.establishment;
  const authorName =
    `${author?.firstName || ''} ${author?.lastName || ''}`.trim() ||
    (author as PostEstablishment)?.name ||
    'Inconnu';
  const authorUsername = author?.username || (author as PostEstablishment)?.slug;
  const profileHref =
    post.authorType === 'ESTABLISHMENT'
      ? `/establishment/${authorUsername}`
      : `/profile/${authorUsername}`;

  const mediaItem = post.media?.[0];
  const isVideo = mediaItem?.type === 'video';

  return (
    <article className="group flex flex-col">
      {/* ── Image block ── */}
      <Link href={`/post/${post.id}`} className="block relative">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl bg-muted',
            tall ? 'aspect-[3/5]' : 'aspect-[3/4]',
          )}
        >
          {mediaItem ? (
            isVideo ? (
              <video
                src={mediaItem.url}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="none"
              />
            ) : (
              <Image
                src={mediaItem.url}
                alt={post.caption || 'Post VEYA'}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 50vw, 300px"
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center p-4">
              <p className="text-sm font-medium line-clamp-5 text-center leading-relaxed w-full">
                {post.caption}
              </p>
            </div>
          )}

          {/* Gradient overlay */}
          {mediaItem && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
          )}

          {/* Video badge */}
          {isVideo && (
            <div className="absolute top-2.5 left-2.5 flex items-center justify-center h-6 w-6 rounded-full bg-black/50 backdrop-blur-sm">
              <Play size={10} className="text-white fill-white" />
            </div>
          )}

          {/* Save button — always visible on mobile, hover on desktop */}
          <button
            onClick={handleSave}
            aria-label={saved ? 'Retirer des favoris' : 'Sauvegarder'}
            className={cn(
              'absolute top-2.5 right-2.5 h-7 w-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200',
              'md:opacity-0 md:group-hover:opacity-100',
              saved
                ? 'bg-primary/90 text-white'
                : 'bg-black/40 text-white/90 hover:bg-black/60',
            )}
          >
            <Bookmark size={13} className={saved ? 'fill-white' : ''} />
          </button>

          {/* Bottom overlay: location + likes */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-2.5 pointer-events-none">
            {post.location ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium pointer-events-auto">
                <MapPin size={9} />
                <span className="truncate max-w-[80px]">{post.location}</span>
              </div>
            ) : (
              <div />
            )}

            <button
              onClick={handleLike}
              aria-label="J'aime"
              className="flex items-center gap-1 pointer-events-auto px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm"
            >
              <Heart
                size={13}
                className={cn(
                  'transition-all duration-200',
                  liked ? 'fill-rose-400 text-rose-400' : 'text-white/90',
                  likeAnimating && 'scale-125',
                )}
                onTransitionEnd={() => setLikeAnimating(false)}
              />
              {likesCount > 0 && (
                <span className="text-white text-[11px] font-bold tabular-nums leading-none">
                  {formatNumber(likesCount)}
                </span>
              )}
            </button>
          </div>
        </div>
      </Link>

      {/* ── Author strip ── */}
      <Link
        href={profileHref}
        className="flex items-center gap-2 px-1 pt-2 pb-0.5 min-w-0"
      >
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={author?.avatar || (author as PostEstablishment)?.logo} />
          <AvatarFallback className="text-[9px] bg-primary/15 text-primary font-semibold">
            {getInitials(
              author?.firstName || (author as PostEstablishment)?.name,
              author?.lastName || '',
            )}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-semibold truncate text-foreground/85 leading-none">
          {authorName}
        </span>
      </Link>

      {/* ── Caption snippet ── */}
      {post.caption && mediaItem && (
        <p className="px-1 pb-2 text-[11px] text-muted-foreground/80 line-clamp-1 leading-relaxed">
          {post.caption}
        </p>
      )}
    </article>
  );
}
