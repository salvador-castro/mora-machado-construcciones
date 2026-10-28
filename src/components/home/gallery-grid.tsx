"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Play, X } from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";
import { mediaUrl, type MediaAsset } from "@/lib/media/types";
import { cn } from "@/lib/cn";

export type GalleryItem = {
  id: string;
  caption: string | null;
  shape: "normal" | "tall" | "wide";
  media: MediaAsset;
};

/**
 * Masonry grid (CSS columns) + native <dialog> lightbox with keyboard navigation.
 * Videos show their poster with a play mark and play (with controls) in the lightbox.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<number | null>(null);

  const open = (i: number) => {
    setCurrent(i);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const step = useCallback(
    (delta: number) =>
      setCurrent((c) => (c === null ? c : (c + delta + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    const onClose = () => setCurrent(null);
    dialog.addEventListener("keydown", onKey);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("keydown", onKey);
      dialog.removeEventListener("close", onClose);
    };
  }, [step]);

  const active = current === null ? null : items[current];

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 lg:gap-6">
        {items.map((item, i) => (
          <li key={item.id} className="mb-4 break-inside-avoid lg:mb-6">
            <figure>
              <button
                type="button"
                onClick={() => open(i)}
                aria-label={`${item.media.videoPath ? "Ver video" : "Ampliar"}: ${item.caption ?? item.media.alt}`}
                className="group relative block w-full overflow-hidden"
              >
                <MediaImage
                  media={item.media}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className={cn(
                    "w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.03] motion-reduce:transition-none",
                    item.shape === "wide" && "aspect-video",
                  )}
                />
                {item.media.videoPath && (
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center bg-ink/16 transition-colors group-hover:bg-ink/28"
                  >
                    <span className="inline-flex size-16 items-center justify-center rounded-full bg-paper/92 text-ink shadow-lg">
                      <Play className="ml-1 size-7 fill-current" />
                    </span>
                  </span>
                )}
              </button>
              {item.caption && (
                <figcaption className="mt-2 text-sm text-ink/64">{item.caption}</figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label="Galería ampliada"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/96 p-0 text-paper backdrop:bg-ink/80"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        {active && (
          <div className="flex h-full flex-col">
            <div className="container-site flex h-14 shrink-0 items-center justify-between">
              <p className="text-eyebrow tabular-nums">
                {current! + 1} de {items.length}
              </p>
              <button
                type="button"
                onClick={close}
                autoFocus
                className="inline-flex size-10 items-center justify-center border border-paper/24 hover:border-paper"
              >
                <X aria-hidden className="size-5" />
                <span className="sr-only">Cerrar</span>
              </button>
            </div>
            <figure className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 pb-4">
              {active.media.videoPath ? (
                <video
                  key={active.id}
                  src={mediaUrl(active.media.videoPath)}
                  poster={mediaUrl(active.media.variants.at(-1)?.path ?? "")}
                  controls
                  autoPlay
                  playsInline
                  aria-label={active.caption ?? active.media.alt}
                  className="max-h-full min-h-0 w-auto max-w-full"
                />
              ) : (
                <MediaImage
                  key={active.id}
                  media={active.media}
                  sizes="100vw"
                  className="max-h-full min-h-0 w-auto max-w-full bg-transparent object-contain"
                />
              )}
              {active.caption && (
                <figcaption className="text-sm text-paper/72">{active.caption}</figcaption>
              )}
            </figure>
            {items.length > 1 && (
              <div className="flex shrink-0 justify-center gap-2 pb-6">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="inline-flex size-12 items-center justify-center border border-paper/24 hover:border-paper"
                >
                  <ArrowLeft aria-hidden className="size-5" />
                  <span className="sr-only">Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="inline-flex size-12 items-center justify-center border border-paper/24 hover:border-paper"
                >
                  <ArrowRight aria-hidden className="size-5" />
                  <span className="sr-only">Siguiente</span>
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
