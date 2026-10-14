"use server";

import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { postFormSchema } from "@/lib/admin/schemas";
import { db } from "@/lib/db";
import { sanitizeRichText } from "@/lib/sanitize";
import {
  fail,
  fromZodError,
  invalidate,
  isUniqueViolation,
  ok,
  type ActionResult,
} from "../action-utils";
import { ENTITY_TAGS } from "../entity-tags";

/** "2026-10-14" → noon in Buenos Aires (avoids date shifting across time zones). */
function toDate(day: string) {
  return new Date(`${day}T12:00:00-03:00`);
}

export async function savePost(
  id: string | null,
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = postFormSchema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);
  const { publishedAt, ...rest } = parsed.data;
  const values = {
    ...rest,
    content: sanitizeRichText(rest.content),
    publishedAt: publishedAt
      ? toDate(publishedAt)
      : rest.status === "PUBLISHED"
        ? new Date()
        : null,
  };

  try {
    const saved = id
      ? await db.blogPost.update({ where: { id }, data: values })
      : await db.blogPost.create({ data: { ...values, authorId: user.id } });
    await audit(user.id, id ? "update" : "create", "blogPost", saved.id);
    invalidate(...ENTITY_TAGS.blogPost);
    return ok(
      { id: saved.id },
      rest.status === "PUBLISHED" ? "Nota publicada." : "Borrador guardado.",
    );
  } catch (err) {
    if (isUniqueViolation(err))
      return fail("Ese slug ya lo usa otra nota.", { slug: "Slug en uso" });
    throw err;
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await db.blogPost.delete({ where: { id } });
  await audit(user.id, "delete", "blogPost", id);
  invalidate(...ENTITY_TAGS.blogPost);
  return ok(undefined, "Nota eliminada.");
}
