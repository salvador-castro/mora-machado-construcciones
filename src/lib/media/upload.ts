import "server-only";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import type { MediaListItem } from "./admin-types";
import {
  isVideoUpload,
  MediaError,
  processImage,
  processVideo,
  type MediaVariant,
} from "./process";
import { mediaUrl } from "./types";

export const altSchema = z
  .string()
  .trim()
  .min(
    3,
    "Describí la imagen o el video (mínimo 3 caracteres): es obligatorio para accesibilidad y SEO.",
  )
  .max(200);

export function toListItem(m: {
  id: string;
  alt: string;
  originalName: string;
  width: number;
  height: number;
  size: number;
  variants: unknown;
  path: string;
  videoPath: string | null;
  duration: number | null;
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
    videoUrl: m.videoPath ? mediaUrl(m.videoPath) : null,
    duration: m.duration,
    createdAt: m.createdAt.toISOString(),
  };
}

export const listSelect = {
  id: true,
  alt: true,
  originalName: true,
  width: true,
  height: true,
  size: true,
  variants: true,
  path: true,
  videoPath: true,
  duration: true,
  createdAt: true,
} as const;

export type UploadResult =
  { ok: true; item: MediaListItem; message: string } | { ok: false; error: string };

/**
 * Validates, processes and stores one uploaded file (image or video) for the
 * admin. Used by the upload route, which streams `onProgress` to the browser.
 */
export async function storeUpload(
  file: unknown,
  rawAlt: unknown,
  userId: string,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se recibió ningún archivo." };
  }
  const alt = altSchema.safeParse(rawAlt);
  if (!alt.success) return { ok: false, error: alt.error.issues[0].message };

  const video = isVideoUpload(file);
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const processed = video
      ? await processVideo(bytes, file.name, onProgress)
      : await processImage(bytes, file.name);
    const media = await db.media.create({ data: { ...processed, alt: alt.data } });
    await audit(userId, "create", "Media", media.id);
    return {
      ok: true,
      item: toListItem(media),
      message: video ? "Video subido." : "Imagen subida.",
    };
  } catch (err) {
    if (err instanceof MediaError) return { ok: false, error: err.message };
    console.error("[media] upload failed", err);
    return {
      ok: false,
      error: video ? "No se pudo procesar el video." : "No se pudo procesar la imagen.",
    };
  }
}
