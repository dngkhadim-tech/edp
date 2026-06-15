'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PenSquare, Loader2 } from 'lucide-react';
import { timeAgo, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Conversation {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<{ data: Conversation[] }>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages').then((r) => r.data),
  });

  const conversations = data?.data ?? [];
  const filtered = conversations.filter((c) => {
    const name = `${c.firstName} ${c.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Messages</h1>
        <Button variant="ghost" size="icon" aria-label="Nouveau message">
          <PenSquare size={20} aria-hidden="true" />
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une conversation"
          className="pl-9 bg-secondary"
        />
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PenSquare size={48} className="mb-4 opacity-20" aria-hidden="true" />
            <p className="text-sm">Aucune conversation</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <Link
              key={conv.userId}
              href={`/messages/${conv.userId}`}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={conv.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(conv.firstName, conv.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm truncate font-heading',
                  conv.unreadCount > 0 ? 'font-semibold' : 'font-medium',
                )}>
                  {conv.firstName} {conv.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.lastMessage}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{timeAgo(conv.lastMessageAt)}</span>
                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold px-1 tabular-nums">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
