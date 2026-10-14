import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { SectionList } from "@/components/admin/sections/section-list";
import { PAGE_KEYS } from "@/lib/admin/sections";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Páginas" };
export const instant = false;

export default async function PagesPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Páginas"
        description="Nosotros, Contacto, encabezados de listados, textos de detalle y legales."
      />
      <SectionList keys={PAGE_KEYS} />
    </div>
  );
}
