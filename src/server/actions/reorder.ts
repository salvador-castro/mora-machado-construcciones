"use server";

import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fail, invalidate, ok, type ActionResult } from "../action-utils";
import { ENTITY_TAGS } from "../entity-tags";

/** Whitelisted sortable entities. */
const SORTABLE = [
  "service",
  "project",
  "projectCategory",
  "processStep",
  "valueItem",
  "highlight",
  "marqueeItem",
  "clientLogo",
  "testimonial",
  "galleryImage",
  "blogCategory",
] as const satisfies (keyof typeof ENTITY_TAGS)[];

export type SortableEntity = (typeof SORTABLE)[number];

const schema = z.object({
  entity: z.enum(SORTABLE),
  ids: z.array(z.string().min(1)).max(500),
});

export async function reorder(entity: SortableEntity, ids: string[]): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = schema.safeParse({ entity, ids });
  if (!parsed.success) return fail("Orden inválido.");

  // Each delegate has `update({ where: { id }, data: { order } })`.
  const delegate = db[parsed.data.entity] as unknown as {
    update: (args: { where: { id: string }; data: { order: number } }) => Promise<unknown>;
  };
  await db.$transaction(
    parsed.data.ids.map(
      (id, order) => delegate.update({ where: { id }, data: { order } }) as never,
    ),
  );
  await audit(user.id, "reorder", parsed.data.entity);
  invalidate(...ENTITY_TAGS[parsed.data.entity]);
  return ok(undefined, "Orden guardado.");
}
