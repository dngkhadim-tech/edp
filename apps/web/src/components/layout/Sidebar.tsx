'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  Home, Compass, Film, Search, Heart, Bookmark,
  MessageCircle, MapPin, Trophy, Bell, User, Settings,
  LogOut, Plus, Store,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/feed', icon: Home, label: 'Accueil' },
  { href: '/explore', icon: Compass, label: 'Explorer' },
  { href: '/reels', icon: Film, label: 'Reels' },
  { href: '/search', icon: Search, label: 'Recherche' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/map', icon: MapPin, label: 'Carte' },
  { href: '/reservations', icon: Bookmark, label: 'Réservations' },
  { href: '/loyalty', icon: Trophy, label: 'Fidélité' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card flex flex-col z-40 hidden lg:flex">
      <div className="p-6">
        <Link href="/feed" className="block">
          <h1 className="text-2xl font-display font-bold gold-text">EDP</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Eat • Drink • Pose</p>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
          <Link href="/post/new">
            <Plus size={18} />
            Publier
          </Link>
        </Button>

        {user && (
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
          </Link>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
