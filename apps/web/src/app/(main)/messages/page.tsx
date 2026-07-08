'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, PenSquare, Loader2 } from 'lucide-react';
import { timeAgo, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface UserResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

function NewMessageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const { data, isLoading } = useQuery<{ users: UserResult[] }>({
    queryKey: ['search-users', query],
    queryFn: () => api.get('/search', { params: { q: query, limit: 10 } }).then((r) => r.data),
    enabled: query.length >= 2,
  });

  const users = data?.users ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau message</DialogTitle>
        </DialogHeader>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une personne"
          autoFocus
        />
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={22} className="animate-spin text-primary" />
            </div>
          )}
          {!isLoading && query.length >= 2 && users.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun résultat</p>
          )}
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                onOpenChange(false);
                router.push(`/messages/${u.id}`);
              }}
              className="w-full flex items-center gap-3 py-2 px-2 -mx-2 hover:bg-secondary rounded-xl transition-colors text-left"
            >
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={u.avatar ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(u.firstName, u.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const [newMessageOpen, setNewMessageOpen] = useState(false);

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
        <Button variant="ghost" size="icon" aria-label="Nouveau message" onClick={() => setNewMessageOpen(true)}>
          <PenSquare size={20} aria-hidden="true" />
        </Button>
      </div>

      <NewMessageDialog open={newMessageOpen} onOpenChange={setNewMessageOpen} />

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
