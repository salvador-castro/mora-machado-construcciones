import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SortableEntityList } from "@/components/admin/entities/sortable-entity-list";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/admin/ui/button";
import { mediaPreviews } from "@/lib/admin/media-previews";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Obras" };
export const instant = false;

export default async function ProjectsPage() {
  await requireUser();
  const projects = await db.project.findMany({
    orderBy: { order: "asc" },
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

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Obras"
        description="Arrastrá para ordenar. La estrella marca las obras destacadas del inicio."
        actions={
          <Button asChild>
            <Link href="/admin/obras/nueva">
              <Plus /> Nueva obra
            </Link>
          </Button>
        }
      />
      <SortableEntityList
        key={JSON.stringify(rows)}
        entity="project"
        rows={rows}
        editBase="/admin/obras"
        empty="Todavía no hay obras."
      />
    </div>
  );
}
