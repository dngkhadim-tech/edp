import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Identity block */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Skeleton className="h-[72px] w-[72px] rounded-full flex-shrink-0" />
          {/* Stats row */}
          <div className="flex-1 flex items-center justify-around pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-5 w-10 mx-auto" />
                <Skeleton className="h-2.5 w-14 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Name + bio */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>

        {/* Button */}
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="border-t border-border flex">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 flex items-center justify-center py-3">
            <Skeleton className="h-5 w-5" />
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3" style={{ gap: '2px' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-none" />
        ))}
      </div>
    </div>
  );
}
