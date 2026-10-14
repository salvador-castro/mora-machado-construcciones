import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import type { PageContentData } from "@/lib/content/schemas";
import { ProcessSlider } from "./process-slider";

export function ProcessSection({
  content,
  steps,
}: {
  content: PageContentData<"home.process">;
  steps: { id: string; title: string; description: string }[];
}) {
  if (steps.length === 0) return null;
  return (
    <Section id="proceso" tone="light" aria-labelledby="proceso-title">
      <div className="container-site space-y-14 lg:space-y-20">
        <SectionHeader
          id="proceso-title"
          eyebrow={content.eyebrow}
          title={content.title}
          highlight={content.highlight}
          subtitle={content.subtitle}
        />
        <ProcessSlider steps={steps} />
      </div>
    </Section>
  );
}
