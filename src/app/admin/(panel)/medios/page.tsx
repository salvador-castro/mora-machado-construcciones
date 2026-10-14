import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/media/media-library";
import { PageTitle } from "@/components/admin/page-title";
import { requireUser } from "@/lib/auth/session";
import { listMedia } from "@/server/actions/media";

export const metadata: Metadata = { title: "Medios" };
export const instant = false;

export default async function MediaPage() {
  await requireUser();
  const initial = await listMedia();
  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Medios"
        description="Biblioteca de imágenes del sitio. Las imágenes en uso no se pueden borrar."
      />
      <MediaLibrary initial={initial} />
    </div>
  );
}
