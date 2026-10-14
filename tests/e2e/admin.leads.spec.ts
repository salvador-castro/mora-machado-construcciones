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

  await page.goto("/admin/consultas?estado=NEW");
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
