import { expect, test } from "@playwright/test";

test("a contact form submission shows up in the admin and can be followed up", async ({ page }) => {
  const name = `Lead E2E ${Date.now()}`;

  await page.goto("/contacto");
  const form = page.locator("#contacto form");
  await form.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(form.getByText("Ingresá tu nombre")).toBeVisible();

  await form.getByLabel("Nombre").fill(name);
  await form.getByLabel("Teléfono").fill("03487-555555");
  await form.getByLabel("Contanos sobre tu proyecto").fill("Quiero presupuestar una ampliación.");
  await form.getByLabel(/Acepto/).check();
  await form.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(page.getByText("¡Gracias! Recibimos tu consulta.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Seguir por WhatsApp" })).toHaveAttribute(
    "href",
    /wa\.me\/.+text=/,
  );

  // Open it from the panel menu, like a person would.
  await page.goto("/admin");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: /^Consultas/ })
    .click();
  await expect(page).toHaveURL(/\/admin\/consultas$/);
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Quiero presupuestar una ampliación." }),
  ).toBeVisible();
  await expect(page.getByText("/contacto", { exact: true })).toBeVisible();

  await page.getByRole("combobox", { name: "Estado" }).click();
  await page.getByRole("option", { name: "Contactada" }).click();
  await expect(page.getByText("Estado actualizado.")).toBeVisible();
  await page.getByRole("textbox", { name: "Notas internas" }).fill("Llamar el lunes.");
  await page.getByRole("button", { name: "Guardar notas" }).click();
  await expect(page.getByText("Notas guardadas.")).toBeVisible();

  const csv = await page.request.get(`/admin/consultas-export?q=${encodeURIComponent(name)}`);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const body = await csv.text();
  expect(body).toContain(name);
  expect(body).toContain("Contactada");
  expect(body).toContain("Llamar el lunes.");

  await page.getByRole("button", { name: "Eliminar consulta" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL(/\/admin\/consultas$/);
  await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
});

test("deleting a new lead updates the new-leads badge in the menu", async ({ page }) => {
  const name = `Lead badge E2E ${Date.now()}`;
  await page.goto("/contacto");
  const form = page.locator("#contacto form");
  await form.getByLabel("Nombre").fill(name);
  await form.getByLabel("Teléfono").fill("03487-555555");
  await form.getByLabel("Contanos sobre tu proyecto").fill("Consulta para probar el contador.");
  await form.getByLabel(/Acepto/).check();
  await form.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(page.getByText("¡Gracias! Recibimos tu consulta.")).toBeVisible();

  await page.goto("/admin");
  const menuLink = page.getByRole("navigation").getByRole("link", { name: /^Consultas/ });
  // "Consultas 3 nuevas" → 3; no badge when there are none.
  const badge = async () => Number((await menuLink.textContent())?.match(/\d+/)?.[0] ?? 0);
  const before = await badge();
  expect(before).toBeGreaterThan(0);

  await menuLink.click();
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "Eliminar consulta" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL(/\/admin\/consultas$/);
  // The badge lives in the panel layout, which client navigation doesn't re-render
  // (regression: it kept the old number until a reload).
  await expect.poll(badge).toBe(before - 1);
});

test("honeypot submissions are accepted silently but not stored", async ({ page }) => {
  const name = `Bot E2E ${Date.now()}`;
  await page.goto("/contacto");
  const form = page.locator("#contacto form");
  await form.getByLabel("Nombre").fill(name);
  await form.getByLabel("Teléfono").fill("1155555555");
  await form.getByLabel("Contanos sobre tu proyecto").fill("Mensaje automático de un bot.");
  await form.getByLabel(/Acepto/).check();
  await form.locator('input[name="website"]').fill("https://spam.example", { force: true });
  await form.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(page.getByText("¡Gracias! Recibimos tu consulta.")).toBeVisible();

  await page.goto(`/admin/consultas?q=${encodeURIComponent(name)}`);
  await expect(page.getByText("No hay consultas con ese filtro.")).toBeVisible();
});
