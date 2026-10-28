import { expect, test } from "@playwright/test";

test("create an editor, who can log in but not manage users; then delete", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const email = `e2e-${stamp}@example.com`;
  const name = `Editor E2E ${stamp}`;

  await page.goto("/admin/usuarios");
  await page.getByRole("button", { name: "Nuevo usuario" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre").fill(name);
  await dialog.getByLabel("Email").fill(email);
  await dialog.getByLabel("Contraseña", { exact: true }).fill("corta");
  await dialog.getByRole("button", { name: "Crear usuario" }).click();
  await expect(dialog.getByText(/Mínimo \d+ caracteres/).last()).toBeVisible();
  await dialog.getByLabel("Contraseña", { exact: true }).fill("editor-e2e-password");
  await dialog.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByText("Usuario creado.")).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();

  // Log in as the editor in a fresh context.
  const ctx = await browser.newContext({ storageState: undefined });
  const editor = await ctx.newPage();
  await editor.goto("/admin/login");
  await editor.getByLabel("Email").fill(email);
  await editor.getByLabel("Contraseña", { exact: true }).fill("editor-e2e-password");
  await editor.getByRole("button", { name: "Ingresar" }).click();
  await expect(editor).toHaveURL(/\/admin$/);
  await editor.goto("/admin/usuarios");
  await expect(editor).toHaveURL(/\/admin\?denied=1$/);

  // Deactivating ends the editor's sessions.
  const row = page.getByRole("row").filter({ hasText: email });
  await row.getByRole("button", { name: `Editar a ${name}` }).click();
  await page.getByRole("dialog").getByRole("switch").click();
  await page.getByRole("dialog").getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Usuario guardado.")).toBeVisible();
  await editor.goto("/admin");
  await expect(editor).toHaveURL(/\/admin\/login/);
  await ctx.close();

  await row.getByRole("button", { name: `Eliminar a ${name}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Usuario eliminado.")).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: email })).toHaveCount(0);
});

test("account page rejects a wrong current password", async ({ page }) => {
  await page.goto("/admin/cuenta");
  await page.getByLabel("Contraseña actual").fill("no-es-la-contraseña");
  await page.getByLabel("Nueva contraseña", { exact: true }).fill("otra-password-larga");
  await page.getByLabel("Repetir nueva contraseña").fill("otra-password-larga");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText("La contraseña actual no es correcta.")).toBeVisible();
});
