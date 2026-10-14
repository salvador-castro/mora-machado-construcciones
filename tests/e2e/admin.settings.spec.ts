import { expect, test } from "@playwright/test";

// Dev runs without RESEND_API_KEY: the email is printed to the server console.
test("settings can send a test email", async ({ page }) => {
  await page.goto("/admin/configuracion");
  await page.getByRole("button", { name: "Enviar email de prueba" }).click();
  await expect(
    page.getByText(/Email de prueba enviado a|el email se mostró en la consola/),
  ).toBeVisible();
});
