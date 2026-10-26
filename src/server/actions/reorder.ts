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

const moveSchema = z.object({
  entity: z.enum(SORTABLE),
  id: z.string().min(1),
  position: z.number().int().min(1),
});

/**
 * Moves one item to `position` (1-based, clamped to the list) and renumbers the
 * whole list: for long or paginated lists, where dragging from #50 to #1 isn't practical.
 */
export async function moveTo(
  entity: SortableEntity,
  id: string,
  position: number,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = moveSchema.safeParse({ entity, id, position });
  if (!parsed.success) return fail("Posición inválida.");

  const delegate = db[parsed.data.entity] as unknown as {
    findMany: (args: { orderBy: object[]; select: { id: true } }) => Promise<{ id: string }[]>;
    update: (args: { where: { id: string }; data: { order: number } }) => Promise<unknown>;
  };
  const ids = (
    await delegate.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true } })
  ).map((r) => r.id);
  const from = ids.indexOf(parsed.data.id);
  if (from === -1) return fail("Ya no existe. Recargá la página.");
  ids.splice(from, 1);
  const to = Math.min(parsed.data.position, ids.length + 1) - 1;
  ids.splice(to, 0, parsed.data.id);

  await db.$transaction(
    ids.map((rowId, order) => delegate.update({ where: { id: rowId }, data: { order } }) as never),
  );
  await audit(user.id, "reorder", parsed.data.entity, parsed.data.id);
  invalidate(...ENTITY_TAGS[parsed.data.entity]);
  return ok(undefined, `Ahora está en la posición ${to + 1}.`);
}
