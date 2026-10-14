import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/admin/entities/service-form";
import { ICON_NAMES } from "@/lib/admin/icons";
import { mediaPreviews } from "@/lib/admin/media-previews";
import { requireUser } from "@/lib/auth/session";
import { titledItemsSchema } from "@/lib/content/schemas";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Editar servicio" };
export const instant = false;

export default async function EditServicePage({ params }: PageProps<"/admin/servicios/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const s = await db.service.findUnique({ where: { id } });
  if (!s) notFound();
  const icon = ICON_NAMES.find((n) => n === s.icon) ?? "Layers";

  return (
    <ServiceForm
      key={s.updatedAt.toISOString()}
      id={s.id}
      canDelete={user.role === "ADMIN"}
      mediaPreviews={await mediaPreviews([s.coverId])}
      initial={{
        title: s.title,
        slug: s.slug,
        shortDescription: s.shortDescription,
        icon,
        coverId: s.coverId,
        content: s.content,
        whyItems: titledItemsSchema.catch([]).parse(s.whyItems),
        steps: titledItemsSchema.catch([]).parse(s.steps),
        published: s.published,
        seoTitle: s.seoTitle ?? "",
        seoDescription: s.seoDescription ?? "",
      }}
    />
  );
}
