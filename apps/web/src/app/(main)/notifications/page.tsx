'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bell, Heart, MessageCircle, Star, Calendar, Trophy } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NOTIF_ICONS: Record<string, any> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  FOLLOW: Bell,
  REVIEW: Star,
  RESERVATION_CONFIRMED: Calendar,
  LOYALTY_UPGRADE: Trophy,
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Notifications</h1>
        <Button variant="ghost" size="sm" onClick={() => markAllRead()}>
          Tout marquer comme lu
        </Button>
      </div>

      <div className="space-y-2">
        {data?.data?.map((notif: any) => {
          const Icon = NOTIF_ICONS[notif.type] || Bell;
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                !notif.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
              }`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${!notif.isRead ? 'bg-primary/10' : 'bg-secondary'}`}>
                <Icon size={16} className={!notif.isRead ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
              </div>
              {!notif.isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
            </div>
          );
        })}
        {data?.data?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p>Aucune notification</p>
          </div>
        )}
      </div>
    </div>
  );
}
