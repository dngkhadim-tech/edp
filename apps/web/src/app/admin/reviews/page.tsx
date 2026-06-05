'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, Trash2, Flag, AlertTriangle } from 'lucide-react';
import { getInitials, timeAgo } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

interface FlaggedReview {
  id: string;
  rating: number;
  title?: string;
  content: string;
  flagCount: number;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  establishment?: {
    name: string;
    slug: string;
  };
}

interface ReviewsResponse {
  data: FlaggedReview[];
  meta: { total: number; page: number; totalPages: number };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-border'}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<FlaggedReview | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['admin', 'reviews', 'flagged', page],
    queryFn: () =>
      api.get('/admin/reviews/flagged', { params: { page, limit: 20 } }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      setToDelete(null);
      toast({ title: 'Avis supprimé' });
    },
    onError: () => toast({ title: 'Erreur lors de la suppression', variant: 'destructive' }),
  });

  const reviews = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Avis signalés</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {meta?.total ?? '—'} avis en attente de modération
        </p>
      </div>

      {!isLoading && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card border border-border rounded-xl">
          <Flag size={40} className="text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun avis signalé pour le moment.</p>
        </div>
      )}

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))
          : reviews.map((review) => (
              <div key={review.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={review.user?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {review.user ? getInitials(review.user.firstName, review.user.lastName) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Utilisateur supprimé'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        sur <span className="text-foreground font-medium">{review.establishment?.name ?? '—'}</span>
                        {' · '}{timeAgo(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 bg-destructive/10 text-destructive text-xs font-medium px-2 py-1 rounded-full">
                      <AlertTriangle size={10} />
                      {review.flagCount} signalement{review.flagCount > 1 ? 's' : ''}
                    </span>
                    <StarRating rating={review.rating} />
                  </div>
                </div>

                {/* Content */}
                {review.title && (
                  <p className="font-medium text-sm">{review.title}</p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-3">{review.content}</p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setToDelete(review)}
                  >
                    <Trash2 size={14} className="mr-1.5" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {meta.page} / {meta.totalPages}</p>
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

      {/* Confirm delete dialog */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cet avis ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'avis sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
              disabled={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
