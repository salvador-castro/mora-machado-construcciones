"use server";

import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { LIST_ENTITIES, LIST_ENTITY_NAMES, type ListEntity } from "@/lib/admin/list-entities";
import { db } from "@/lib/db";
import {
  fail,
  fromZodError,
  invalidate,
  isUniqueViolation,
  ok,
  type ActionResult,
} from "../action-utils";
import { ENTITY_TAGS } from "../entity-tags";

type Delegate = {
  create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
  aggregate: (args: { _max: { order: true } }) => Promise<{ _max: { order: number | null } }>;
};

const entitySchema = z.enum(LIST_ENTITY_NAMES as [ListEntity, ...ListEntity[]]);

function delegate(entity: ListEntity) {
  return db[entity] as unknown as Delegate;
}

function isFkViolation(err: unknown) {
  return typeof err === "object" && err !== null && "code" in err && err.code === "P2003";
}

export async function saveListItem(
  entity: ListEntity,
  id: string | null,
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const e = entitySchema.parse(entity);
  const parsed = LIST_ENTITIES[e].schema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);
  const values = parsed.data as Record<string, unknown>;

  try {
    let savedId = id;
    if (id) {
      await delegate(e).update({ where: { id }, data: values });
    } else {
      const { _max } = await delegate(e).aggregate({ _max: { order: true } });
      savedId = (await delegate(e).create({ data: { ...values, order: (_max.order ?? -1) + 1 } }))
        .id;
    }
    await audit(user.id, id ? "update" : "create", e, savedId);
    invalidate(...ENTITY_TAGS[e]);
    return ok({ id: savedId! }, id ? "Cambios guardados." : "Agregado.");
  } catch (err) {
    if (isUniqueViolation(err))
      return fail("Ya existe otro con ese slug.", { slug: "Slug en uso" });
    throw err;
  }
}

export async function setListItemPublished(
  entity: ListEntity,
  id: string,
  published: boolean,
): Promise<ActionResult> {
  const user = await requireUser();
  const e = entitySchema.parse(entity);
  if (!LIST_ENTITIES[e].hasPublished) return fail("No aplica.");
  await delegate(e).update({ where: { id }, data: { published } });
  await audit(user.id, published ? "publish" : "unpublish", e, id);
  invalidate(...ENTITY_TAGS[e]);
  return ok(undefined, published ? "Visible en el sitio." : "Oculto.");
}

export async function deleteListItem(entity: ListEntity, id: string): Promise<ActionResult> {
  const user = await requireUser();
  const e = entitySchema.parse(entity);
  try {
    await delegate(e).delete({ where: { id } });
  } catch (err) {
    if (isFkViolation(err)) {
      return fail(
        "No se puede borrar porque tiene elementos asociados (por ejemplo, obras en esta categoría).",
      );
    }
    throw err;
  }
  await audit(user.id, "delete", e, id);
  invalidate(...ENTITY_TAGS[e]);
  return ok(undefined, "Eliminado.");
}

/** Bulk-add images to the home gallery (from the multi-select media picker). */
export async function addGalleryImages(mediaIds: string[]): Promise<ActionResult> {
  const user = await requireUser();
  const ids = z.array(z.string().min(1)).min(1).max(50).parse(mediaIds);
  const { _max } = await db.galleryImage.aggregate({ _max: { order: true } });
  const media = await db.media.findMany({
    where: { id: { in: ids } },
    select: { id: true, width: true, height: true },
  });
  let order = (_max.order ?? -1) + 1;
  await db.galleryImage.createMany({
    data: ids
      .map((id) => media.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => !!m)
      .map((m) => ({
        mediaId: m.id,
        order: order++,
        shape: m.height > m.width ? "tall" : "normal",
      })),
  });
  await audit(user.id, "create", "galleryImage");
  invalidate(...ENTITY_TAGS.galleryImage);
  return ok(undefined, ids.length === 1 ? "Imagen agregada." : `${ids.length} imágenes agregadas.`);
}
