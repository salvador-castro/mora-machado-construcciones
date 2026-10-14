import type { Metadata } from "next";
import { ListManager } from "@/components/admin/lists/list-manager";
import { PageTitle } from "@/components/admin/page-title";
import { loadList } from "@/lib/admin/list-loader";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Galería" };
export const instant = false;

export default async function Page() {
  await requireUser();
  const data = await loadList("galleryImage");

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        title="Galería"
        description="Imágenes de la sección «Galería» de inicio. Arrastrá para reordenar."
      />
      <ListManager
        key={data.version}
        entity="galleryImage"
        items={data.items}
        mediaPreviews={data.previews}
        defaults={data.defaults}
      />
    </div>
  );
}
