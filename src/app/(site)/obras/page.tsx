import { CtaSection } from "@/components/home/cta-section";
import { ProjectsExplorer } from "@/components/site/projects-explorer";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import {
  getFeaturedTestimonial,
  getPageContent,
  getProjectCategories,
  getProjects,
} from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const header = await getPageContent("projects.index");
  return pageMetadata({ title: "Obras", description: header?.subtitle, path: "/obras" });
}

export default async function ProjectsPage() {
  const [header, projects, categories, cta, testimonial] = await Promise.all([
    getPageContent("projects.index"),
    getProjects(),
    getProjectCategories(),
    getPageContent("home.cta"),
    getFeaturedTestimonial(),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Obras" }]}
        eyebrow={header?.eyebrow}
        title={header?.title ?? "Obras"}
        highlight={header?.highlight}
        subtitle={header?.subtitle}
      />
      <Section tone="light-2" aria-label="Listado de obras">
        <div className="container-site">
          {projects.length > 0 ? (
            <ProjectsExplorer projects={projects} categories={categories} />
          ) : (
            <p className="text-lead text-ink/64">Pronto vamos a sumar obras a esta sección.</p>
          )}
        </div>
      </Section>
      {cta && <CtaSection content={cta} testimonial={testimonial} />}
    </>
  );
}
