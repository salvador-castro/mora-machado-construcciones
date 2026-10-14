import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

/** Target widths for responsive variants. Never upscaled. */
export const VARIANT_WIDTHS = [480, 960, 1600, 2400] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);
const MIME_BY_FORMAT: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export type MediaVariant = { width: number; height: number; path: string; size: number };

export type ProcessedMedia = {
  path: string;
  originalName: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  variants: MediaVariant[];
  blurDataUrl: string;
};

export class MediaError extends Error {}

export function uploadDir() {
  const dir = process.env.UPLOAD_DIR;
  if (!dir) throw new Error("UPLOAD_DIR is not set");
  return path.resolve(dir);
}

/**
 * Validates the real image format (not the client-provided mime), auto-rotates,
 * strips metadata and writes WebP variants to UPLOAD_DIR/<yyyy>/<mm>/<uuid>-<w>.webp.
 * Returned paths are relative to UPLOAD_DIR and served at /uploads/<path>.
 */
export async function processImage(input: Buffer, originalName: string): Promise<ProcessedMedia> {
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new MediaError("La imagen supera los 10 MB.");
  }

  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new MediaError("El archivo no es una imagen válida.");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new MediaError("Formato no permitido. Usá JPG, PNG, WebP o AVIF.");
  }

  // Normalize orientation once; all variants derive from this buffer.
  const base = sharp(input, { failOn: "error" }).rotate();
  const { data: oriented, info } = await base.toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;

  const now = new Date();
  const relDir = path.posix.join(
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const absDir = path.join(uploadDir(), relDir);
  await mkdir(absDir, { recursive: true });

  const id = randomUUID();
  const widths = [...new Set([...VARIANT_WIDTHS.filter((w) => w < width), width])].sort(
    (a, b) => a - b,
  );

  const variants: MediaVariant[] = [];
  try {
    for (const w of widths) {
      const { data, info: out } = await sharp(oriented)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      const rel = path.posix.join(relDir, `${id}-${w}.webp`);
      await writeFile(path.join(uploadDir(), rel), data, { mode: 0o644 });
      variants.push({ width: out.width, height: out.height, path: rel, size: out.size });
    }
  } catch (err) {
    await removeMediaFiles(variants.map((v) => v.path));
    throw err;
  }

  const blur = await sharp(oriented).resize(16).webp({ quality: 40 }).toBuffer();
  const largest = variants[variants.length - 1];

  return {
    path: largest.path,
    originalName: originalName.slice(0, 255),
    mime: MIME_BY_FORMAT[meta.format],
    size: input.byteLength,
    width,
    height,
    variants,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

/** Deletes variant files; ignores missing ones. Paths are relative to UPLOAD_DIR. */
export async function removeMediaFiles(relPaths: string[]) {
  const root = uploadDir();
  await Promise.all(
    relPaths.map(async (rel) => {
      const abs = path.resolve(root, rel);
      if (!abs.startsWith(root + path.sep)) return; // path traversal guard
      await rm(abs, { force: true });
    }),
  );
}
