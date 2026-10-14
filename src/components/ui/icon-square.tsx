import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function IconSquare({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-accent text-accent-fg",
        size === "md" ? "size-12" : "size-10",
        className,
      )}
    >
      <Icon className={size === "md" ? "size-6" : "size-5"} strokeWidth={1.75} />
    </span>
  );
}
