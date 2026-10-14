import { expect, test } from "@playwright/test";

test("robots.txt points to the sitemap and blocks the admin", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("Disallow: /admin");
  expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
});

test("sitemap lists static pages and published content only", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const path of ["/servicios", "/obras", "/contacto", "/nosotros"]) {
    expect(xml).toContain(`${path}</loc>`);
  }
  expect(xml).toMatch(/\/servicios\/[a-z0-9-]+<\/loc>/);
  expect(xml).not.toContain("/admin");
});

test("home has canonical, OG tags, icons and organization JSON-LD", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https?:\/\/[^/]+\/?$/,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);

  const icon = page.locator('link[rel="icon"]').first();
  const iconRes = await page.request.get((await icon.getAttribute("href"))!);
  expect(iconRes.headers()["content-type"]).toBe("image/png");

  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const org = ld.map((t) => JSON.parse(t)).find((d) => d["@type"] === "GeneralContractor");
  expect(org?.name).toBeTruthy();
  expect(org?.telephone).toBeTruthy();
});

test("detail pages expose breadcrumbs JSON-LD", async ({ page, request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const service = xml.match(/<loc>([^<]+\/servicios\/[^<]+)<\/loc>/)![1]!;
  await page.goto(new URL(service).pathname);
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) =>
    JSON.parse(t),
  );
  const crumbs = ld.find((d) => d["@type"] === "BreadcrumbList");
  expect(crumbs.itemListElement[0].name).toBe("Inicio");
  expect(crumbs.itemListElement.length).toBeGreaterThanOrEqual(3);
});

test("security headers are set and the page loads without CSP violations", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (msg) => {
    if (/Content Security Policy|Refused to/i.test(msg.text())) violations.push(msg.text());
  });
  const res = await page.goto("/contacto");
  const h = res!.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-powered-by"]).toBeUndefined();
  await page.waitForLoadState("networkidle");
  expect(violations).toEqual([]);
});
