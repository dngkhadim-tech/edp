'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Bookmark, MapPin } from 'lucide-react';
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
    setLiked((v) => !v);
    setLikeAnimating(true);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    await api.post(`/posts/${post.id}/like`).catch(() => {
      setLiked((v) => !v);
      setLikesCount((c) => (liked ? c + 1 : c - 1));
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((v) => !v);
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

  return (
    <article className="group">
      {/* Image */}
      <Link href={`/post/${post.id}`} className="block relative">
        {mediaItem ? (
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl bg-muted',
              tall ? 'aspect-[3/5]' : 'aspect-[3/4]',
            )}
          >
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
                alt={post.caption || 'Post VEYA'}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 50vw, 300px"
              />
            )}

            {/* Bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

            {/* Location */}
            {post.location && (
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium">
                <MapPin size={9} />
                <span className="truncate max-w-[90px]">{post.location}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-5 bg-gradient-to-br from-primary/20 to-primary/5 min-h-[140px] flex items-center justify-center">
            <p className="text-sm font-medium line-clamp-5 text-center leading-relaxed">
              {post.caption}
            </p>
          </div>
        )}
      </Link>

      {/* Info row: avatar + name · likes · save */}
      <div className="px-1 pt-2 pb-2.5 flex items-center gap-1.5">
        {/* Avatar + name */}
        <Link href={profileHref} className="flex items-center gap-2 min-w-0 flex-1">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={author?.avatar || (author as PostEstablishment)?.logo} />
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-semibold">
              {getInitials(
                author?.firstName || (author as PostEstablishment)?.name,
                author?.lastName || '',
              )}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold truncate text-foreground/90 leading-none">
            {authorName}
          </span>
        </Link>

        {/* Likes */}
        <button
          onClick={handleLike}
          aria-label="J'aime"
          className="flex items-center gap-1 flex-shrink-0 py-1 px-0.5"
        >
          <Heart
            size={14}
            className={cn(
              'transition-all duration-200',
              liked ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground',
              likeAnimating ? 'scale-125' : '',
            )}
            onTransitionEnd={() => setLikeAnimating(false)}
          />
          {likesCount > 0 && (
            <span
              className={cn(
                'text-[11px] font-semibold tabular-nums leading-none',
                liked ? 'text-rose-500' : 'text-muted-foreground',
              )}
            >
              {formatNumber(likesCount)}
            </span>
          )}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          aria-label={saved ? 'Retirer des favoris' : 'Sauvegarder'}
          className="flex-shrink-0 py-1 px-0.5"
        >
          <Bookmark
            size={14}
            className={cn(
              'transition-all duration-200',
              saved ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          />
        </button>
      </div>
    </article>
  );
}
