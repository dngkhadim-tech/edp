'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, UserX, UserCheck, Shield } from 'lucide-react';
import { getInitials, timeAgo } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  postsCount?: number;
  followersCount?: number;
}

interface UsersResponse {
  data: AdminUser[];
  meta: { total: number; page: number; totalPages: number };
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN:         'bg-red-100 text-red-700',
  ESTABLISHMENT: 'bg-blue-100 text-blue-700',
  USER:          'bg-secondary text-muted-foreground',
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['admin', 'users', page, debouncedSearch],
    queryFn: () =>
      api.get('/admin/users', { params: { page, limit: 20, search: debouncedSearch || undefined } })
        .then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'Statut mis à jour' });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta?.total ?? '—'} utilisateurs au total
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={handleSearch}
          placeholder="Rechercher par nom, email..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rôle</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Inscrit</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.map((u) => (
              <tr key={u.id} className={cn('hover:bg-muted/30 transition-colors', !u.isActive && 'opacity-60')}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(u.firstName, u.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground">@{u.username} · {u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', ROLE_BADGE[u.role] ?? ROLE_BADGE.USER)}>
                    {u.role === 'ADMIN' && <Shield size={10} />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.isActive ? 'default' : 'secondary'} className={u.isActive ? 'bg-success/10 text-success border-0' : ''}>
                    {u.isActive ? 'Actif' : 'Désactivé'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {timeAgo(u.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMutation.mutate(u.id)}
                    disabled={toggleMutation.isPending || u.role === 'ADMIN'}
                    className={u.isActive ? 'hover:text-destructive' : 'hover:text-success'}
                  >
                    {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                    <span className="ml-1.5">{u.isActive ? 'Désactiver' : 'Activer'}</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && users.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Aucun utilisateur trouvé.</p>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} / {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              Précédent
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
