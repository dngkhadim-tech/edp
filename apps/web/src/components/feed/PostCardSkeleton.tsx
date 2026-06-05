import { Skeleton } from '@/components/ui/skeleton';

export function PostCardSkeleton() {
  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>

      {/* Image placeholder 4:5 */}
      <Skeleton className="w-full aspect-[4/5] rounded-none" />

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-6 ml-auto" />
      </div>

      {/* Caption */}
      <div className="px-4 pb-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-20 mt-1" />
      </div>
    </article>
  );
}
