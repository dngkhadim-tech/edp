'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber, getInitials, gradeColor, gradeLabel } from '@/lib/utils';
import { useState } from 'react';
import { Grid3X3, Play, Trophy } from 'lucide-react';

export default function ProfilePage({ params }: { params: any }) {
  const { username } = params as { username: string };
  const { user: me } = useAuthStore();
  const [following, setFollowing] = useState(false);

  const { data: profile } = useQuery({
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

  const isMe = me?.username === username;

  const handleFollow = async () => {
    setFollowing(!following);
    if (following) {
      await api.delete(`/follows/users/${profile.id}`);
    } else {
      await api.post(`/follows/users/${profile.id}`);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-screen-md mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
        <Avatar className="h-28 w-28">
          <AvatarImage src={profile.avatar} />
          <AvatarFallback className="bg-primary/20 text-primary text-3xl">
            {getInitials(profile.firstName, profile.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <h1 className="text-xl font-semibold">{profile.firstName} {profile.lastName}</h1>
            {profile.isVerified && <span className="text-primary text-sm">✓</span>}
            <span className={`text-sm font-medium ${gradeColor(profile.loyaltyGrade)}`}>
              <Trophy size={14} className="inline mr-1" />
              {gradeLabel(profile.loyaltyGrade)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mb-1">@{profile.username}</p>
          {profile.bio && <p className="text-sm mb-3 leading-relaxed">{profile.bio}</p>}
          {profile.city && <p className="text-xs text-muted-foreground mb-4">📍 {profile.city}{profile.country ? `, ${profile.country}` : ''}</p>}

          <div className="flex justify-center sm:justify-start gap-8 mb-4">
            <div className="text-center">
              <p className="font-bold">{formatNumber(profile.postsCount)}</p>
              <p className="text-xs text-muted-foreground">publications</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{formatNumber(profile.followersCount)}</p>
              <p className="text-xs text-muted-foreground">abonnés</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{formatNumber(profile.followingCount)}</p>
              <p className="text-xs text-muted-foreground">abonnements</p>
            </div>
          </div>

          {isMe ? (
            <Button variant="outline" size="sm" asChild>
              <a href="/settings">Modifier le profil</a>
            </Button>
          ) : (
            <Button
              size="sm"
              variant={following ? 'outline' : 'default'}
              onClick={handleFollow}
            >
              {following ? 'Se désabonner' : 'Suivre'}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="w-full bg-secondary">
          <TabsTrigger value="posts" className="flex-1 gap-2">
            <Grid3X3 size={16} /> Publications
          </TabsTrigger>
          <TabsTrigger value="reels" className="flex-1 gap-2">
            <Play size={16} /> Reels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <div className="grid grid-cols-3 gap-1">
            {posts?.data?.map((post: any) => (
              <a key={post.id} href={`/post/${post.id}`} className="aspect-square relative block bg-secondary overflow-hidden group">
                {post.media?.[0] && (
                  <Image
                    src={post.media[0].url}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </a>
            ))}
          </div>
          {posts?.data?.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Aucune publication</p>
          )}
        </TabsContent>

        <TabsContent value="reels" className="mt-4">
          <p className="text-center text-muted-foreground py-12">Aucun reel</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
