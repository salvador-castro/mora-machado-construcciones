"use server";

import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { TAGS } from "@/lib/content/tags";
import { db } from "@/lib/db";
import type { MediaListItem } from "@/lib/media/admin-types";
import { MediaError, processImage, removeMediaFiles, type MediaVariant } from "@/lib/media/process";
import { mediaUrl } from "@/lib/media/types";
import { getMediaUsage, type MediaUsage } from "@/lib/media/usage";
import { fail, invalidate, ok, type ActionResult } from "../action-utils";

const altSchema = z
  .string()
  .trim()
  .min(3, "Describí la imagen (mínimo 3 caracteres): es obligatorio para accesibilidad y SEO.")
  .max(200);

function toListItem(m: {
  id: string;
  alt: string;
  originalName: string;
  width: number;
  height: number;
  size: number;
  variants: unknown;
  path: string;
  createdAt: Date;
}): MediaListItem {
  const variants = m.variants as MediaVariant[];
  const thumb = variants.find((v) => v.width >= 400) ?? variants[variants.length - 1];
  const large = [...variants].reverse().find((v) => v.width <= 1600) ?? thumb;
  return {
    id: m.id,
    alt: m.alt,
    originalName: m.originalName,
    width: m.width,
    height: m.height,
    size: m.size,
    thumbUrl: mediaUrl(thumb?.path ?? m.path),
    largeUrl: mediaUrl(large?.path ?? m.path),
    createdAt: m.createdAt.toISOString(),
  };
}

const listSelect = {
  id: true,
  alt: true,
  originalName: true,
  width: true,
  height: true,
  size: true,
  variants: true,
  path: true,
  createdAt: true,
} as const;

export async function listMedia(input: { q?: string; take?: number; cursor?: string } = {}) {
  await requireUser();
  const q = input.q?.trim();
  const take = Math.min(input.take ?? 48, 100);
  const rows = await db.media.findMany({
    where: q
      ? {
          OR: [
            { alt: { contains: q, mode: "insensitive" } },
            { originalName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
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

/** One file per call (keeps each request under the body size limit). */
export async function uploadMedia(formData: FormData): Promise<ActionResult<MediaListItem>> {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("No se recibió ningún archivo.");

  const alt = altSchema.safeParse(formData.get("alt"));
  if (!alt.success) return fail(alt.error.issues[0].message, { alt: alt.error.issues[0].message });

  try {
    const processed = await processImage(Buffer.from(await file.arrayBuffer()), file.name);
    const media = await db.media.create({ data: { ...processed, alt: alt.data } });
    await audit(user.id, "create", "Media", media.id);
    return ok(toListItem(media), "Imagen subida.");
  } catch (err) {
    if (err instanceof MediaError) return fail(err.message);
    console.error("[media] upload failed", err);
    return fail("No se pudo procesar la imagen.");
  }
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
    select: { variants: true, path: true },
  });
  if (!media) return fail("La imagen ya no existe.");
  await db.media.delete({ where: { id } });
  await removeMediaFiles([...(media.variants as MediaVariant[]).map((v) => v.path), media.path]);
  await audit(user.id, "delete", "Media", id);
  return ok(undefined, "Imagen eliminada.");
}
