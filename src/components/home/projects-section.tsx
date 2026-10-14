import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import type { ProjectCardData } from "@/lib/content/queries";
import type { PageContentData } from "@/lib/content/schemas";
import { ProjectCard } from "./project-card";

export function ProjectsSection({
  content,
  projects,
}: {
  content: PageContentData<"home.projects">;
  projects: ProjectCardData[];
}) {
  if (projects.length === 0) return null;
  return (
    <Section id="obras" tone="light-2" aria-labelledby="obras-title">
      <div className="container-site space-y-14 lg:space-y-20">
        <SectionHeader
          id="obras-title"
          eyebrow={content.eyebrow}
          title={content.title}
          highlight={content.highlight}
          subtitle={content.subtitle}
          actions={
            <ButtonLink href={content.cta.href} variant="secondary" arrow>
              {content.cta.label}
            </ButtonLink>
          }
        />
        <div className="grid gap-x-6 gap-y-16 md:grid-cols-2 lg:gap-x-8">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 0.08}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
