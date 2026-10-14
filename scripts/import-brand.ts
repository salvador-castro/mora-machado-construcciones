/**
 * Imports the brand assets (assets/brand, see `pnpm brand:build`) into the media
 * library and assigns them in SiteSettings when logo/favicon are still empty
 * (never overwrites what was chosen in the admin).
 *
 * Idempotent (matched by originalName). Usage: `pnpm brand:import`
 */
import "dotenv/config";
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
    const name = `brand-${file}`;
    const existing = await db.media.findFirst({ where: { originalName: name } });
    if (existing) {
      ids[key] = existing.id;
      continue;
    }
    const processed = await processImage(await readFile(`assets/brand/${file}`), name);
    ids[key] = (await db.media.create({ data: { ...processed, alt } })).id;
    console.log(`  ✓ ${key}`);
  }

  const settings = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (settings) {
    await db.siteSettings.update({
      where: { id: 1 },
      data: {
        logoId: settings.logoId ?? ids.mark,
        faviconId: settings.faviconId ?? ids.favicon,
      },
    });
  }
  return ids;
}

if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  const db = createPrismaClient();
  importBrandAssets(db)
    .then(() => console.log("Logo e ícono importados."))
    .finally(() => db.$disconnect());
}
