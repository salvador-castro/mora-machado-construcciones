import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import type { PageContentData } from "@/lib/content/schemas";
import { ServiceGrid, type ServiceItem } from "./service-grid";

export function ServicesSection({
  content,
  services,
}: {
  content: PageContentData<"home.services">;
  services: ServiceItem[];
}) {
  return (
    <Section id="servicios" tone="dark" aria-labelledby="servicios-title">
      <div className="container-site space-y-14 lg:space-y-20">
        <SectionHeader
          id="servicios-title"
          eyebrow={content.eyebrow}
          title={content.title}
          highlight={content.highlight}
          subtitle={content.subtitle}
        />
        <ServiceGrid services={services} />
        <div className="flex justify-center">
          <ButtonLink href={content.cta.href} arrow>
            {content.cta.label}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
