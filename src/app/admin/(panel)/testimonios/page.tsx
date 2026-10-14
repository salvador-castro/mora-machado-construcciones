import type { Metadata } from "next";
import { ListManager } from "@/components/admin/lists/list-manager";
import { PageTitle } from "@/components/admin/page-title";
import { loadList, projectOptions } from "@/lib/admin/list-loader";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Testimonios" };
export const instant = false;

export default async function Page() {
  await requireUser();
  const data = await loadList("testimonial");
  const projects = await projectOptions();

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Testimonios"
        description="El destacado aparece en el llamado a la acción de inicio; los vinculados a una obra, en su detalle."
      />
      <ListManager
        key={data.version}
        entity="testimonial"
        items={data.items}
        mediaPreviews={data.previews}
        defaults={data.defaults}
        options={{ projects }}
      />
    </div>
  );
}
