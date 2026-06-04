'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoyaltyBadge } from '@/components/profile/LoyaltyBadge';
import { PostGrid } from '@/components/profile/PostGrid';
import { formatNumber, getInitials } from '@/lib/utils';
import { Grid3X3, Film, Bookmark, MapPin, Check, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProfileTab = 'posts' | 'reels' | 'saved';

export default function ProfilePage({ params }: { params: any }) {
  const { username } = params as { username: string };
  const { user: me } = useAuthStore();
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('posts');

  const { data: profile } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/users/${username}`).then((r) => {
      setFollowing(r.data.isFollowing);
      return r.data;
    }),
  });

  const { data: postsData } = useQuery({
    queryKey: ['posts', 'user', profile?.id, tab],
    queryFn: () => {
      if (tab === 'saved') return api.get(`/posts/saved`).then((r) => r.data);
      if (tab === 'reels') return api.get(`/reels/user/${profile.id}`).then((r) => r.data);
      return api.get(`/posts/user/${profile.id}`).then((r) => r.data);
    },
    enabled: !!profile?.id,
  });

  const isMe = me?.username === username || username === 'me';

  const handleFollow = async () => {
    if (!profile) return;
    setFollowing((f) => !f);
    await (following
      ? api.delete(`/follows/users/${profile.id}`)
      : api.post(`/follows/users/${profile.id}`)
    ).catch(() => setFollowing((f) => !f));
  };

  if (!profile) {
    return (
      <div className="animate-pulse px-4 pt-8 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="w-[72px] h-[72px] rounded-full bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  // Normaliser les posts vers le format PostGridItem
  const rawPosts: any[] = postsData?.data ?? [];
  const posts = rawPosts.map((p) => ({
    id: p.id,
    thumbnailUrl: p.thumbnailUrl ?? p.media?.[0]?.url,
    type: p.type ?? (p.media?.[0]?.type === 'video' ? 'video' : 'image'),
    duration: p.duration,
    caption: p.caption,
  }));

  return (
    <div className="max-w-xl mx-auto pb-24 lg:pb-8">
      {/* En-tête profil */}
      <div className="px-4 pt-5 pb-4 space-y-4">
        {/* Avatar + infos */}
        <div className="flex items-start gap-4">
          <Avatar
            className={cn(
              'h-[72px] w-[72px] flex-shrink-0',
              profile.isVerified && 'ring-2 ring-primary ring-offset-2',
            )}
          >
            <AvatarImage src={profile.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-heading font-bold text-xl">
              {getInitials(profile.firstName, profile.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-bold text-lg text-foreground leading-tight">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.isVerified && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                  <Check size={10} className="text-primary-foreground" strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>
            {profile.city && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin size={11} /> {profile.city}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around">
          {[
            { value: profile.postsCount ?? 0,     label: 'publications' },
            { value: profile.followersCount ?? 0,  label: 'abonnés' },
            { value: profile.followingCount ?? 0,  label: 'abonnements' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="font-heading font-bold text-lg tabular-nums">{formatNumber(value)}</span>
              <span className="text-xs text-muted-foreground font-sans">{label}</span>
            </div>
          ))}
        </div>

        {/* Badge fidélité */}
        {profile.loyaltyGrade && (
          <LoyaltyBadge grade={profile.loyaltyGrade} points={profile.loyaltyPoints} />
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
        )}

        {/* Boutons action */}
        {isMe ? (
          <Button
            variant="outline"
            className="w-full font-heading font-semibold border-border text-foreground h-10 rounded-xl"
          >
            Modifier le profil
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={handleFollow}
              className={cn(
                'flex-1 font-heading font-semibold h-10 rounded-xl transition-all duration-150',
                following
                  ? 'bg-background border border-primary text-primary hover:bg-primary/5'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {following ? 'Suivi ✓' : 'Suivre'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 font-heading font-semibold border-border text-foreground h-10 rounded-xl"
            >
              <MessageCircle size={16} className="mr-1.5" />
              Message
            </Button>
          </div>
        )}
      </div>

      {/* Tabs grille */}
      <div
        role="tablist"
        aria-label="Publications de l'utilisateur"
        className="sticky top-14 z-20 bg-background border-b border-border flex"
      >
        {[
          { value: 'posts' as ProfileTab,  icon: Grid3X3, label: 'Publications' },
          { value: 'reels' as ProfileTab,  icon: Film,    label: 'Reels'        },
          { value: 'saved' as ProfileTab,  icon: Bookmark, label: 'Sauvegardés' },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            aria-label={label}
            onClick={() => setTab(value)}
            className={cn(
              'flex-1 flex items-center justify-center py-3 border-b-2 transition-colors',
              tab === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={20} strokeWidth={tab === value ? 2 : 1.5} />
          </button>
        ))}
      </div>

      {/* Grille publications */}
      <div data-testid="post-grid">
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}
