import { iconByName } from "@/components/ui/dynamic-icon";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading, Highlighted } from "@/components/ui/heading";
import { IconSquare } from "@/components/ui/icon-square";
import { MediaImage } from "@/components/ui/media-image";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import type { PageContentData } from "@/lib/content/schemas";
import type { MediaAsset } from "@/lib/media/types";

type ValueItem = { id: string; title: string; description: string; icon: string };

export function ValuesSection({
  content,
  items,
  image,
}: {
  content: PageContentData<"home.values">;
  items: ValueItem[];
  image: MediaAsset | null;
}) {
  return (
    <Section tone="light-2" aria-labelledby="valores-title">
      <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-12 lg:col-span-6">
          <Reveal className="space-y-5">
            {content.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
            <Heading id="valores-title">
              <Highlighted text={content.title} highlight={content.highlight} />
            </Heading>
            {content.subtitle && <p className="max-w-md text-ink/72">{content.subtitle}</p>}
          </Reveal>
          <ul className="space-y-8">
            {items.map((item, i) => (
              <Reveal
                as="li"
                key={item.id}
                delay={i * 0.08}
                className="flex gap-5 border-t border-ink/16 pt-6"
              >
                <IconSquare icon={iconByName(item.icon)} />
                <div>
                  <h3 className="text-h4">{item.title}</h3>
                  <p className="mt-2 text-ink/64">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
        {image && (
          <Reveal className="lg:col-span-5 lg:col-start-8">
            <div className="aspect-4/5 overflow-hidden lg:sticky lg:top-24">
              <MediaImage
                media={image}
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="size-full object-cover"
              />
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
