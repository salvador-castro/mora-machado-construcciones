/** Absolute URL on the public site (SITE_URL, no trailing slash). */
export function siteUrl(path = "/") {
  const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}
