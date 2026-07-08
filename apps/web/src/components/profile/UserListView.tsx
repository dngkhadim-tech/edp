'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Loader2, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface ListedUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

export function UserListView({
  username,
  endpoint,
  title,
  emptyLabel,
}: {
  username: string;
  endpoint: 'followers' | 'following';
  title: string;
  emptyLabel: string;
}) {
  const router = useRouter();

  const { data: profile } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/users/${username}`).then((r) => r.data),
  });

  const { data, isLoading } = useQuery<{ data: ListedUser[] }>({
    queryKey: ['users', endpoint, profile?.id],
    queryFn: () => api.get(`/users/${profile.id}/${endpoint}`).then((r) => r.data),
    enabled: !!profile?.id,
  });

  const users = data?.data ?? [];

  return (
    <div className="max-w-screen-sm mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center gap-3 px-4">
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          className="p-1.5 -ml-1.5 rounded-full text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-heading font-bold text-sm">{title}</h1>
      </header>

      <div className="px-4 pt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Users size={40} className="opacity-30" />
            <p className="text-sm font-sans text-center">{emptyLabel}</p>
          </div>
        )}

        <div className="divide-y divide-border/50">
          {users.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.username}`}
              className="flex items-center gap-3 py-3 px-2 -mx-2 hover:bg-secondary rounded-xl transition-colors"
            >
              <Avatar className="h-11 w-11 flex-shrink-0">
                <AvatarImage src={u.avatar ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(u.firstName, u.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-heading font-semibold text-sm truncate">
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
