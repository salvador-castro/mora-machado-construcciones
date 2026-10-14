import type { Metadata } from "next";
import { ListManager } from "@/components/admin/lists/list-manager";
import { PageTitle } from "@/components/admin/page-title";
import { loadList } from "@/lib/admin/list-loader";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Logos de clientes" };
export const instant = false;

export default async function Page() {
  await requireUser();
  const data = await loadList("clientLogo");

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        title="Logos de clientes"
        description="Se muestran debajo de la intro de inicio cuando hay al menos uno visible."
      />
      <ListManager
        key={data.version}
        entity="clientLogo"
        items={data.items}
        mediaPreviews={data.previews}
        defaults={data.defaults}
      />
    </div>
  );
}
