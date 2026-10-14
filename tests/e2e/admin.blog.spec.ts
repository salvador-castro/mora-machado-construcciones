import { expect, test } from "@playwright/test";

test("draft posts stay hidden until published", async ({ page }) => {
  const title = `Nota E2E ${Date.now()}`;
  await page.goto("/admin/blog/nueva");
  await page.getByLabel("Título", { exact: true }).fill(title);
  const slug = await page.getByLabel("Dirección (slug)").inputValue();
  await page.getByLabel("Bajada").fill("Bajada de prueba.");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByText("Borrador guardado.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/blog\/[a-z0-9]+$/);
  expect((await page.request.get(`/blog/${slug}`)).status()).toBe(404);

  // Publishing without content is rejected.
  await page.getByLabel("Estado").click();
  await page.getByRole("option", { name: "Publicada" }).click();
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("Para publicar, la nota necesita contenido.")).toBeVisible();

  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Contenido de la nota de prueba.");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("Nota publicada.")).toBeVisible();

  const res = await page.request.get(`/blog/${slug}`);
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("Contenido de la nota de prueba.");

  await page.goto("/admin/blog");
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL(/\/admin\/blog$/);
  expect((await page.request.get(`/blog/${slug}`)).status()).toBe(404);
});

test("blog categories tab", async ({ page }) => {
  await page.goto("/admin/blog?tab=categorias");
  await expect(page.getByRole("button", { name: "Agregar categoría" })).toBeVisible();
});
