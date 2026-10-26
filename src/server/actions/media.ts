"use server";

import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { TAGS } from "@/lib/content/tags";
import { db } from "@/lib/db";
import type { MediaListItem } from "@/lib/media/admin-types";
import { removeMediaFiles, type MediaVariant } from "@/lib/media/process";
import { altSchema, listSelect, toListItem } from "@/lib/media/upload";
import { getMediaUsage, type MediaUsage } from "@/lib/media/usage";
import { fail, invalidate, ok, type ActionResult } from "../action-utils";

/** `videos: false` lists images only (covers, logos, rich text: places that can't play a video). */
export async function listMedia(
  input: { q?: string; take?: number; cursor?: string; videos?: boolean } = {},
) {
  await requireUser();
  const q = input.q?.trim();
  const take = Math.min(input.take ?? 48, 100);
  const rows = await db.media.findMany({
    where: {
      ...(input.videos === false ? { videoPath: null } : {}),
      ...(q
        ? {
            OR: [
              { alt: { contains: q, mode: "insensitive" } },
              { originalName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    select: listSelect,
  });
  const hasMore = rows.length > take;
  const items = rows.slice(0, take).map(toListItem);
  return { items, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
}

export async function getMediaItems(ids: string[]): Promise<MediaListItem[]> {
  await requireUser();
  if (ids.length === 0) return [];
  const rows = await db.media.findMany({
    where: { id: { in: ids.slice(0, 100) } },
    select: listSelect,
  });
  const byId = new Map(rows.map((r) => [r.id, toListItem(r)]));
  return ids.map((id) => byId.get(id)).filter((m): m is MediaListItem => !!m);
}

export async function updateMediaAlt(id: string, alt: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = altSchema.safeParse(alt);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  await db.media.update({ where: { id }, data: { alt: parsed.data } });
  await audit(user.id, "update", "Media", id);
  invalidate(TAGS.media);
  return ok(undefined, "Texto alternativo actualizado.");
}

export async function mediaUsage(id: string): Promise<MediaUsage> {
  await requireUser();
  return getMediaUsage(id);
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const usage = await getMediaUsage(id);
  if (usage.length > 0) {
    return fail(`No se puede borrar: está en uso en ${usage.map((u) => u.label).join(", ")}.`);
  }
  const media = await db.media.findUnique({
    where: { id },
    select: { variants: true, path: true, videoPath: true },
  });
  if (!media) return fail("El archivo ya no existe.");
  await db.media.delete({ where: { id } });
  await removeMediaFiles([
    ...(media.variants as MediaVariant[]).map((v) => v.path),
    media.path,
    ...(media.videoPath ? [media.videoPath] : []),
  ]);
  await audit(user.id, "delete", "Media", id);
  return ok(undefined, media.videoPath ? "Video eliminado." : "Imagen eliminada.");
}
