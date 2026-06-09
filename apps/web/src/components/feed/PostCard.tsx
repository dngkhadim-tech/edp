'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatNumber, timeAgo, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

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
  duration?: number;
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

interface PostCardProps {
  post: FeedPost;
}

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSaved);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = async () => {
    setLiked(!liked);
    setLikeAnimating(true);
    setLikesCount((c: number) => liked ? c - 1 : c + 1);
    await api.post(`/posts/${post.id}/like`).catch(() => {
      setLiked(liked);
      setLikesCount((c: number) => liked ? c + 1 : c - 1);
    });
  };

  const author = post.author || post.establishment;
  const authorName = author
    ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.name
    : 'Unknown';
  const authorUsername = author?.username || author?.slug;
  const profileHref = post.authorType === 'ESTABLISHMENT'
    ? `/establishment/${authorUsername}`
    : `/profile/${authorUsername}`;

  return (
    <article className="bg-card rounded-2xl overflow-hidden animate-fade-in shadow-sm">
      <header className="flex items-center justify-between p-4">
        <Link href={profileHref} className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.avatar || author?.logo} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {getInitials(author?.firstName || author?.name, author?.lastName || '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{authorName}</p>
            {post.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin size={10} /> {post.location}
              </p>
            )}
          </div>
        </Link>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal size={20} />
        </button>
      </header>

      {(() => {
        const mediaItem = post.media?.[0];
        return mediaItem ? (
          <div
            data-testid="post-media"
            className="relative bg-muted overflow-hidden"
            style={{ aspectRatio: '4/5' }}
          >
            {/* Gradient overlay pour le badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent z-10 pointer-events-none" />

            {mediaItem.type === 'video' ? (
              <video
                src={mediaItem.url}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            ) : (
              <Image
                src={mediaItem.url}
                alt={post.caption || 'Post EDP'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            )}

            {/* Badge établissement */}
            {post.establishment && (
              <Link
                href={`/establishment/${post.establishment.slug}`}
                className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-foreground text-xs font-heading font-semibold backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.88)' }}
              >
                <MapPin size={11} className="text-primary flex-shrink-0" />
                <span className="truncate max-w-[140px]">{post.establishment.name}</span>
              </Link>
            )}
          </div>
        ) : null;
      })()}

      <div className="p-4 space-y-3">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              aria-label="J'aime"
              className="group flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-colors hover:bg-primary/8"
            >
              <Heart
                size={22}
                className={cn(
                  'transition-all duration-200',
                  liked
                    ? 'fill-primary text-primary scale-110'
                    : 'text-muted-foreground group-hover:text-primary',
                  likeAnimating ? 'animate-like-pop' : '',
                )}
                onAnimationEnd={() => setLikeAnimating(false)}
              />
              <span className={cn('text-sm font-medium tabular-nums', liked ? 'text-primary' : 'text-muted-foreground')}>
                {formatNumber(likesCount)}
              </span>
            </button>
            <Link
              href={`/post/${post.id}`}
              className="group flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-secondary transition-colors"
            >
              <MessageCircle size={21} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm font-medium text-muted-foreground">{formatNumber(post.commentsCount)}</span>
            </Link>
            <button className="p-1.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <Send size={20} />
            </button>
          </div>
          <button
            onClick={() => setSaved(!saved)}
            className="p-1.5 rounded-xl hover:bg-secondary transition-colors"
            aria-label={saved ? 'Retirer des favoris' : 'Sauvegarder'}
          >
            <Bookmark
              size={21}
              className={cn(
                'transition-all duration-200',
                saved ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            />
          </button>
        </div>

        {post.caption && (
          <p className="text-sm leading-relaxed">
            <Link href={profileHref} className="font-semibold mr-1.5 hover:underline">
              {authorName}
            </Link>
            {post.caption}
          </p>
        )}

        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {post.hashtags.map((tag) => (
              <Link key={tag} href={`/hashtag/${tag}`} className="text-xs text-primary/80 hover:text-primary font-medium">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide font-medium">{timeAgo(post.createdAt)}</p>
      </div>
    </article>
  );
}
