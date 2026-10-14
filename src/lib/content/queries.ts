import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { draftMode } from "next/headers";
import { db } from "@/lib/db";
import { mediaAssetSelect, toMediaAsset, type MediaAsset } from "@/lib/media/types";
import {
  pageContentSchemas,
  phonesSchema,
  socialsSchema,
  titledItemsSchema,
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

const titledItems = titledItemsSchema.catch([]);

function withCover<T extends { cover: Parameters<typeof toMediaAsset>[0] | null }>(p: T) {
  return { ...p, cover: p.cover ? toMediaAsset(p.cover) : null };
}

export async function getServiceSlugs() {
  "use cache";
  cached(TAGS.services);
  const rows = await db.service.findMany({ where: { published: true }, select: { slug: true } });
  return rows.map((r) => r.slug);
}

/** True when an admin enabled preview (draft mode): unpublished items become visible. */
async function isPreview() {
  return (await draftMode()).isEnabled;
}

export async function getServiceBySlug(slug: string) {
  "use cache";
  cached(TAGS.services, TAGS.projects, TAGS.categories, TAGS.media);
  const preview = await isPreview();
  const s = await db.service.findFirst({
    where: { slug, ...(preview ? {} : { published: true }) },
    include: {
      cover: { select: mediaAssetSelect },
      projects: {
        where: { published: true },
        orderBy: { order: "asc" },
        take: 4,
        select: projectCardSelect,
      },
    },
  });
  if (!s) return null;
  return {
    ...s,
    cover: s.cover ? toMediaAsset(s.cover) : null,
    whyItems: titledItems.parse(s.whyItems),
    steps: titledItems.parse(s.steps),
    projects: s.projects.map(withCover),
  };
}

// ─── Projects (listing + detail) ───────────────────────────────

export async function getProjects() {
  "use cache";
  cached(TAGS.projects, TAGS.categories, TAGS.services, TAGS.media);
  const projects = await db.project.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: projectCardSelect,
  });
  return projects.map(withCover);
}

/** Categories that have at least one published project. */
export async function getProjectCategories() {
  "use cache";
  cached(TAGS.categories, TAGS.projects);
  return db.projectCategory.findMany({
    where: { projects: { some: { published: true } } },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, name: true },
  });
}

export async function getProjectSlugs() {
  "use cache";
  cached(TAGS.projects);
  const rows = await db.project.findMany({ where: { published: true }, select: { slug: true } });
  return rows.map((r) => r.slug);
}

export async function getProjectBySlug(slug: string) {
  "use cache";
  cached(TAGS.projects, TAGS.categories, TAGS.services, TAGS.testimonials, TAGS.media);
  const preview = await isPreview();
  const p = await db.project.findFirst({
    where: { slug, ...(preview ? {} : { published: true }) },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      service: { select: { id: true, title: true, slug: true } },
      cover: { select: mediaAssetSelect },
      images: {
        orderBy: { order: "asc" },
        select: { id: true, caption: true, media: { select: mediaAssetSelect } },
      },
      testimonials: {
        where: { published: true },
        orderBy: { order: "asc" },
        take: 1,
        select: { quote: true, author: true, role: true },
      },
    },
  });
  if (!p) return null;

  const related = await db.project.findMany({
    where: {
      published: true,
      id: { not: p.id },
      OR: [{ categoryId: p.categoryId }, ...(p.serviceId ? [{ serviceId: p.serviceId }] : [])],
    },
    orderBy: { order: "asc" },
    take: 2,
    select: projectCardSelect,
  });

  return {
    ...p,
    cover: p.cover ? toMediaAsset(p.cover) : null,
    images: p.images.map((i) => ({ id: i.id, caption: i.caption, media: toMediaAsset(i.media) })),
    testimonial: p.testimonials[0] ?? null,
    related: related.map(withCover),
  };
}

// ─── Blog ──────────────────────────────────────────────────────

const postCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
  cover: { select: mediaAssetSelect },
} as const;

export async function getPosts() {
  "use cache";
  cached(TAGS.blog, TAGS.media);
  const posts = await db.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: postCardSelect,
  });
  return posts.map(withCover);
}

export type PostCardData = Awaited<ReturnType<typeof getPosts>>[number];

export async function getPostSlugs() {
  "use cache";
  cached(TAGS.blog);
  const rows = await db.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getPostBySlug(slug: string) {
  "use cache";
  cached(TAGS.blog, TAGS.media);
  const preview = await isPreview();
  const post = await db.blogPost.findFirst({
    where: { slug, ...(preview ? {} : { status: "PUBLISHED" }) },
    include: {
      cover: { select: mediaAssetSelect },
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { name: true } },
    },
  });
  if (!post) return null;

  const related = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: post.id },
      ...(post.categoryId ? { categoryId: post.categoryId } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: postCardSelect,
  });

  return {
    ...post,
    cover: post.cover ? toMediaAsset(post.cover) : null,
    related: related.map(withCover),
  };
}
