'use client';

import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterPills({ options, value, onChange, className }: Props) {
  return (
    <div
      role="group"
      aria-label="Filtres"
      className={cn('flex gap-2 overflow-x-auto pb-1 scrollbar-none', className)}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground border border-border hover:bg-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
