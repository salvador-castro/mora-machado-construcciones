import { expect, test } from "@playwright/test";

/**
 * A phone-style HEVC video uploaded from the media library is converted to an
 * H.264 MP4 with a poster, can be added to a project gallery, and plays from
 * the public page (served with byte ranges, which Safari requires).
 */
test("upload a video and show it in a project gallery", async ({ page }) => {
  test.setTimeout(90_000);
  const alt = `Video E2E ${Date.now()}`;

  await page.goto("/admin/medios", { waitUntil: "networkidle" });
  const altInput = page.getByRole("textbox", { name: /Texto alternativo para video-hevc/ });
  // Retried: a file chosen before hydration never reaches the uploader's onChange.
  await expect(async () => {
    await page
      .getByLabel("Elegir fotos o videos para subir")
      .setInputFiles("tests/fixtures/video-hevc.mp4");
    await expect(altInput).toBeVisible({ timeout: 1000 });
  }).toPass();
  await altInput.fill(alt);
  await page.getByRole("button", { name: "Subir 1 archivo" }).click();
  await expect(page.getByText("Archivo subido.")).toBeVisible({ timeout: 60_000 });

  const title = `Obra con video E2E ${Date.now()}`;
  await page.goto("/admin/obras/nueva");
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  const slug = await page.getByLabel("Dirección (slug)").inputValue();
  await page.getByLabel("Ubicación").fill("Zárate");
  await page.getByLabel("Resumen").fill("Obra de prueba con un video en la galería.");
  await page.getByRole("switch", { name: "Publicada" }).click();
  await page.getByRole("button", { name: "Agregar fotos o videos" }).click();
  const picker = page.getByRole("dialog");
  await picker.getByRole("textbox", { name: "Buscar imágenes" }).fill(alt);
  await picker.getByRole("button", { name: new RegExp(alt) }).click();
  await picker.getByRole("button", { name: /^Agregar 1/ }).click();
  await page.getByRole("button", { name: "Crear obra" }).click();
  await expect(page.getByText("Obra creada.")).toBeVisible();

  await page.goto(`/obras/${slug}`);
  await page.getByRole("button", { name: `Ver video: ${alt}` }).click();
  const video = page.getByRole("dialog").locator("video");
  await expect(video).toBeVisible();
  const src = await video.getAttribute("src");
  expect(src).toMatch(/^\/uploads\/.+\.mp4$/);

  const full = await page.request.get(src!);
  expect(full.headers()["content-type"]).toBe("video/mp4");
  const part = await page.request.get(src!, { headers: { Range: "bytes=0-99" } });
  expect(part.status()).toBe(206);
  expect((await part.body()).length).toBe(100);

  // Clean up: the project, then the video (no longer in use).
  await page.goto("/admin/obras");
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL(/\/admin\/obras$/);
  await page.goto("/admin/medios");
  await page.getByRole("textbox", { name: "Buscar imágenes y videos" }).fill(alt);
  await page.getByRole("button", { name: new RegExp(alt) }).click();
  await expect(page.getByText("No se usa en ningún lugar.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Video eliminado.")).toBeVisible();
});
