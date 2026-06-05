'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoyaltyBadge } from '@/components/profile/LoyaltyBadge';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { formatNumber, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronLeft, MoreHorizontal, Grid3X3, Film, Bookmark, Play, MapPin, MessageCircle } from 'lucide-react';

type GridTab = 'posts' | 'reels' | 'saved';

interface PostMedia {
  url: string;
  type: 'image' | 'video';
  duration?: number;
}

interface GridPost {
  id: string;
  media?: PostMedia[];
}

type ProfilePageProps = { params: { username: string } };

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;
  const { user: me } = useAuthStore();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [gridTab, setGridTab] = useState<GridTab>('posts');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/users/${username}`).then((r) => {
      setFollowing(r.data.isFollowing);
      return r.data;
    }),
  });

  const { data: posts } = useQuery({
    queryKey: ['posts', 'user', profile?.id],
    queryFn: () => api.get(`/posts/user/${profile.id}`).then((r) => r.data),
    enabled: !!profile?.id,
  });

  const { data: savedPosts } = useQuery({
    queryKey: ['posts', 'saved', profile?.id],
    queryFn: () => api.get(`/posts/saved`).then((r) => r.data),
    enabled: !!profile?.id && gridTab === 'saved',
  });

  const isMe = me?.username === username;

  const handleFollow = async () => {
    setFollowing(!following);
    if (following) {
      await api.delete(`/follows/users/${profile.id}`).catch(() => setFollowing(true));
    } else {
      await api.post(`/follows/users/${profile.id}`).catch(() => setFollowing(false));
    }
  };

  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return null;

  const gridItems = gridTab === 'saved' ? (savedPosts?.data ?? []) : (posts?.data ?? []);

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center justify-between px-4">
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-heading font-bold text-sm truncate">@{profile.username}</span>
        <button aria-label="Plus d'options" className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-full transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </header>

      {/* Bloc identité */}
      <div className="px-4 pt-4 pb-3 space-y-3">
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

          {/* Stats */}
          <div className="flex-1 flex items-center justify-around pt-2">
            <div className="text-center">
              <p className="font-heading font-bold text-xl text-foreground tabular-nums">{formatNumber(profile.postsCount ?? 0)}</p>
              <p className="text-xs font-sans text-muted-foreground">posts</p>
            </div>
            <button className="text-center hover:opacity-70 transition-opacity">
              <p className="font-heading font-bold text-xl text-foreground tabular-nums">{formatNumber(profile.followersCount ?? 0)}</p>
              <p className="text-xs font-sans text-muted-foreground">abonnés</p>
            </button>
            <button className="text-center hover:opacity-70 transition-opacity">
              <p className="font-heading font-bold text-xl text-foreground tabular-nums">{formatNumber(profile.followingCount ?? 0)}</p>
              <p className="text-xs font-sans text-muted-foreground">abonnements</p>
            </button>
          </div>
        </div>

        {/* Nom + badge fidélité */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-bold text-[18px] text-foreground">
              {profile.firstName} {profile.lastName}
            </span>
            {profile.loyaltyGrade && (
              <LoyaltyBadge grade={profile.loyaltyGrade} points={profile.loyaltyPoints} />
            )}
          </div>
          {profile.bio && (
            <p className="text-sm font-sans text-foreground leading-relaxed line-clamp-2">{profile.bio}</p>
          )}
          {profile.city && (
            <p className="flex items-center gap-1 text-xs font-sans text-muted-foreground">
              <MapPin size={11} />
              {profile.city}{profile.country ? `, ${profile.country}` : ''}
            </p>
          )}
        </div>

        {/* Boutons */}
        {isMe ? (
          <Button variant="outline" className="w-full font-heading font-semibold border-border text-foreground h-10 rounded-xl" asChild>
            <Link href="/settings">Modifier le profil</Link>
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleFollow}
              className={cn(
                'flex-1 font-heading font-semibold h-10 rounded-xl transition-all duration-150',
                following
                  ? 'bg-transparent border border-primary text-primary hover:bg-primary/5'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {following ? 'Abonné' : 'Suivre'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 font-heading font-semibold border-border text-foreground h-10 rounded-xl"
              asChild
            >
              <Link href={`/messages/${profile.id}`}>
                <MessageCircle size={15} className="mr-1.5" />
                Message
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Tabs grille — icônes uniquement */}
      <div role="tablist" aria-label="Publications" className="border-t border-border flex">
        {([
          { id: 'posts',  icon: Grid3X3, label: 'Publications' },
          { id: 'reels',  icon: Film,    label: 'Reels'        },
          { id: 'saved',  icon: Bookmark,label: 'Sauvegardés'  },
        ] as const).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            role="tab"
            aria-label={label}
            aria-selected={gridTab === id}
            onClick={() => setGridTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center py-3 transition-colors border-b-2',
              gridTab === id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground',
            )}
          >
            <Icon size={22} strokeWidth={gridTab === id ? 2 : 1.5} />
          </button>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-3" style={{ gap: '2px' }}>
        {(gridItems as GridPost[]).map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative bg-muted overflow-hidden"
            style={{ aspectRatio: '1' }}
          >
            {post.media?.[0] && (
              <Image
                src={post.media[0].url}
                alt=""
                fill
                className="object-cover"
                sizes="33vw"
                loading="lazy"
              />
            )}
            {post.media?.[0]?.type === 'video' && (
              <>
                <span className="absolute bottom-1 left-1 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-black/50">
                  <Play size={10} className="text-white fill-white" />
                </span>
                {post.media[0].duration && (
                  <span className="absolute bottom-1 right-1 z-10 text-white text-[11px] font-sans bg-black/55 px-1 rounded">
                    {post.media[0].duration}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}
      </div>

      {gridItems.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">Aucun contenu</p>
      )}
    </div>
  );
}
