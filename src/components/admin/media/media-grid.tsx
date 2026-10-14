"use client";

import { Check } from "lucide-react";
import type { MediaListItem } from "@/lib/media/admin-types";
import { cn } from "@/lib/cn";

export function MediaGrid({
  items,
  selected,
  onItemClick,
}: {
  items: MediaListItem[];
  selected?: Set<string>;
  onItemClick: (item: MediaListItem) => void;
}) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No hay imágenes.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => {
        const isSelected = selected?.has(item.id);
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onItemClick(item)}
              aria-pressed={selected ? isSelected : undefined}
              className={cn(
                "group relative block w-full overflow-hidden rounded-md border bg-muted text-left focus-visible:ring-2 focus-visible:ring-ring",
                isSelected && "ring-2 ring-ring ring-offset-2",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of our own variant */}
              <img
                src={item.thumbUrl}
                alt={item.alt}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="block truncate px-2 py-1.5 text-xs">{item.alt}</span>
              {isSelected && (
                <span className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-4" aria-hidden />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
