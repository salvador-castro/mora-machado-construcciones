import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { accentForeground } from "@/lib/color";
import { getSettings } from "@/lib/content/queries";
import { uploadDir } from "@/lib/media/process";

const SIZES = new Set([32, 180, 192, 512]);

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Site icon (favicon / apple-touch / PWA) as PNG: the favicon from Settings
 * cropped to a square, or a monogram on the accent color until one is uploaded.
 *   /site-icon?s=32|180|192|512&v=<version>
 */
export async function GET(request: Request) {
  const s = Number(new URL(request.url).searchParams.get("s"));
  const size = SIZES.has(s) ? s : 512;
  const settings = await getSettings();

  let input: Buffer;
  const variant = settings.favicon?.variants.at(-1);
  if (variant) {
    const root = uploadDir();
    const abs = path.resolve(root, variant.path);
    if (!abs.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
    input = await readFile(abs);
  } else {
    const bg = settings.accentColor;
    const fg = accentForeground(bg);
    input = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <rect width="512" height="512" fill="${escapeXml(bg)}"/>
        <text x="256" y="256" dy="0.35em" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
          font-weight="700" font-size="220" letter-spacing="-8" fill="${escapeXml(fg)}">${escapeXml(initials(settings.brandName))}</text>
      </svg>`,
    );
  }

  const png = await sharp(input).resize(size, size, { fit: "cover" }).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // URLs carry ?v=<version>, so they can be cached for long.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
