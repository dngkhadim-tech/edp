'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react';

const ITEMS = [
  { href: '/feed',        icon: Home,          label: 'Accueil'   },
  { href: '/explore',     icon: Compass,       label: 'Découvrir' },
  { href: '/messages',    icon: MessageCircle, label: 'Messages'  },
  { href: '/profile/me',  icon: User,          label: 'Profil'    },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex md:hidden z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ITEMS.slice(0, 2).map(({ href, icon: Icon, label }) => (
        <NavItem key={href} href={href} icon={Icon} label={label} active={pathname === href || pathname.startsWith(href + '/')} />
      ))}

      {/* Bouton central surélevé */}
      <Link
        href="/post/new"
        aria-label="Publier"
        className="flex-1 flex items-center justify-center -mt-3"
      >
        <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-[0_4px_12px_rgba(225,29,72,0.4)] transition-transform active:scale-95">
          <Plus size={26} className="text-primary-foreground" strokeWidth={2.5} />
        </span>
      </Link>

      {ITEMS.slice(2).map(({ href, icon: Icon, label }) => (
        <NavItem key={href} href={href} icon={Icon} label={label} active={pathname === href || pathname.startsWith(href + '/')} />
      ))}
    </nav>
  );
}

function NavItem({ href, icon: Icon, label, active }: {
  href: string; icon: React.ElementType; label: string; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon size={22} strokeWidth={active ? 2 : 1.5} />
      <span className="text-[10px] font-sans font-medium leading-none">{label}</span>
    </Link>
  );
}
