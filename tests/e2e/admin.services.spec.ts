import { expect, test } from "@playwright/test";

test("create a service as draft, publish it, see it on the site, then delete it", async ({
  page,
}) => {
  const title = `Servicio E2E ${Date.now()}`;
  await page.goto("/admin/servicios/nuevo");
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await expect(page.getByLabel("Dirección (slug)")).toHaveValue(/^servicio-e2e-\d+$/);
  const slug = await page.getByLabel("Dirección (slug)").inputValue();
  await page.getByLabel("Descripción corta").fill("Descripción de prueba del servicio.");
  await page.getByRole("button", { name: "Agregar etapa" }).click();
  await page.locator("#f-steps-0-title").fill("Relevamiento");
  await page.locator("#f-steps-0-description").fill("Visitamos la obra.");
  await page.getByRole("button", { name: "Crear servicio" }).click();
  await expect(page.getByText("Servicio creado.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/servicios\/[a-z0-9]+$/);
  // The editor remounts on the [id] page; interact only once it's there.
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  // Unpublished → 404 on the public site.
  expect((await page.request.get(`/servicios/${slug}`)).status()).toBe(404);

  await page.getByRole("switch", { name: "Publicado" }).click();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Servicio guardado.")).toBeVisible();

  const res = await page.request.get(`/servicios/${slug}`);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain(title);
  expect(html).toContain("Relevamiento");

  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL(/\/admin\/servicios$/);
  await expect(page.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
  expect((await page.request.get(`/servicios/${slug}`)).status()).toBe(404);
});
