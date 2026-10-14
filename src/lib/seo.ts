import type { Metadata } from "next";
import { getSettings } from "@/lib/content/queries";
import { mediaUrl, type MediaAsset } from "@/lib/media/types";
import { siteUrl } from "@/lib/site-url";

export { siteUrl };

/** Largest variant ≤ 1600px for OG (1200×630 is ideal; we keep aspect ratio). */
function ogImage(media: MediaAsset) {
  const v =
    [...media.variants].reverse().find((x) => x.width <= 1600) ??
    media.variants[media.variants.length - 1];
  return v
    ? { url: siteUrl(mediaUrl(v.path)), width: v.width, height: v.height, alt: media.alt }
    : undefined;
}

/**
 * Per-page metadata with canonical, Open Graph and Twitter cards.
 * Falls back to SiteSettings defaults for description and image.
 */
export async function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
}: {
  title?: string | null;
  description?: string | null;
  path: string;
  image?: MediaAsset | null;
  type?: "website" | "article";
  noindex?: boolean;
}): Promise<Metadata> {
  const settings = await getSettings();
  const desc = description || settings.defaultSeoDescription;
  const img = image ?? settings.defaultOgImage;
  const og = img ? ogImage(img) : undefined;
  const fullTitle = title ? `${title} | ${settings.brandName}` : settings.defaultSeoTitle;

  return {
    ...(title ? { title } : { title: { absolute: settings.defaultSeoTitle } }),
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "es_AR",
      siteName: settings.brandName,
      title: fullTitle,
      description: desc,
      url: path,
      images: og ? [og] : undefined,
    },
    twitter: {
      card: og ? "summary_large_image" : "summary",
      title: fullTitle,
      description: desc,
      images: og ? [og.url] : undefined,
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

/** Absolute URL of the largest variant ≤ 1600px (for JSON-LD images). */
export function mediaAbsoluteUrl(media: MediaAsset | null | undefined) {
  return media ? ogImage(media)?.url : undefined;
}
