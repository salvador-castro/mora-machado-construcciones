import "server-only";
import { db } from "@/lib/db";
import { SLUG_RE } from "@/lib/slug";

export type DetailSection = "servicios" | "obras" | "blog";

/**
 * Whether a public detail page exists (published). Used by proxy.ts to answer
 * 404 before streaming starts; one indexed lookup by unique slug.
 */
export async function publicSlugExists(section: DetailSection, slug: string): Promise<boolean> {
  if (!SLUG_RE.test(slug)) return false;
  const where = { slug };
  switch (section) {
    case "servicios":
      return !!(await db.service.findFirst({
        where: { ...where, published: true },
        select: { id: true },
      }));
    case "obras":
      return !!(await db.project.findFirst({
        where: { ...where, published: true },
        select: { id: true },
      }));
    case "blog":
      return !!(await db.blogPost.findFirst({
        where: { ...where, status: "PUBLISHED" },
        select: { id: true },
      }));
  }
}
