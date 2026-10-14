import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: "Inicio", href: "/" }, ...items];
  return (
    <nav aria-label="Migas de pan" className={cn("text-eyebrow", className)}>
      <JsonLd
        data={{
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: siteUrl(c.href) } : {}),
          })),
        }}
      />
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {c.href && !last ? (
                <Link href={c.href} className="text-current/64 hover:text-current">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="text-current">
                  {c.label}
                </span>
              )}
              {!last && (
                <span aria-hidden className="text-current/64">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
