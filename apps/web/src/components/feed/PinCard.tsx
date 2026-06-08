'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, MessageCircle } from 'lucide-react';
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
  createdAt: string | Date;
  author?: PostAuthor;
  establishment?: PostEstablishment;
}

interface PinCardProps {
  post: FeedPost;
  tall?: boolean;
}

export function PinCard({ post, tall = false }: PinCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    setLikeAnimating(true);
    setLikesCount((c: number) => (liked ? c - 1 : c + 1));
    await api.post(`/posts/${post.id}/like`).catch(() => {
      setLiked(liked);
      setLikesCount((c: number) => (liked ? c + 1 : c - 1));
    });
  };

  const author = post.author || post.establishment;
  const authorName =
    `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || (author as PostEstablishment)?.name || 'Inconnu';
  const authorUsername = author?.username || (author as PostEstablishment)?.slug;
  const profileHref =
    post.authorType === 'ESTABLISHMENT' ? `/establishment/${authorUsername}` : `/profile/${authorUsername}`;

  const mediaItem = post.media?.[0];

  return (
    <article className="rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link href={`/post/${post.id}`} className="block relative group">
        {mediaItem ? (
          <div className={cn('relative overflow-hidden rounded-2xl bg-muted', tall ? 'aspect-[3/5]' : 'aspect-[3/4]')}>
            {mediaItem.type === 'video' ? (
              <video
                src={mediaItem.url}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            ) : (
              <Image
                src={mediaItem.url}
                alt={post.caption || 'Post EDP'}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 300px"
              />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Like button */}
            <button
              onClick={handleLike}
              aria-label="J'aime"
              className={cn(
                'absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-150 shadow-sm',
                liked
                  ? 'bg-primary text-white'
                  : 'bg-black/30 text-white opacity-0 group-hover:opacity-100',
              )}
            >
              <Heart
                size={13}
                className={cn(liked ? 'fill-white' : '', likeAnimating ? 'animate-like-pop' : '')}
                onAnimationEnd={() => setLikeAnimating(false)}
              />
              {likesCount > 0 && <span>{formatNumber(likesCount)}</span>}
            </button>

            {/* Location badge */}
            {post.location && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] backdrop-blur-md bg-black/35 text-white font-medium">
                <MapPin size={9} />
                <span className="truncate max-w-[100px]">{post.location}</span>
              </div>
            )}
          </div>
        ) : (
          /* Text-only post */
          <div className="p-4 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl min-h-[130px] flex items-center justify-center">
            <p className="text-sm font-medium line-clamp-5 text-center">{post.caption}</p>
          </div>
        )}
      </Link>

      {/* Author row */}
      <div className="px-2.5 pt-2 pb-2.5 flex items-center gap-1.5">
        <Link href={profileHref} className="flex items-center gap-1.5 min-w-0 flex-1">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={author?.avatar || (author as PostEstablishment)?.logo} />
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
              {getInitials(
                author?.firstName || (author as PostEstablishment)?.name,
                author?.lastName || '',
              )}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium truncate text-foreground/80">{authorName}</span>
        </Link>
        {post.commentsCount > 0 && (
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-0.5 text-[11px] text-muted-foreground flex-shrink-0"
          >
            <MessageCircle size={11} />
            <span>{formatNumber(post.commentsCount)}</span>
          </Link>
        )}
      </div>
    </article>
  );
}
