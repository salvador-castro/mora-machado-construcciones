"use server";

import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { projectFormSchema } from "@/lib/admin/schemas";
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

export async function saveProject(
  id: string | null,
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = projectFormSchema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);
  const { images, ...rest } = parsed.data;
  const values = { ...rest, content: sanitizeRichText(rest.content) };

  try {
    const savedId = await db.$transaction(async (tx) => {
      let projectId = id;
      if (id) {
        const prev = await tx.project.findUniqueOrThrow({
          where: { id },
          select: { publishedAt: true },
        });
        await tx.project.update({
          where: { id },
          data: {
            ...values,
            publishedAt: values.published ? (prev.publishedAt ?? new Date()) : prev.publishedAt,
          },
        });
      } else {
        const { _max } = await tx.project.aggregate({ _max: { order: true } });
        projectId = (
          await tx.project.create({
            data: {
              ...values,
              order: (_max.order ?? -1) + 1,
              publishedAt: values.published ? new Date() : null,
            },
          })
        ).id;
      }
      // Replace the gallery with the submitted order/captions.
      await tx.projectImage.deleteMany({ where: { projectId: projectId! } });
      if (images.length) {
        await tx.projectImage.createMany({
          data: images.map((img, order) => ({
            projectId: projectId!,
            mediaId: img.mediaId,
            caption: img.caption,
            order,
          })),
        });
      }
      return projectId!;
    });
    await audit(user.id, id ? "update" : "create", "project", savedId);
    invalidate(...ENTITY_TAGS.project);
    return ok({ id: savedId }, id ? "Obra guardada." : "Obra creada.");
  } catch (err) {
    if (isUniqueViolation(err))
      return fail("Ese slug ya lo usa otra obra.", { slug: "Slug en uso" });
    throw err;
  }
}

export async function setProjectFlag(
  id: string,
  flag: "published" | "featured",
  value: boolean,
): Promise<ActionResult> {
  const user = await requireUser();
  const data =
    flag === "published"
      ? { published: value, ...(value ? { publishedAt: new Date() } : {}) }
      : { featured: value };
  if (flag === "published" && value) {
    const current = await db.project.findUnique({ where: { id }, select: { publishedAt: true } });
    if (current?.publishedAt) delete (data as { publishedAt?: Date }).publishedAt;
  }
  await db.project.update({ where: { id }, data });
  await audit(user.id, `${flag}:${value}`, "project", id);
  invalidate(...ENTITY_TAGS.project);
  return ok(undefined, "Guardado.");
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await db.project.delete({ where: { id } }); // images cascade; media stays in the library
  await audit(user.id, "delete", "project", id);
  invalidate(...ENTITY_TAGS.project);
  return ok(undefined, "Obra eliminada.");
}
