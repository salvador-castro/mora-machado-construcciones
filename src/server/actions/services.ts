"use server";

import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { serviceFormSchema } from "@/lib/admin/schemas";
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

export async function saveService(
  id: string | null,
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = serviceFormSchema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);
  const values = { ...parsed.data, content: sanitizeRichText(parsed.data.content) };

  try {
    let savedId = id;
    if (id) {
      await db.service.update({ where: { id }, data: values });
    } else {
      const { _max } = await db.service.aggregate({ _max: { order: true } });
      savedId = (await db.service.create({ data: { ...values, order: (_max.order ?? -1) + 1 } }))
        .id;
    }
    await audit(user.id, id ? "update" : "create", "service", savedId);
    invalidate(...ENTITY_TAGS.service);
    return ok({ id: savedId! }, id ? "Servicio guardado." : "Servicio creado.");
  } catch (err) {
    if (isUniqueViolation(err))
      return fail("Ese slug ya lo usa otro servicio.", { slug: "Slug en uso" });
    throw err;
  }
}

export async function deleteService(id: string): Promise<ActionResult> {
  const user = await requireUser("ADMIN");
  await db.service.delete({ where: { id } }); // projects keep existing (serviceId → null)
  await audit(user.id, "delete", "service", id);
  invalidate(...ENTITY_TAGS.service);
  return ok(undefined, "Servicio eliminado.");
}

export async function setServicePublished(id: string, published: boolean): Promise<ActionResult> {
  const user = await requireUser();
  await db.service.update({ where: { id }, data: { published } });
  await audit(user.id, `published:${published}`, "service", id);
  invalidate(...ENTITY_TAGS.service);
  return ok(undefined, published ? "Servicio visible." : "Servicio oculto.");
}
