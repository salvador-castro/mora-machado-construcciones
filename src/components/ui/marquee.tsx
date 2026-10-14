import { cn } from "@/lib/cn";

/**
 * Infinite CSS marquee. Content is rendered twice and the track translates
 * by -50%; the duplicate is hidden from assistive tech.
 * Pauses on hover and stops under prefers-reduced-motion.
 */
export function Marquee({
  items,
  durationSeconds = 40,
  separator = "·",
  className,
}: {
  items: string[];
  durationSeconds?: number;
  separator?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <li key={i} className="flex items-center">
          <span className="px-6 md:px-10">{item}</span>
          <span aria-hidden className="text-current/30">
            {separator}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className="flex w-max animate-marquee hover:[animation-play-state:paused]"
        style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
