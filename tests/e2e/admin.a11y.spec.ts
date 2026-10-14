import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PATHS = [
  "/admin",
  "/admin/consultas",
  "/admin/secciones",
  "/admin/obras",
  "/admin/obras/nueva",
  "/admin/servicios",
  "/admin/blog",
  "/admin/medios",
  "/admin/configuracion",
  "/admin/usuarios",
  "/admin/cuenta",
];

test("admin pages have no detectable WCAG A/AA violations", async ({ page }) => {
  test.setTimeout(120_000);
  const failures: string[] = [];
  for (const path of PATHS) {
    await page.goto(path);
    await page.getByRole("heading", { level: 1 }).waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    for (const v of results.violations) {
      failures.push(
        `${path} · ${v.id}: ${v.help}\n    ${v.nodes
          .slice(0, 3)
          .map((n) => `${n.html.slice(0, 120)} — ${(n.any[0]?.message ?? "").slice(0, 120)}`)
          .join("\n    ")}`,
      );
    }
  }
  expect(failures, failures.join("\n")).toEqual([]);
});
