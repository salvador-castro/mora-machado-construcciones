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
  offset: z.number().int().min(0).optional(),
});

/**
 * Saves a drag & drop order. Without `offset`, `ids` is the whole list. With it,
 * `ids` is one page of the list starting at that position (paginated admin
 * lists): it replaces that slice and the whole list is renumbered 0..n-1.
 */
export async function reorder(
  entity: SortableEntity,
  ids: string[],
  offset?: number,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = schema.safeParse({ entity, ids, offset });
  if (!parsed.success) return fail("Orden inválido.");

  // Each delegate has `findMany` / `update({ where: { id }, data: { order } })`.
  const delegate = db[parsed.data.entity] as unknown as {
    findMany: (args: { orderBy: object[]; select: { id: true } }) => Promise<{ id: string }[]>;
    update: (args: { where: { id: string }; data: { order: number } }) => Promise<unknown>;
  };
  let finalIds = parsed.data.ids;
  if (parsed.data.offset !== undefined) {
    const all = (
      await delegate.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true } })
    ).map((r) => r.id);
    const start = parsed.data.offset;
    const slice = all.slice(start, start + finalIds.length);
    const same = slice.length === finalIds.length && slice.every((id) => finalIds.includes(id));
    if (!same) return fail("La lista cambió mientras la ordenabas. Recargá la página.");
    finalIds = [...all.slice(0, start), ...finalIds, ...all.slice(start + finalIds.length)];
  }
  await db.$transaction(
    finalIds.map((id, order) => delegate.update({ where: { id }, data: { order } }) as never),
  );
  await audit(user.id, "reorder", parsed.data.entity);
  invalidate(...ENTITY_TAGS[parsed.data.entity]);
  return ok(undefined, "Orden guardado.");
}
