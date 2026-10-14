/**
 * Imports the 11 photos from the legacy static site into the media library.
 *
 * Source, in order:
 *  1. git history of this repo (commit LEGACY_REF, the last static-site version)
 *  2. the live legacy site (https://moramachadoconstrucciones.com/public/img/…)
 *
 * Idempotent: images already imported (matched by originalName) are reused.
 * Usage: `pnpm tsx scripts/import-legacy-images.ts`
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "@/lib/db-client";
import { processImage } from "@/lib/media/process";

const LEGACY_REF = "39b8b90";
const LEGACY_SITE = "https://moramachadoconstrucciones.com";

/** Keys are stable handles used by the seed; alts come from the legacy HTML. */
export const LEGACY_IMAGES = {
  pool: {
    file: "WhatsApp-Image-2026-04-29-at-12.29.42-AM-1.webp",
    alt: "Solado exterior y entorno de piscina en vivienda",
  },
  padel: {
    file: "WhatsApp-Image-2026-04-29-at-12.29.39-AM.webp",
    alt: "Cancha de pádel en construcción",
  },
  curvedWall: {
    file: "WhatsApp-Image-2026-04-29-at-12.29.41-AM-2.webp",
    alt: "Muro curvo de hormigón con encofrado",
  },
  formwork: {
    file: "WhatsApp-Image-2026-04-29-at-12.29.40-AM-3.webp",
    alt: "Encofrado en obra nueva",
  },
  inProgress: {
    file: "WhatsApp-Image-2026-04-29-at-12.29.40-AM-2.webp",
    alt: "Obra en proceso constructivo",
  },
  concrete: { file: "WhatsApp-Image-2026-04-29-at-12.29.41-AM.webp", alt: "Encofrado y hormigón" },
  detail1: { file: "WhatsApp-Image-2026-04-29-at-12.29.40-AM-1.webp", alt: "Detalle de obra" },
  detail2: { file: "WhatsApp-Image-2026-04-29-at-12.29.42-AM.webp", alt: "Detalle de obra" },
  detail3: { file: "WhatsApp-Image-2026-04-29-at-12.29.40-AM.webp", alt: "Detalle de obra" },
  detail4: { file: "WhatsApp-Image-2026-04-29-at-12.29.41-AM-3.webp", alt: "Detalle de obra" },
  detail5: { file: "WhatsApp-Image-2026-04-29-at-12.29.41-AM-4.webp", alt: "Detalle de obra" },
} as const;

export type LegacyImageKey = keyof typeof LEGACY_IMAGES;
export type LegacyMedia = Record<LegacyImageKey, { id: string; width: number; height: number }>;

async function readLegacyFile(file: string): Promise<Buffer> {
  try {
    return execFileSync("git", ["show", `${LEGACY_REF}:public/img/${file}`], {
      maxBuffer: 20 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    const res = await fetch(`${LEGACY_SITE}/public/img/${encodeURIComponent(file)}`);
    if (!res.ok) throw new Error(`Could not fetch ${file}: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export async function importLegacyImages(db: PrismaClient): Promise<LegacyMedia> {
  const result = {} as LegacyMedia;

  for (const [key, { file, alt }] of Object.entries(LEGACY_IMAGES) as [
    LegacyImageKey,
    { file: string; alt: string },
  ][]) {
    const existing = await db.media.findFirst({ where: { originalName: file } });
    if (existing) {
      result[key] = existing;
      continue;
    }
    const processed = await processImage(await readLegacyFile(file), file);
    const media = await db.media.create({ data: { ...processed, alt } });
    result[key] = media;
    console.log(`  ✓ ${key} (${media.width}×${media.height})`);
  }

  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = createPrismaClient();
  importLegacyImages(db)
    .then((m) => console.log(`Imported/reused ${Object.keys(m).length} images.`))
    .finally(() => db.$disconnect());
}
