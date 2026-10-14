import Link from "next/link";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: "Inicio", href: "/" }, ...items];
  return (
    <nav aria-label="Migas de pan" className={cn("text-eyebrow", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-current/56">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {c.href && !last ? (
                <Link href={c.href} className="hover:text-current">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="text-current">
                  {c.label}
                </span>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
