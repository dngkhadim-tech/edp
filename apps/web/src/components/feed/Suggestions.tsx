'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import type { Establishment } from '@edp/shared';

export function Suggestions() {
  const { user } = useAuthStore();
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ['establishments', 'featured'],
    queryFn: () => api.get('/establishments/featured').then((r) => r.data),
  });

  const handleFollow = async (id: string) => {
    setFollowed((prev) => new Set([...prev, id]));
    await api.post(`/follows/establishments/${id}`);
  };

  return (
    <div className="sticky top-6 space-y-6">
      {user && (
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link href={`/profile/${user.username}`} className="font-semibold text-sm hover:underline">
              {user.firstName} {user.lastName}
            </Link>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-muted-foreground">À découvrir</p>
          <Link href="/explore" className="text-xs text-primary font-semibold hover:underline">
            Voir tout
          </Link>
        </div>

        <div className="space-y-4">
          {(data as Establishment[] | undefined)?.slice(0, 5).map((est) => (
            <div key={est.id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage src={est.logo} />
                <AvatarFallback className="bg-secondary rounded-lg text-xs">
                  {est.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Link href={`/establishment/${est.slug}`} className="text-sm font-medium hover:underline truncate block">
                  {est.name}
                </Link>
                <p className="text-xs text-muted-foreground truncate">{est.city}</p>
              </div>
              <Button
                size="sm"
                variant={followed.has(est.id) ? 'outline' : 'default'}
                className="text-xs h-7 px-3"
                onClick={() => handleFollow(est.id)}
                disabled={followed.has(est.id)}
              >
                {followed.has(est.id) ? 'Suivi' : 'Suivre'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        VEYA – Eat • Drink • Pose © 2024
      </p>
    </div>
  );
}
