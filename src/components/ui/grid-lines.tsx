import { cn } from "@/lib/cn";

/**
 * Full-page vertical guide lines aligned to the site container.
 * Fixed overlay with `mix-blend-mode: difference` so the same line reads
 * slightly darker on light sections and slightly lighter on dark ones.
 * Lines: container edges + every 3 of 12 columns (3 on mobile, 5 from md).
 */
export function GridLines({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-30 mix-blend-difference", className)}
    >
      <div className="container-site grid h-full grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "border-l border-white/10 last:border-r",
              i >= 2 && "hidden md:block",
              i === 1 && "max-md:border-r",
            )}
          />
        ))}
      </div>
    </div>
  );
}
