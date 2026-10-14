import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/content/queries";
import { siteUrl } from "@/lib/site-url";

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { services, projects, posts, pages } = await getSitemapData();
  const pageDate = (prefix: string) => {
    const dates = pages
      .filter((p) => p.published && (p.key === prefix || p.key.startsWith(`${prefix}.`)))
      .map((p) => p.updatedAt.getTime());
    return dates.length ? new Date(Math.max(...dates)) : undefined;
  };
  const latest = (rows: { updatedAt: Date }[]) =>
    rows.length ? new Date(Math.max(...rows.map((r) => r.updatedAt.getTime()))) : undefined;
  const isPublished = (key: string) => pages.some((p) => p.key === key && p.published);

  const statics: Entry[] = [
    { url: siteUrl("/"), lastModified: pageDate("home"), priority: 1 },
    { url: siteUrl("/servicios"), lastModified: latest(services), priority: 0.9 },
    { url: siteUrl("/obras"), lastModified: latest(projects), priority: 0.9 },
    { url: siteUrl("/nosotros"), lastModified: pageDate("about"), priority: 0.7 },
    { url: siteUrl("/contacto"), lastModified: pageDate("contact"), priority: 0.8 },
    ...(posts.length
      ? [{ url: siteUrl("/blog"), lastModified: latest(posts), priority: 0.6 }]
      : []),
    ...(isPublished("legal.privacy")
      ? [{ url: siteUrl("/legales/privacidad"), lastModified: pageDate("legal"), priority: 0.2 }]
      : []),
  ];

  return [
    ...statics,
    ...services.map((s) => ({
      url: siteUrl(`/servicios/${s.slug}`),
      lastModified: s.updatedAt,
      priority: 0.8,
    })),
    ...projects.map((p) => ({
      url: siteUrl(`/obras/${p.slug}`),
      lastModified: p.updatedAt,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: siteUrl(`/blog/${p.slug}`),
      lastModified: p.updatedAt,
      priority: 0.5,
    })),
  ];
}
