'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, Users, Store, Star, LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/dashboard',        icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/admin/users',            icon: Users,           label: 'Utilisateurs'     },
  { href: '/admin/establishments',   icon: Store,           label: 'Établissements'   },
  { href: '/admin/reviews',          icon: Star,            label: 'Avis signalés'    },
];

export function AdminNav() {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 border-r border-border bg-card flex flex-col z-40">
      <div className="p-6 border-b border-border">
        <Link href="/admin/dashboard" className="block">
          <span className="font-heading font-extrabold text-xl text-primary">VEYA</span>
          <span className="block text-xs text-muted-foreground mt-0.5">Administration</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
