import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface Reel {
  id: string;
  thumbnailUrl?: string;
  duration?: number;
  caption?: string;
}

interface ReelsRowProps {
  reels: Reel[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ReelsRow({ reels }: ReelsRowProps) {
  if (!reels.length) return null;
  return (
    <section aria-label="Reels">
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="font-heading font-bold text-sm text-foreground">Reels</h2>
        <Link href="/reels" className="text-xs text-primary font-semibold">Voir tout</Link>
      </div>
      <div
        className="flex gap-2 overflow-x-auto scrollbar-none px-4 pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {reels.map((reel) => (
          <Link
            key={reel.id}
            href={`/reels?id=${reel.id}`}
            className="flex-shrink-0 relative rounded-xl overflow-hidden bg-muted"
            style={{ width: 120, aspectRatio: '9/16', scrollSnapAlign: 'start' }}
            aria-label={reel.caption || 'Voir le reel'}
          >
            {reel.thumbnailUrl ? (
              <Image
                src={reel.thumbnailUrl}
                alt={reel.caption || ''}
                fill
                className="object-cover"
                sizes="120px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20" />
            {/* Play icon */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black/45">
                <Play size={16} className="text-white fill-white ml-0.5" />
              </span>
            </span>
            {/* Durée */}
            {reel.duration != null && (
              <span className="absolute bottom-2 right-2 text-[10px] text-white font-sans font-medium bg-black/55 px-1.5 py-0.5 rounded">
                {formatDuration(reel.duration)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
