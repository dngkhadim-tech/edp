import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, getInitials } from '@/lib/utils';

interface Props {
  review: any;
}

export function ReviewCard({ review }: Props) {
  return (
    <article className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={review.user?.avatar} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {getInitials(review.user?.firstName, review.user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {review.user?.firstName} {review.user?.lastName}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">{formatDate(review.createdAt)}</span>
            </div>
          </div>
        </div>
        {review.isVerified && (
          <span className="text-xs text-primary font-medium">✓ Vérifiée</span>
        )}
      </div>

      {review.title && <p className="font-semibold text-sm">{review.title}</p>}
      <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>

      {review.establishmentResponse && (
        <div className="bg-secondary rounded-lg p-3 ml-4 border-l-2 border-primary">
          <p className="text-xs font-semibold text-primary mb-1">Réponse de l'établissement</p>
          <p className="text-sm text-muted-foreground">{review.establishmentResponse.content}</p>
        </div>
      )}
    </article>
  );
}
