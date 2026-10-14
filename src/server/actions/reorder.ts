"use server";

import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { TAGS } from "@/lib/content/tags";
import { db } from "@/lib/db";
import { fail, invalidate, ok, type ActionResult } from "../action-utils";

/** Whitelisted sortable entities → Prisma model + cache tags to invalidate. */
const ENTITIES = {
  service: { tags: [TAGS.services] },
  project: { tags: [TAGS.projects] },
  projectCategory: { tags: [TAGS.categories] },
  processStep: { tags: [TAGS.homeLists] },
  valueItem: { tags: [TAGS.homeLists] },
  highlight: { tags: [TAGS.homeLists] },
  marqueeItem: { tags: [TAGS.homeLists] },
  clientLogo: { tags: [TAGS.clientLogos] },
  testimonial: { tags: [TAGS.testimonials] },
  galleryImage: { tags: [TAGS.gallery] },
  blogCategory: { tags: [TAGS.blog] },
} as const;

export type SortableEntity = keyof typeof ENTITIES;

const schema = z.object({
  entity: z.enum(Object.keys(ENTITIES) as [SortableEntity, ...SortableEntity[]]),
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
  invalidate(...ENTITIES[parsed.data.entity].tags);
  return ok(undefined, "Orden guardado.");
}
