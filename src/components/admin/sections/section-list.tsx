import Link from "next/link";
import { ChevronRight, EyeOff } from "lucide-react";
import { timeAgo } from "@/lib/admin/labels";
import { pageContentLabels, type PageContentKey } from "@/lib/content/schemas";
import { db } from "@/lib/db";

export async function SectionList({ keys }: { keys: PageContentKey[] }) {
  const rows = await db.pageContent.findMany({
    where: { key: { in: keys } },
    select: { key: true, published: true, updatedAt: true, updatedBy: { select: { name: true } } },
  });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const now = new Date();

  return (
    <ul className="divide-y overflow-hidden rounded-lg border bg-card">
      {keys.map((key) => {
        const row = byKey.get(key);
        return (
          <li key={key}>
            <Link
              href={`/admin/secciones/${key}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{pageContentLabels[key]}</p>
                <p className="text-xs text-muted-foreground">
                  {row
                    ? `Editado ${timeAgo(row.updatedAt, now)}${row.updatedBy ? ` por ${row.updatedBy.name}` : ""}`
                    : "Sin contenido"}
                </p>
              </div>
              {row && !row.published && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <EyeOff className="size-3" /> Oculta
                </span>
              )}
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
