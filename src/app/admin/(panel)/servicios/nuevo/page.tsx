import type { Metadata } from "next";
import { ServiceForm } from "@/components/admin/entities/service-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nuevo servicio" };
export const instant = false;

export default async function NewServicePage() {
  const user = await requireUser();
  return (
    <ServiceForm
      id={null}
      canDelete={user.role === "ADMIN"}
      mediaPreviews={{}}
      initial={{
        title: "",
        slug: "",
        shortDescription: "",
        icon: "Layers",
        coverId: null,
        content: "",
        whyItems: [],
        steps: [],
        published: false,
        seoTitle: "",
        seoDescription: "",
      }}
    />
  );
}
