'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  Home, Compass, Film, Search, Heart, Bookmark,
  MessageCircle, MapPin, Trophy, Bell, User, Settings,
  LogOut, Plus, Store,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EdpLogo } from '@/components/ui/edp-logo';
import { getInitials } from '@/lib/utils';
import { UserRole } from '@edp/shared';

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
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-16 lg:w-60 border-r border-border bg-card flex flex-col z-40 hidden md:flex">
      <div className="p-3 lg:p-6">
        <Link href="/feed" className="block" aria-label="EDP — Eat Drink Pose">
          {/* Narrow (icon-only): monogram only */}
          <EdpLogo className="lg:hidden h-8 w-auto text-primary" />
          {/* Wide: full logo with tagline */}
          <EdpLogo withTagline className="hidden lg:block h-14 w-auto text-primary" />
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
              title={item.label}
              className={cn(
                'flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon size={20} />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {user?.role === UserRole.ESTABLISHMENT && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <Link href="/establishment/dashboard" title="Mon établissement">
              <Store size={18} />
              <span className="hidden lg:block ml-1">Mon établissement</span>
            </Link>
          </Button>
        )}

        {user?.role === UserRole.ADMIN && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <Link href="/admin/dashboard" title="Administration">
              <Settings size={18} />
              <span className="hidden lg:block ml-1">Administration</span>
            </Link>
          </Button>
        )}

        <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
          <Link href="/post/new">
            <Plus size={18} />
            <span className="hidden lg:block ml-1">Publier</span>
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
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          title="Déconnexion"
          className="flex items-center justify-center lg:justify-start gap-3 px-3 py-2 w-full text-sm text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
        >
          <LogOut size={18} />
          <span className="hidden lg:inline">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
