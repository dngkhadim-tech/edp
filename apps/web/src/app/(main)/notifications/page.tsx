'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Heart, MessageCircle, UserPlus, Calendar, Star, Trophy, Bell,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { timeAgo, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

const NOTIF_ICONS: Record<string, React.ElementType> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  FOLLOW: UserPlus,
  RESERVATION_CONFIRMED: Calendar,
  REVIEW: Star,
  LOYALTY_UPGRADE: Trophy,
};

function NotifItem({ notif }: { notif: Notification }) {
  const Icon = NOTIF_ICONS[notif.type] ?? Bell;
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
        !notif.isRead && 'bg-primary/5',
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={notif.actor?.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {notif.actor
              ? getInitials(notif.actor.firstName, notif.actor.lastName)
              : 'EDP'}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
          <Icon size={11} className="text-primary" aria-hidden="true" />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug line-clamp-2">{notif.message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(notif.createdAt)}</p>
      </div>

      {!notif.isRead && (
        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" aria-label="Non lu" />
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data } = useQuery<{ data: Notification[] }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const all = data?.data ?? [];
  const unread = all.filter((n) => !n.isRead);

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Notifications</h1>
        <button
          onClick={() => markAllRead()}
          className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
        >
          Tout marquer lu
        </button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            Toutes
            {all.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">({all.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex-1">
            Non lues
            {unread.length > 0 && (
              <span className="ml-1.5 text-xs font-semibold text-primary tabular-nums">({unread.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-1 mt-2">
            {all.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell size={48} className="mb-4 opacity-20" aria-hidden="true" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              all.map((n) => <NotifItem key={n.id} notif={n} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="unread">
          <div className="space-y-1 mt-2">
            {unread.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell size={48} className="mb-4 opacity-20" aria-hidden="true" />
                <p className="text-sm">Tout est lu !</p>
              </div>
            ) : (
              unread.map((n) => <NotifItem key={n.id} notif={n} />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
