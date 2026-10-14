import "server-only";
import { db } from "@/lib/db";
import { pageContentLabels, type PageContentKey } from "@/lib/content/schemas";
import type { MediaVariant } from "./process";

export type MediaUsage = { label: string; href: string }[];

/** "2026/10/<uuid>-960.webp" → "<uuid>" (shared by all variants of one media). */
function fileStem(path: string) {
  const base = path.split("/").pop() ?? "";
  return base.replace(/-\d+\.webp$/, "");
}

/**
 * Where a media item is referenced: FK relations, PageContent JSON (`*Id`
 * fields) and rich text (<img src="/uploads/...">). Used to block deletion.
 */
export async function getMediaUsage(mediaId: string): Promise<MediaUsage> {
  const media = await db.media.findUnique({
    where: { id: mediaId },
    select: {
      path: true,
      variants: true,
      settingsLogos: { select: { id: true } },
      settingsFavicons: { select: { id: true } },
      settingsOg: { select: { id: true } },
      serviceCovers: { select: { id: true, title: true } },
      projectCovers: { select: { id: true, title: true } },
      projectImages: { select: { project: { select: { id: true, title: true } } } },
      clientLogos: { select: { id: true, name: true } },
      galleryImages: { select: { id: true } },
      postCovers: { select: { id: true, title: true } },
      testimonials: { select: { id: true, author: true } },
    },
  });
  if (!media) return [];

  const usage: MediaUsage = [];
  if (media.settingsLogos.length)
    usage.push({ label: "Logo del sitio", href: "/admin/configuracion" });
  if (media.settingsFavicons.length) usage.push({ label: "Favicon", href: "/admin/configuracion" });
  if (media.settingsOg.length)
    usage.push({ label: "Imagen para redes (SEO)", href: "/admin/configuracion" });
  for (const s of media.serviceCovers)
    usage.push({ label: `Servicio: ${s.title}`, href: `/admin/servicios/${s.id}` });
  for (const p of media.projectCovers)
    usage.push({ label: `Portada de obra: ${p.title}`, href: `/admin/obras/${p.id}` });
  for (const i of media.projectImages)
    usage.push({
      label: `Galería de obra: ${i.project.title}`,
      href: `/admin/obras/${i.project.id}`,
    });
  for (const l of media.clientLogos)
    usage.push({ label: `Logo de cliente: ${l.name}`, href: "/admin/logos" });
  if (media.galleryImages.length)
    usage.push({ label: "Galería de inicio", href: "/admin/galeria" });
  for (const p of media.postCovers)
    usage.push({ label: `Nota: ${p.title}`, href: `/admin/blog/${p.id}` });
  for (const t of media.testimonials)
    usage.push({ label: `Testimonio: ${t.author}`, href: "/admin/testimonios" });

  // JSON references in PageContent (hero background, about image, …).
  const pages = await db.$queryRaw<{ key: string }[]>`
    SELECT "key" FROM "PageContent" WHERE "data"::text LIKE ${"%" + mediaId + "%"}`;
  for (const p of pages)
    usage.push({
      label: `Sección: ${pageContentLabels[p.key as PageContentKey] ?? p.key}`,
      href: `/admin/secciones/${p.key}`,
    });

  // Inline images in rich text.
  const stem = fileStem((media.variants as MediaVariant[])[0]?.path ?? media.path);
  if (stem) {
    const [services, projects, posts] = await Promise.all([
      db.service.findMany({
        where: { content: { contains: stem } },
        select: { id: true, title: true },
      }),
      db.project.findMany({
        where: { content: { contains: stem } },
        select: { id: true, title: true },
      }),
      db.blogPost.findMany({
        where: { content: { contains: stem } },
        select: { id: true, title: true },
      }),
    ]);
    for (const s of services)
      usage.push({ label: `Texto de servicio: ${s.title}`, href: `/admin/servicios/${s.id}` });
    for (const p of projects)
      usage.push({ label: `Texto de obra: ${p.title}`, href: `/admin/obras/${p.id}` });
    for (const p of posts)
      usage.push({ label: `Texto de nota: ${p.title}`, href: `/admin/blog/${p.id}` });
  }

  return usage;
}
