import { CtaSection } from "@/components/home/cta-section";
import { ProcessSection } from "@/components/home/process-section";
import { ServiceGrid } from "@/components/home/service-grid";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import {
  getFeaturedTestimonial,
  getPageContent,
  getProcessSteps,
  getServices,
} from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const header = await getPageContent("services.index");
  return pageMetadata({ title: "Servicios", description: header?.subtitle, path: "/servicios" });
}

export default async function ServicesPage() {
  const [header, services, process, steps, cta, testimonial] = await Promise.all([
    getPageContent("services.index"),
    getServices(),
    getPageContent("home.process"),
    getProcessSteps(),
    getPageContent("home.cta"),
    getFeaturedTestimonial(),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Servicios" }]}
        eyebrow={header?.eyebrow}
        title={header?.title ?? "Servicios"}
        highlight={header?.highlight}
        subtitle={header?.subtitle}
      />
      <Section tone="dark" aria-label="Listado de servicios">
        <div className="container-site">
          <ServiceGrid services={services} headingLevel="h2" />
        </div>
      </Section>
      {process && <ProcessSection content={process} steps={steps} />}
      {cta && <CtaSection content={cta} testimonial={testimonial} />}
    </>
  );
}
