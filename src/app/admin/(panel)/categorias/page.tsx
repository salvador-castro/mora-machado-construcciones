import type { Metadata } from "next";
import { ListManager } from "@/components/admin/lists/list-manager";
import { PageTitle } from "@/components/admin/page-title";
import { loadList } from "@/lib/admin/list-loader";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Categorías de obra" };
export const instant = false;

export default async function Page() {
  await requireUser();
  const data = await loadList("projectCategory");

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Categorías de obra"
        description="Se usan para filtrar el listado de obras. No se pueden borrar si tienen obras."
      />
      <ListManager
        key={data.version}
        entity="projectCategory"
        items={data.items}
        mediaPreviews={data.previews}
        defaults={data.defaults}
      />
    </div>
  );
}
