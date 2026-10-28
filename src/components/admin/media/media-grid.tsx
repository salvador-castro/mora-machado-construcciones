"use client";

import { Check, Play } from "lucide-react";
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
    return <p className="py-10 text-center text-sm text-muted-foreground">No hay archivos.</p>;
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
              {item.videoUrl && <VideoBadge duration={item.duration} />}
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

/** Marks a video in admin thumbnails (the image is its poster). */
export function VideoBadge({
  duration,
  className = "top-2 left-2",
}: {
  duration: number | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "absolute inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white",
        className,
      )}
    >
      {" "}
      <Play className="size-3 fill-current" aria-hidden />
      <span className="sr-only">Video</span>
      {duration != null && formatDuration(duration)}
    </span>
  );
}

export function formatDuration(seconds: number) {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
