'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  name: string;
  description?: string;
  price?: number | string;
}

interface MenuSection {
  name: string;
  priceRange?: string;
  items: MenuItem[];
}

interface MenuAccordionProps {
  sections: MenuSection[];
}

export function MenuAccordion({ sections }: MenuAccordionProps) {
  const [open, setOpen] = useState<string | null>(sections[0]?.name ?? null);

  if (!sections.length) {
    return <p className="text-sm text-muted-foreground px-4 py-2">Menu non disponible.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {sections.map((section) => {
        const isOpen = open === section.name;
        return (
          <div key={section.name}>
            <button
              onClick={() => setOpen(isOpen ? null : section.name)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
            >
              <span className="font-heading font-semibold text-sm text-foreground">{section.name}</span>
              <div className="flex items-center gap-3">
                {section.priceRange && (
                  <span className="text-xs text-muted-foreground tabular-nums">{section.priceRange}</span>
                )}
                <ChevronDown
                  size={16}
                  className={cn('text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')}
                />
              </div>
            </button>

            {isOpen && (
              <ul className="px-4 pb-3 space-y-2.5 animate-fade-in">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans font-medium text-foreground truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.price != null && (
                      <span className="text-sm font-sans font-medium text-foreground tabular-nums flex-shrink-0">
                        {typeof item.price === 'number' ? `${item.price}€` : item.price}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
