'use client';

import { Play } from 'lucide-react';

interface PostGridItem {
  id: string;
  thumbnailUrl?: string;
  type?: 'image' | 'video' | 'reel';
  duration?: number;
  caption?: string;
}

interface PostGridProps {
  posts: PostGridItem[];
  onSelect?: (id: string) => void;
}

export function PostGrid({ posts, onSelect }: PostGridProps) {
  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-muted-foreground text-sm">Aucune publication pour l'instant.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-px">
      {posts.map((post) => {
        const isReel = post.type === 'reel' || post.type === 'video';
        return (
          <button
            key={post.id}
            onClick={() => onSelect?.(post.id)}
            className="relative bg-muted overflow-hidden group"
            style={{ aspectRatio: '1' }}
            aria-label={post.caption || (isReel ? 'Voir le reel' : 'Voir la publication')}
          >
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt={post.caption || ''}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted" />
            )}

            {isReel && (
              <>
                <span className="absolute bottom-2 left-2 flex items-center justify-center w-6 h-6 rounded-full bg-black/50">
                  <Play size={10} className="text-white fill-white ml-0.5" />
                </span>
                {post.duration != null && (
                  <span className="absolute bottom-2 right-2 text-[10px] text-white font-sans bg-black/50 px-1 py-0.5 rounded">
                    {Math.floor(post.duration / 60)}:{String(post.duration % 60).padStart(2, '0')}
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
