/**
 * Generates web-ready brand assets from assets/brand/logo-original.png
 * (1024² PNG with transparency):
 *   logo-full.webp  — full logo, trimmed (footer, OG)
 *   logo-mark.webp  — "MM" mark only, trimmed (header)
 *   favicon.png     — mark centered on an ink square (512²), source for /site-icon.
 *                     Ink, not white: the white "M" disappears on white at 16–32 px.
 *   public/favicon.ico — 32/48 px fallback for browsers that request /favicon.ico
 *   pnpm brand:build
 */
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const SRC = "assets/brand/logo-original.png";
const OUT = "assets/brand";

/** Bounding box of pixels with alpha > threshold, optionally limited to rows [y0, y1). */
async function bbox(y0 = 0, y1 = Infinity) {
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -1, -1];
  for (let y = y0; y < Math.min(y1, info.height); y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3]! > 16) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** First fully transparent row below the mark separates "MM" from the wordmark. */
async function markBottom(top: number) {
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  for (let y = top; y < info.height; y++) {
    let empty = true;
    for (let x = 0; x < info.width && empty; x++)
      if (data[(y * info.width + x) * 4 + 3]! > 16) empty = false;
    if (empty) return y;
  }
  return info.height;
}

const full = await bbox();
const mark = await bbox(full.top, await markBottom(full.top));
const webp = { quality: 85, alphaQuality: 90, effort: 6 } as const;

await sharp(SRC).extract(full).webp(webp).toFile(`${OUT}/logo-full.webp`);
await sharp(SRC).extract(mark).webp(webp).toFile(`${OUT}/logo-mark.webp`);

// Favicon: mark at ~76% of the square, centered on ink (site text color).
const size = 512;
const inner = Math.round(size * 0.76);
const markPng = await sharp(SRC)
  .extract(mark)
  .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({ create: { width: size, height: size, channels: 4, background: "#111a0d" } })
  .composite([{ input: markPng, gravity: "center" }])
  .png()
  .toFile(`${OUT}/favicon.png`);

// favicon.ico (PNG-compressed entries, supported by all current browsers).
const sizes = [48, 32, 16];
const pngs = await Promise.all(
  sizes.map((s) => sharp(`${OUT}/favicon.png`).resize(s, s).png().toBuffer()),
);
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i]!.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i]!.length;
});
await writeFile("public/favicon.ico", Buffer.concat([header, ...pngs]));

console.log("full", full, "mark", mark);
