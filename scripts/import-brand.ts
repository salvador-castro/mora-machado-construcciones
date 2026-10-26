/**
 * Imports the brand assets (assets/brand, see `pnpm brand:build`) into the media
 * library and assigns them in SiteSettings when logo/favicon are empty or still
 * point to an older brand asset (never overwrites an image chosen in the admin).
 *
 * Idempotent: each version is named after a hash of its content, so a new logo
 * gets imported once and replaces the previous brand one. Runs on every deploy
 * (from `pnpm db:seed`). Usage: `pnpm brand:import`
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "@/lib/db-client";
import { processImage } from "@/lib/media/process";

const ASSETS = {
  mark: { file: "logo-mark.webp", alt: "Mora Machado Construcciones" },
  full: { file: "logo-full.webp", alt: "Logo de Mora Machado Construcciones" },
  favicon: { file: "favicon.png", alt: "Ícono del sitio" },
} as const;

type Key = keyof typeof ASSETS;

export async function importBrandAssets(db: PrismaClient) {
  const ids = {} as Record<Key, string>;
  for (const [key, { file, alt }] of Object.entries(ASSETS) as [Key, (typeof ASSETS)[Key]][]) {
    const bytes = await readFile(`assets/brand/${file}`);
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
    const name = `brand-${hash}-${file}`;
    const existing = await db.media.findFirst({ where: { originalName: name } });
    if (existing) {
      ids[key] = existing.id;
      continue;
    }
    const processed = await processImage(bytes, name);
    ids[key] = (await db.media.create({ data: { ...processed, alt } })).id;
    console.log(`  ✓ ${key}`);
  }

  const settings = await db.siteSettings.findUnique({
    where: { id: 1 },
    select: {
      logo: { select: { id: true, originalName: true } },
      favicon: { select: { id: true, originalName: true } },
    },
  });
  if (settings) {
    // Replace only what is empty or an older brand asset (not an admin upload).
    const pick = (current: { id: string; originalName: string } | null, next: string) =>
      !current || current.originalName.startsWith("brand-") ? next : current.id;
    const logoId = pick(settings.logo, ids.mark);
    const faviconId = pick(settings.favicon, ids.favicon);
    if (logoId !== settings.logo?.id || faviconId !== settings.favicon?.id) {
      await db.siteSettings.update({ where: { id: 1 }, data: { logoId, faviconId } });
      console.log("  ✓ logo e ícono asignados en Configuración");
    }
  }
  return ids;
}

if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  const db = createPrismaClient();
  importBrandAssets(db)
    .then(() => console.log("Logo e ícono importados."))
    .finally(() => db.$disconnect());
}
