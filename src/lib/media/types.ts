import type { MediaVariant } from "./process";

/** Subset of Media needed to render an image on the public site. */
export type MediaAsset = {
  id: string;
  width: number;
  height: number;
  alt: string;
  variants: MediaVariant[];
  blurDataUrl: string | null;
};

export const mediaAssetSelect = {
  id: true,
  width: true,
  height: true,
  alt: true,
  variants: true,
  blurDataUrl: true,
} as const;

export function toMediaAsset(m: {
  id: string;
  width: number;
  height: number;
  alt: string;
  variants: unknown;
  blurDataUrl: string | null;
}): MediaAsset {
  return { ...m, variants: m.variants as MediaVariant[] };
}

export function mediaUrl(relPath: string) {
  return `/uploads/${relPath}`;
}
