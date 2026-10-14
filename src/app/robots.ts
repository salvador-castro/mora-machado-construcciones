import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  // Staging (e.g. nuevo.<dominio> before launch): keep it out of search engines.
  if (process.env.SITE_NOINDEX === "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/styleguide"] },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
