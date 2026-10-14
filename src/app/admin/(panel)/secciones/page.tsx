import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { SectionList } from "@/components/admin/sections/section-list";
import { HOME_SECTION_KEYS } from "@/lib/admin/sections";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Secciones de inicio" };
export const instant = false;

export default async function SectionsPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Secciones de inicio"
        description="Textos e imágenes de cada bloque de la página principal, en el orden en que aparecen."
      />
      <SectionList keys={HOME_SECTION_KEYS} />
    </div>
  );
}
