import { expect, test } from "@playwright/test";

test("add a featured testimonial, see it on the home, then delete it", async ({ page }) => {
  const author = `E2E ${Date.now()}`;
  await page.goto("/admin/testimonios");
  await page.getByRole("button", { name: "Agregar testimonio" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Testimonio").fill("Cumplieron los plazos y la obra quedó impecable.");
  await dialog.getByLabel("Autor").fill(author);
  await dialog.getByRole("switch").click(); // Destacado
  await dialog.getByRole("button", { name: "Agregar" }).click();
  await expect(page.getByText("Agregado.")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: author })).toBeVisible();

  const home = await page.request.get("/");
  expect(await home.text()).toContain(author);

  const row = page.getByRole("listitem").filter({ hasText: author });
  await row.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Eliminado.")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: author })).toHaveCount(0);

  const homeAfter = await page.request.get("/");
  expect(await homeAfter.text()).not.toContain(author);
});
