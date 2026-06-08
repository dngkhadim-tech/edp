import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PinCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="rounded-2xl overflow-hidden">
      <Skeleton className={cn('w-full rounded-2xl', tall ? 'aspect-[3/5]' : 'aspect-[3/4]')} />
      <div className="px-2.5 pt-2 pb-2.5 flex items-center gap-1.5">
        <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
