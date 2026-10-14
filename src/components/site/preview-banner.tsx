import { draftMode } from "next/headers";

/** Visible only to admins with Draft Mode on (cache is bypassed for them). */
export async function PreviewBanner() {
  "use cache";
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  return (
    <div role="status" className="sticky top-0 z-50 bg-amber-300 text-ink">
      <form
        action="/admin/preview/exit"
        method="post"
        className="container-site flex min-h-10 flex-wrap items-center justify-center gap-x-4 py-2 text-sm"
      >
        <span className="font-medium">Vista previa: estás viendo contenido sin publicar.</span>
        <button type="submit" className="underline underline-offset-2">
          Salir de la vista previa
        </button>
      </form>
    </div>
  );
}
