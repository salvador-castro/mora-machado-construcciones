import { cn } from "@/lib/cn";

type EyebrowProps = React.ComponentPropsWithoutRef<"p"> & {
  /** Square marker color. Defaults to accent on dark tones, ink on light ones. */
  marker?: "auto" | "accent" | "current";
};

export function Eyebrow({ marker = "auto", className, children, ...props }: EyebrowProps) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-eyebrow", className)} {...props}>
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0",
          marker === "accent" && "bg-accent",
          marker === "current" && "bg-current",
          // On dark tones --focus is the accent; on light tones it is ink.
          marker === "auto" && "bg-[var(--focus)]",
        )}
      />
      {children}
    </p>
  );
}
