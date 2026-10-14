import type { Metadata } from "next";
import { ProjectForm } from "@/components/admin/entities/project-form";
import { projectFormOptions } from "@/lib/admin/project-options";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nueva obra" };
export const instant = false;

export default async function NewProjectPage() {
  await requireUser();
  const options = await projectFormOptions();
  return (
    <ProjectForm
      id={null}
      options={options}
      mediaPreviews={{}}
      initial={{
        title: "",
        slug: "",
        categoryId: options.categories[0]?.value ?? "",
        serviceId: null,
        location: "",
        year: "",
        area: "",
        excerpt: "",
        content: "",
        coverId: null,
        images: [],
        featured: false,
        published: false,
        seoTitle: "",
        seoDescription: "",
      }}
    />
  );
}
