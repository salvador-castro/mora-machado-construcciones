import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Public paths to audit; detail pages are discovered from the sitemap. */
async function auditPaths(page: Page) {
  const xml = await (await page.request.get("/sitemap.xml")).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  const firstOf = (prefix: string) => urls.find((u) => u.startsWith(prefix));
  return [
    "/",
    "/servicios",
    firstOf("/servicios/"),
    "/obras",
    firstOf("/obras/"),
    "/blog",
    firstOf("/blog/"),
    "/nosotros",
    "/contacto",
    "/no-existe",
  ].filter((p): p is string => !!p);
}

test("public pages have no detectable WCAG A/AA violations", async ({ page }) => {
  test.setTimeout(120_000);
  const failures: string[] = [];

  for (const path of await auditPaths(page)) {
    await page.goto(path);
    // Reveal animations are skipped with reduced motion; content is fully visible.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("iframe")
      .analyze();
    for (const v of results.violations) {
      failures.push(
        `${path} · ${v.id} (${v.impact}): ${v.help}\n    ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join("\n    ")}`,
      );
    }
  }
  expect(failures, failures.join("\n")).toEqual([]);
});

test("every page has one h1, a lang and a title", async ({ page }) => {
  for (const path of await auditPaths(page)) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
    expect((await page.title()).length, path).toBeGreaterThan(5);
  }
});
