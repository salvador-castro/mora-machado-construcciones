import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import type { PageContentData } from "@/lib/content/schemas";
import { GalleryGrid, type GalleryItem } from "./gallery-grid";

export function GallerySection({
  content,
  items,
}: {
  content: PageContentData<"home.gallery">;
  items: GalleryItem[];
}) {
  if (items.length === 0) return null;
  return (
    <Section id="galeria" tone="light" aria-labelledby="galeria-title">
      <div className="container-site space-y-14 lg:space-y-20">
        <SectionHeader
          id="galeria-title"
          eyebrow={content.eyebrow}
          title={content.title}
          highlight={content.highlight}
          subtitle={content.subtitle}
        />
        <GalleryGrid items={items} />
      </div>
    </Section>
  );
}
