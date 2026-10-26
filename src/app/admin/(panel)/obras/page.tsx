import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { SortableEntityList } from "@/components/admin/entities/sortable-entity-list";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import type { Prisma } from "@/generated/prisma/client";
import { mediaPreviews } from "@/lib/admin/media-previews";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Obras" };
export const instant = false;

const PAGE_SIZE = 20;

const FILTERS = {
  todas: { label: "Todas", where: {} },
  publicadas: { label: "Publicadas", where: { published: true } },
  ocultas: { label: "Ocultas", where: { published: false } },
  destacadas: { label: "Destacadas", where: { featured: true } },
} satisfies Record<string, { label: string; where: Prisma.ProjectWhereInput }>;
type FilterKey = keyof typeof FILTERS;

function href(filter: FilterKey, q: string, page = 1) {
  const sp = new URLSearchParams();
  if (filter !== "todas") sp.set("estado", filter);
  if (q) sp.set("q", q);
  if (page > 1) sp.set("pagina", String(page));
  const qs = sp.toString();
  return `/admin/obras${qs ? `?${qs}` : ""}`;
}

export default async function ProjectsPage({ searchParams }: PageProps<"/admin/obras">) {
  await requireUser();
  const sp = await searchParams;
  const filter: FilterKey =
    typeof sp.estado === "string" && sp.estado in FILTERS ? (sp.estado as FilterKey) : "todas";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";

  const search: Prisma.ProjectWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};
  const where = { ...FILTERS[filter].where, ...search };

  const [total, counts] = await Promise.all([
    db.project.count({ where }),
    Promise.all(
      (Object.keys(FILTERS) as FilterKey[]).map(
        async (k) =>
          [k, await db.project.count({ where: { ...FILTERS[k].where, ...search } })] as const,
      ),
    ),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(sp.pagina) || 1));

  const projects = await db.project.findMany({
    where,
    // Same order as the reorder action, so a page is a real slice of the list.
    orderBy: [{ order: "asc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      location: true,
      year: true,
      published: true,
      featured: true,
      coverId: true,
      category: { select: { name: true } },
    },
  });
  const previews = await mediaPreviews(projects.map((p) => p.coverId));
  const rows = projects.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: [p.category.name, p.location, p.year].filter(Boolean).join(" · "),
    thumbUrl: p.coverId ? previews[p.coverId]?.thumbUrl : null,
    published: p.published,
    featured: p.featured,
  }));
  // Drag & drop only on the plain list: a filtered list's order isn't the real one.
  const sortable = filter === "todas" && !q;

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Obras"
        description={
          sortable
            ? "Arrastrá para ordenar. La estrella marca las obras destacadas del inicio."
            : "Para ordenar arrastrando, quitá la búsqueda y el filtro."
        }
        actions={
          <Button asChild>
            <Link href="/admin/obras/nueva">
              <Plus /> Nueva obra
            </Link>
          </Button>
        }
      />

      <nav aria-label="Filtrar obras" className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(FILTERS) as FilterKey[]).map((k) => {
          const active = filter === k;
          const count = counts.find(([key]) => key === k)?.[1] ?? 0;
          return (
            <Link
              key={k}
              href={href(k, q)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                active ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
              )}
            >
              {FILTERS[k].label}
              <span className={cn("text-xs", active ? "opacity-80" : "text-muted-foreground")}>
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      <form className="relative mb-4 max-w-sm" role="search">
        {filter !== "todas" && <input type="hidden" name="estado" value={filter} />}
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por título, lugar o categoría"
          aria-label="Buscar obras"
          className="pl-9"
        />
      </form>

      <SortableEntityList
        key={JSON.stringify(rows)}
        entity="project"
        rows={rows}
        editBase="/admin/obras"
        empty={q || filter !== "todas" ? "No hay obras con ese filtro." : "Todavía no hay obras."}
        sortable={sortable}
        offset={(page - 1) * PAGE_SIZE}
      />

      {pages > 1 && (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-2 text-sm">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            {page > 1 ? (
              <Link href={href(filter, q, page - 1)}>Anterior</Link>
            ) : (
              <span>Anterior</span>
            )}
          </Button>
          <span className="text-muted-foreground">
            Página {page} de {pages} · {total} obras
          </span>
          <Button variant="outline" size="sm" asChild disabled={page >= pages}>
            {page < pages ? (
              <Link href={href(filter, q, page + 1)}>Siguiente</Link>
            ) : (
              <span>Siguiente</span>
            )}
          </Button>
        </nav>
      )}
    </div>
  );
}
