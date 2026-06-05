'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Bookmark, Send, ArrowLeft, MapPin } from 'lucide-react';
import { formatNumber, getInitials, timeAgo } from '@/lib/utils';
import { useState } from 'react';
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

type PostPageProps = { params: Promise<{ id: string }> | { id: string } };

export default function PostPage({ params }: PostPageProps) {
  const { id } = params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: post } = useQuery({
    queryKey: ['post', id],
    queryFn: () => api.get(`/posts/${id}`).then((r) => r.data),
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => api.get(`/posts/${id}/comments`).then((r) => r.data),
  });

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/posts/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', id] }),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/posts/${id}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      setNewComment('');
    },
  });

  if (!post) return null;
  const author = post.author || post.establishment;
  const authorName = author ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.name : 'Unknown';

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
            <Avatar className="h-9 w-9">
              <AvatarImage src={author?.avatar} />
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
                    <span className="font-semibold mr-2">{authorName}</span>
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
                    <span className="font-semibold mr-2">{comment.author?.firstName} {comment.author?.lastName}</span>
                    {comment.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(comment.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center gap-4">
              <button onClick={() => likeMutation.mutate()} className="flex items-center gap-1.5 text-sm">
                <Heart size={22} className="text-muted-foreground hover:text-red-500 transition-colors" />
                <span className="font-semibold">{formatNumber(post.likesCount)}</span>
              </button>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageCircle size={22} />
                <span>{formatNumber(post.commentsCount)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
          </div>

          <div className="border-t border-border p-3 flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newComment.trim() && commentMutation.mutate(newComment)}
              placeholder="Ajouter un commentaire..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => newComment.trim() && commentMutation.mutate(newComment)}
              disabled={!newComment.trim()}
              className="text-primary font-semibold text-sm disabled:opacity-40"
            >
              Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
