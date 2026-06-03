'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Compass, Search, MessageCircle, User } from 'lucide-react';

const ITEMS = [
  { href: '/feed', icon: Home },
  { href: '/explore', icon: Compass },
  { href: '/search', icon: Search },
  { href: '/messages', icon: MessageCircle },
  { href: '/profile/me', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex lg:hidden z-40">
      {ITEMS.map(({ href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex-1 flex items-center justify-center py-3 transition-colors',
            pathname.startsWith(href) ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <Icon size={24} />
        </Link>
      ))}
    </nav>
  );
}
