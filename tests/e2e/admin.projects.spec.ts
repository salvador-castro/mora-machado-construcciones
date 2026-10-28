import { expect, test } from "@playwright/test";

test("create a project with a gallery photo, publish it, then delete it", async ({ page }) => {
  const title = `Obra E2E ${Date.now()}`;
  await page.goto("/admin/obras/nueva");
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  const slug = await page.getByLabel("Dirección (slug)").inputValue();
  await page.getByLabel("Ubicación").fill("Zárate");
  await page.getByLabel("Año").fill("2024");
  await page.getByLabel("Resumen").fill("Resumen de la obra de prueba.");
  await page.getByRole("switch", { name: "Publicada" }).click();

  await page.getByRole("button", { name: "Agregar fotos o videos" }).click();
  const picker = page.getByRole("dialog");
  await picker.locator("button[aria-pressed]").first().click();
  await picker.getByRole("button", { name: /^Agregar 1/ }).click();
  await page.getByLabel("Epígrafe de la foto 1").fill("Epígrafe E2E");
  await expect(page.getByRole("heading", { name: "Galería (1)" })).toBeVisible();

  await page.getByRole("button", { name: "Crear obra" }).click();
  await expect(page.getByText("Obra creada.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/obras\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Epígrafe de la foto 1" })).toHaveValue(
    "Epígrafe E2E",
  );

  const res = await page.request.get(`/obras/${slug}`);
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain(title);

  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL(/\/admin\/obras$/);
  expect((await page.request.get(`/obras/${slug}`)).status()).toBe(404);
});

test("the projects list can be searched and filtered", async ({ page }) => {
  await page.goto("/admin/obras");
  const list = page.getByRole("main");
  await expect(
    list.getByRole("button", { name: "Arrastrar para reordenar" }).first(),
  ).toBeVisible();

  await page.getByRole("textbox", { name: "Buscar obras" }).fill("pádel");
  await page.getByRole("textbox", { name: "Buscar obras" }).press("Enter");
  await expect(page).toHaveURL(/q=p%C3%A1del/);
  await expect(list.getByRole("link", { name: /Cancha de pádel/ })).toBeVisible();
  await expect(list.getByRole("link", { name: /Encofrado/ })).toHaveCount(0);
  // A filtered list can't be reordered: its order isn't the real one.
  await expect(list.getByRole("button", { name: "Arrastrar para reordenar" })).toHaveCount(0);

  await page.goto("/admin/obras?estado=ocultas");
  for (const row of await list.getByRole("switch").all()) {
    await expect(row).not.toBeChecked();
  }
  await page.goto("/admin/obras?q=no-existe-esta-obra");
  await expect(page.getByText("No hay obras con ese filtro.")).toBeVisible();
});

test("a project can be moved to any position (long lists)", async ({ page }) => {
  await page.goto("/admin/obras");
  const list = page.getByRole("main").getByRole("listitem");
  const last = list.last();
  const title = (await last.locator("a span.font-medium").innerText()).trim();
  const lastPos = Number((await last.getByText(/^#\d+$/).innerText()).slice(1));

  await last.getByRole("button", { name: `Mover «${title}»` }).click();
  await page.getByRole("button", { name: "Al principio" }).click();
  await expect(page.getByText("Ahora está en la posición 1.")).toBeVisible();
  await expect(list.first().locator("a span.font-medium")).toHaveText(title);

  // Put it back where it was, typing the position.
  await list
    .first()
    .getByRole("button", { name: `Mover «${title}»` })
    .click();
  await page.getByRole("spinbutton", { name: "Nueva posición" }).fill(String(lastPos));
  await page.getByRole("button", { name: "Mover", exact: true }).click();
  await expect(page.getByText(`Ahora está en la posición ${lastPos}.`)).toBeVisible();
  await expect(list.last().locator("a span.font-medium")).toHaveText(title);
});
