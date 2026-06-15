'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Bookmark, ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { formatNumber, getInitials, timeAgo } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface CommentAuthor {
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string | Date;
  author?: CommentAuthor;
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saved, setSaved] = useState(false);

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => api.get(`/posts/${id}`).then((r) => r.data),
  });

  useEffect(() => {
    if (post) {
      setLiked(post.isLiked ?? false);
      setLikesCount(post.likesCount ?? 0);
      setSaved(post.isSaved ?? false);
    }
  }, [post?.id]);

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => api.get(`/posts/${id}/comments`).then((r) => r.data),
    enabled: !!post,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/posts/${id}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      setNewComment('');
    },
  });

  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikesCount((c) => (prev ? c - 1 : c + 1));
    await api.post(`/posts/${id}/like`).catch(() => {
      setLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : c - 1));
    });
  };

  const handleSave = async () => {
    const prev = saved;
    setSaved(!prev);
    await api[prev ? 'delete' : 'post'](`/posts/${id}/save`).catch(() => setSaved(prev));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <p className="font-heading font-bold">Publication introuvable</p>
        <Link href="/feed" className="text-primary text-sm font-medium hover:underline">
          Retour au fil
        </Link>
      </div>
    );
  }

  const author = post.author || post.establishment;
  const authorName = author
    ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.name
    : 'Unknown';
  const authorUsername = author?.username || author?.slug;
  const profileHref =
    post.authorType === 'ESTABLISHMENT'
      ? `/establishment/${authorUsername}`
      : `/profile/${authorUsername}`;

  return (
    <div className="max-w-screen-md mx-auto">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Link href="/feed" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-semibold">Publication</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-black aspect-square md:aspect-auto md:min-h-[500px] relative">
          {post.media?.[0] && (
            <Image src={post.media[0].url} alt={post.caption || ''} fill className="object-contain" />
          )}
        </div>

        <div className="flex flex-col border-l border-border">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Link href={profileHref}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={author?.avatar} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {getInitials(author?.firstName || author?.name, author?.lastName || '')}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={profileHref} className="font-semibold text-sm hover:underline">
                {authorName}
              </Link>
              {post.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin size={10} /> {post.location}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {post.caption && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={author?.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {authorName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">
                    <Link href={profileHref} className="font-semibold mr-2 hover:underline">
                      {authorName}
                    </Link>
                    {post.caption}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(post.createdAt)}</p>
                </div>
              </div>
            )}

            {commentsData?.data?.map((comment: Comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.author?.avatar} />
                  <AvatarFallback className="bg-secondary text-xs">
                    {getInitials(comment.author?.firstName, comment.author?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold mr-2">
                      {comment.author
                        ? `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() || 'Anonyme'
                        : 'Anonyme'}
                    </span>
                    {comment.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(comment.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="flex items-center gap-1.5 text-sm">
                  <Heart
                    size={22}
                    className={cn(
                      'transition-colors',
                      liked
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-muted-foreground hover:text-rose-500',
                    )}
                  />
                  <span className={cn('font-semibold', liked ? 'text-rose-500' : '')}>
                    {formatNumber(likesCount)}
                  </span>
                </button>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageCircle size={22} />
                  <span>{formatNumber(commentsData?.meta?.total ?? post.commentsCount)}</span>
                </div>
              </div>
              <button onClick={handleSave} aria-label={saved ? 'Retirer des favoris' : 'Sauvegarder'}>
                <Bookmark
                  size={21}
                  className={cn(
                    'transition-colors',
                    saved ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
          </div>

          <div className="border-t border-border p-3 flex gap-2 items-center">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && newComment.trim() && commentMutation.mutate(newComment)
              }
              placeholder="Ajouter un commentaire..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => newComment.trim() && commentMutation.mutate(newComment)}
              disabled={!newComment.trim() || commentMutation.isPending}
              className="text-primary font-semibold text-sm disabled:opacity-40 flex items-center"
            >
              {commentMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Publier'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
