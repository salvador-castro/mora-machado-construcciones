"use server";

import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { richTextFields } from "@/lib/content/form-meta";
import { pageContentSchemas, type PageContentKey } from "@/lib/content/schemas";
import { TAGS } from "@/lib/content/tags";
import { db } from "@/lib/db";
import { sanitizeRichText } from "@/lib/sanitize";
import { fail, fromZodError, invalidate, ok, type ActionResult } from "../action-utils";

function isKey(key: string): key is PageContentKey {
  return Object.hasOwn(pageContentSchemas, key);
}

export async function saveSection(key: string, data: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!isKey(key)) return fail("Sección desconocida.");

  const schema = pageContentSchemas[key];
  const parsed = schema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);

  const value = { ...(parsed.data as Record<string, unknown>) };
  for (const field of richTextFields(schema)) {
    if (typeof value[field] === "string") value[field] = sanitizeRichText(value[field] as string);
  }

  await db.pageContent.upsert({
    where: { key },
    create: { key, data: value as object, updatedById: user.id },
    update: { data: value as object, updatedById: user.id },
  });
  await audit(user.id, "update", "PageContent", key);
  invalidate(TAGS.page(key));
  return ok(undefined, "Cambios guardados.");
}

export async function setSectionPublished(key: string, published: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (!isKey(key)) return fail("Sección desconocida.");
  await db.pageContent.update({ where: { key }, data: { published, updatedById: user.id } });
  await audit(user.id, published ? "publish" : "unpublish", "PageContent", key);
  invalidate(TAGS.page(key));
  return ok(undefined, published ? "Sección visible en el sitio." : "Sección oculta.");
}
