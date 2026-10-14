import { expect, test as setup } from "@playwright/test";

setup("log in as the dev admin", async ({ page }) => {
  const email = process.env.DEV_ADMIN_EMAIL;
  const password = process.env.DEV_ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error("Set DEV_ADMIN_EMAIL / DEV_ADMIN_PASSWORD (pnpm create-admin)");

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.context().storageState({ path: "tests/e2e/.auth/admin.json" });
});
