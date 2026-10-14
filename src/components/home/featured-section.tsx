import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import type { ProjectCardData } from "@/lib/content/queries";
import type { PageContentData } from "@/lib/content/schemas";
import { FeaturedSlider } from "./featured-slider";

export function FeaturedSection({
  content,
  projects,
}: {
  content: PageContentData<"home.featured">;
  projects: ProjectCardData[];
}) {
  if (projects.length === 0) return null;
  return (
    <Section tone="dark" aria-labelledby="destacadas-title">
      <div className="container-site space-y-14 lg:space-y-20">
        <SectionHeader
          id="destacadas-title"
          eyebrow={content.eyebrow}
          title={content.title}
          highlight={content.highlight}
          subtitle={content.subtitle}
        />
        <FeaturedSlider projects={projects} />
      </div>
    </Section>
  );
}
