import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { mediaAssetSelect, toMediaAsset, type MediaAsset } from "@/lib/media/types";
import {
  pageContentSchemas,
  phonesSchema,
  socialsSchema,
  type PageContentData,
  type PageContentKey,
} from "./schemas";
import { TAGS } from "./tags";

/**
 * Public, cached reads. Every function tags its entry so admin writes can
 * invalidate precisely with updateTag(). Anything embedding media also gets
 * TAGS.media (alt text edits must propagate).
 */

function cached(...tags: string[]) {
  cacheLife("max");
  cacheTag(...tags);
}

// ─── Settings ──────────────────────────────────────────────────

export async function getSettings() {
  "use cache";
  cached(TAGS.settings, TAGS.media);

  const s = await db.siteSettings.findUnique({
    where: { id: 1 },
    include: {
      logo: { select: mediaAssetSelect },
      defaultOgImage: { select: mediaAssetSelect },
    },
  });
  if (!s) throw new Error("SiteSettings missing — run `pnpm db:seed`.");

  return {
    ...s,
    phones: phonesSchema.catch([]).parse(s.phones),
    socials: socialsSchema.catch([]).parse(s.socials),
    logo: s.logo ? toMediaAsset(s.logo) : null,
    defaultOgImage: s.defaultOgImage ? toMediaAsset(s.defaultOgImage) : null,
  };
}

export type SiteSettingsData = Awaited<ReturnType<typeof getSettings>>;

// ─── Page content ──────────────────────────────────────────────

/** Returns parsed content, or null when the block is unpublished or invalid. */
export async function getPageContent<K extends PageContentKey>(
  key: K,
): Promise<PageContentData<K> | null> {
  "use cache";
  cached(TAGS.page(key));

  const row = await db.pageContent.findUnique({ where: { key } });
  if (!row?.published) return null;
  const parsed = pageContentSchemas[key].safeParse(row.data);
  if (!parsed.success) {
    console.error(`[content] invalid data for ${key}`, parsed.error.issues);
    return null;
  }
  return parsed.data as PageContentData<K>;
}

export async function getMedia(id: string | null | undefined): Promise<MediaAsset | null> {
  "use cache";
  cached(TAGS.media);
  if (!id) return null;
  const m = await db.media.findUnique({ where: { id }, select: mediaAssetSelect });
  return m ? toMediaAsset(m) : null;
}

// ─── Home lists ────────────────────────────────────────────────

export async function getHighlights() {
  "use cache";
  cached(TAGS.homeLists);
  return db.highlight.findMany({ where: { published: true }, orderBy: { order: "asc" } });
}

export async function getMarqueeItems() {
  "use cache";
  cached(TAGS.homeLists);
  const items = await db.marqueeItem.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  return items.map((i) => i.text);
}

export async function getProcessSteps() {
  "use cache";
  cached(TAGS.homeLists);
  return db.processStep.findMany({ where: { published: true }, orderBy: { order: "asc" } });
}

export async function getValueItems() {
  "use cache";
  cached(TAGS.homeLists);
  return db.valueItem.findMany({ where: { published: true }, orderBy: { order: "asc" } });
}

export async function getClientLogos() {
  "use cache";
  cached(TAGS.clientLogos, TAGS.media);
  const logos = await db.clientLogo.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: { media: { select: mediaAssetSelect } },
  });
  return logos.map((l) => ({ ...l, media: toMediaAsset(l.media) }));
}

export async function getFeaturedTestimonial() {
  "use cache";
  cached(TAGS.testimonials);
  return db.testimonial.findFirst({
    where: { published: true, featured: true },
    orderBy: { order: "asc" },
    select: { id: true, quote: true, author: true, role: true },
  });
}

export async function getGallery() {
  "use cache";
  cached(TAGS.gallery, TAGS.media);
  const items = await db.galleryImage.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: { media: { select: mediaAssetSelect } },
  });
  return items.map((g) => ({
    id: g.id,
    caption: g.caption,
    shape: g.shape as "normal" | "tall" | "wide",
    media: toMediaAsset(g.media),
  }));
}

// ─── Services ──────────────────────────────────────────────────

export async function getServices() {
  "use cache";
  cached(TAGS.services, TAGS.media);
  const services = await db.service.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      icon: true,
      cover: { select: mediaAssetSelect },
    },
  });
  return services.map((s) => ({ ...s, cover: s.cover ? toMediaAsset(s.cover) : null }));
}

// ─── Projects ──────────────────────────────────────────────────

const projectCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  location: true,
  year: true,
  category: { select: { name: true, slug: true } },
  service: { select: { title: true, slug: true } },
  cover: { select: mediaAssetSelect },
} as const;

export async function getFeaturedProjects() {
  "use cache";
  cached(TAGS.projects, TAGS.categories, TAGS.services, TAGS.media);
  const projects = await db.project.findMany({
    where: { published: true, featured: true },
    orderBy: [{ featuredOrder: "asc" }, { order: "asc" }],
    select: projectCardSelect,
  });
  return projects.map((p) => ({ ...p, cover: p.cover ? toMediaAsset(p.cover) : null }));
}

export type ProjectCardData = Awaited<ReturnType<typeof getFeaturedProjects>>[number];
