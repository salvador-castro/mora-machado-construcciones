"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function CarouselControls({
  index,
  count,
  canPrev,
  canNext,
  onPrev,
  onNext,
  className,
}: {
  index: number;
  count: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  if (count <= 1) return null;
  const btn =
    "inline-flex size-12 items-center justify-center border border-current/24 transition-colors hover:border-current disabled:opacity-32 disabled:hover:border-current/24";
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <p className="text-eyebrow tabular-nums" aria-live="polite">
        {index + 1} de {count}
      </p>
      <div className="flex gap-2">
        <button type="button" className={btn} onClick={onPrev} disabled={!canPrev}>
          <ArrowLeft aria-hidden className="size-5" />
          <span className="sr-only">Anterior</span>
        </button>
        <button type="button" className={btn} onClick={onNext} disabled={!canNext}>
          <ArrowRight aria-hidden className="size-5" />
          <span className="sr-only">Siguiente</span>
        </button>
      </div>
    </div>
  );
}
