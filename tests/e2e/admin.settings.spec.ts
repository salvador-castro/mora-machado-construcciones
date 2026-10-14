import { expect, test } from "@playwright/test";

// Without RESEND_API_KEY: dev prints the email to the console; a prod build reports the missing key.
test("settings can send a test email", async ({ page }) => {
  await page.goto("/admin/configuracion");
  await page.getByRole("button", { name: "Enviar email de prueba" }).click();
  await expect(
    page.getByText(
      /Email de prueba enviado a|el email se mostró en la consola|RESEND_API_KEY no está configurada/,
    ),
  ).toBeVisible();
});
