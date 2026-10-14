import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SortableEntityList } from "@/components/admin/entities/sortable-entity-list";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/admin/ui/button";
import { mediaPreviews } from "@/lib/admin/media-previews";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Servicios" };
export const instant = false;

export default async function ServicesPage() {
  await requireUser();
  const services = await db.service.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, slug: true, published: true, coverId: true },
  });
  const previews = await mediaPreviews(services.map((s) => s.coverId));
  const rows = services.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: `/servicios/${s.slug}`,
    thumbUrl: s.coverId ? previews[s.coverId]?.thumbUrl : null,
    published: s.published,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Servicios"
        description="Arrastrá para cambiar el orden en el sitio. El interruptor los oculta sin borrarlos."
        actions={
          <Button asChild>
            <Link href="/admin/servicios/nuevo">
              <Plus /> Nuevo servicio
            </Link>
          </Button>
        }
      />
      <SortableEntityList
        key={JSON.stringify(rows)}
        entity="service"
        rows={rows}
        editBase="/admin/servicios"
        empty="Todavía no hay servicios."
      />
    </div>
  );
}
