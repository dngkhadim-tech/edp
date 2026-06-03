'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInitials } from '@/lib/utils';

export function StoriesBar() {
  const { data } = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.get('/posts/stories').then((r) => r.data),
  });

  return (
    <ScrollArea className="w-full" orientation="horizontal">
      <div className="flex gap-4 pb-2">
        <button className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="h-16 w-16 rounded-full border-2 border-dashed border-primary flex items-center justify-center bg-primary/10">
            <Plus size={24} className="text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Votre story</span>
        </button>

        {data?.map((story: any) => {
          const author = story.author;
          return (
            <button key={story.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="story-ring">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={author?.avatar} />
                  <AvatarFallback className="bg-secondary text-sm">
                    {getInitials(author?.firstName, author?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs truncate w-16 text-center">{author?.firstName}</span>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
