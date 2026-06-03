'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatNumber, timeAgo, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface PostCardProps {
  post: any;
}

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSaved);

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount((c: number) => liked ? c - 1 : c + 1);
    try {
      await api.post(`/posts/${post.id}/like`);
    } catch {
      setLiked(liked);
      setLikesCount((c: number) => liked ? c + 1 : c - 1);
    }
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
    <article className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
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

      {post.media?.length > 0 && (
        <div className="relative aspect-square bg-muted">
          {post.media[0].type === 'video' ? (
            <video
              src={post.media[0].url}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <Image
              src={post.media[0].url}
              alt={post.caption || 'Post'}
              fill
              className="object-cover"
            />
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-all',
                liked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Heart size={22} className={liked ? 'fill-red-500' : ''} />
              <span>{formatNumber(likesCount)}</span>
            </button>
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <MessageCircle size={22} />
              <span>{formatNumber(post.commentsCount)}</span>
            </Link>
            <button className="text-muted-foreground hover:text-foreground">
              <Send size={20} />
            </button>
          </div>
          <button
            onClick={() => setSaved(!saved)}
            className={cn(
              'transition-colors',
              saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Bookmark size={20} className={saved ? 'fill-primary' : ''} />
          </button>
        </div>

        {post.caption && (
          <p className="text-sm">
            <Link href={profileHref} className="font-semibold mr-2 hover:underline">
              {authorName}
            </Link>
            {post.caption}
          </p>
        )}

        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.map((tag: string) => (
              <Link
                key={tag}
                href={`/hashtag/${tag}`}
                className="text-xs text-primary hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
      </div>
    </article>
  );
}
