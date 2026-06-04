'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Images } from 'lucide-react';

interface HeroGalleryProps {
  images: string[];
  name: string;
  totalCount?: number;
}

export function HeroGallery({ images, name, totalCount }: HeroGalleryProps) {
  const [current, setCurrent] = useState(0);
  const count = images.length;
  const extra = (totalCount ?? count) - count;

  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);

  if (!count) {
    return (
      <div className="relative w-full bg-muted flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-muted"
      style={{ aspectRatio: '16/9' }}
      aria-label={`Galerie photos de ${name}`}
    >
      <Image
        key={current}
        src={images[current]}
        alt={`${name} — photo ${current + 1}`}
        fill
        className="object-cover"
        sizes="100vw"
        priority={current === 0}
      />

      {/* Gradient bas */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Navigation flèches (desktop) */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors hidden md:flex"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors hidden md:flex"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Aller à la photo ${i + 1}`}
              className={cn(
                'rounded-full transition-all duration-200',
                i === current ? 'bg-white w-4 h-1.5' : 'bg-white/55 w-1.5 h-1.5',
              )}
            />
          ))}
        </div>
      )}

      {/* Bouton +N photos */}
      {extra > 0 && (
        <button
          aria-label={`Voir ${extra} photos supplémentaires`}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-heading font-semibold bg-black/55 hover:bg-black/70 transition-colors"
        >
          <Images size={13} />
          +{extra} photos
        </button>
      )}
    </div>
  );
}
