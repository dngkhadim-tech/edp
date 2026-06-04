'use client';

import { cn } from '@/lib/utils';

export type FeedCategory = 'all' | 'restaurant' | 'bar' | 'hotel' | 'nearby';

const CATEGORIES: { value: FeedCategory; label: string }[] = [
  { value: 'all',        label: 'Tout'        },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'bar',        label: 'Bars'        },
  { value: 'hotel',      label: 'Hôtels'      },
  { value: 'nearby',     label: 'À proximité' },
];

interface CategoryPillsProps {
  value: FeedCategory;
  onChange: (v: FeedCategory) => void;
}

export function CategoryPills({ value, onChange }: CategoryPillsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2"
      role="group"
      aria-label="Filtrer le fil d'actualité"
    >
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          aria-pressed={value === cat.value}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-heading font-semibold transition-colors duration-150',
            value === cat.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-muted',
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
