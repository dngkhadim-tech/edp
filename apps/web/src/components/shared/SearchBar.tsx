'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  placeholder?: string;
  defaultValue?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  placeholder = 'Rechercher…',
  defaultValue = '',
  onSearch,
  debounceMs = 300,
  autoFocus = false,
  className,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search
        size={16}
        aria-hidden="true"
        className="absolute left-3 text-muted-foreground pointer-events-none"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 bg-secondary border border-border rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-3 text-muted-foreground hover:text-foreground"
          aria-label="Effacer"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
