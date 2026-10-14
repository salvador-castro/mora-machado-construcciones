import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

/**
 * Enables Draft Mode for the logged-in admin and opens the public page of an
 * item, so unpublished content can be previewed. The redirect target comes
 * from the DB (never from the query string) to avoid open redirects.
 *   /admin/preview?type=post|project|service&id=<id>
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id") ?? "";

  let path: string | null = null;
  if (type === "post") {
    const p = await db.blogPost.findUnique({ where: { id }, select: { slug: true } });
    path = p && `/blog/${p.slug}`;
  } else if (type === "project") {
    const p = await db.project.findUnique({ where: { id }, select: { slug: true } });
    path = p && `/obras/${p.slug}`;
  } else if (type === "service") {
    const s = await db.service.findUnique({ where: { id }, select: { slug: true } });
    path = s && `/servicios/${s.slug}`;
  }
  if (!path) return new Response("No encontrado", { status: 404 });

  (await draftMode()).enable();
  redirect(path);
}
