import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PinCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div>
      <Skeleton className={cn('w-full rounded-2xl', tall ? 'aspect-[3/5]' : 'aspect-[3/4]')} />
      <div className="px-1.5 pt-2.5 pb-3 flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
        <Skeleton className="h-3 flex-1 max-w-[80px]" />
        <Skeleton className="h-3 w-8 flex-shrink-0" />
        <Skeleton className="h-3 w-3 flex-shrink-0" />
      </div>
    </div>
  );
}
