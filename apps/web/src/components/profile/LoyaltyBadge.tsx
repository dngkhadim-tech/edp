import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gradeBgColor, gradeLabel } from '@/lib/utils';

interface LoyaltyBadgeProps {
  grade: string;
  points?: number;
  className?: string;
}

export function LoyaltyBadge({ grade, points, className }: LoyaltyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold',
        gradeBgColor(grade),
        className,
      )}
    >
      <Star size={11} className="fill-current flex-shrink-0" />
      {gradeLabel(grade)}
      {points != null && (
        <span className="tabular-nums opacity-80">· {points.toLocaleString('fr-FR')} pts</span>
      )}
    </span>
  );
}
