import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/entities/project-form";
import { mediaPreviews } from "@/lib/admin/media-previews";
import { projectFormOptions } from "@/lib/admin/project-options";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Editar obra" };
export const instant = false;

export default async function EditProjectPage({ params }: PageProps<"/admin/obras/[id]">) {
  await requireUser();
  const { id } = await params;
  const [p, options] = await Promise.all([
    db.project.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" }, select: { mediaId: true, caption: true } } },
    }),
    projectFormOptions(),
  ]);
  if (!p) notFound();

  return (
    <ProjectForm
      key={p.updatedAt.toISOString()}
      id={p.id}
      options={options}
      mediaPreviews={await mediaPreviews([p.coverId, ...p.images.map((i) => i.mediaId)])}
      initial={{
        title: p.title,
        slug: p.slug,
        categoryId: p.categoryId,
        serviceId: p.serviceId,
        location: p.location,
        year: p.year == null ? "" : String(p.year),
        area: p.area ?? "",
        excerpt: p.excerpt,
        content: p.content,
        coverId: p.coverId,
        images: p.images.map((i) => ({ mediaId: i.mediaId, caption: i.caption ?? "" })),
        featured: p.featured,
        published: p.published,
        seoTitle: p.seoTitle ?? "",
        seoDescription: p.seoDescription ?? "",
      }}
    />
  );
}
