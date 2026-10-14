import { Eyebrow } from "@/components/ui/eyebrow";
import { Marquee } from "@/components/ui/marquee";
import { MediaImage } from "@/components/ui/media-image";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import type { PageContentData } from "@/lib/content/schemas";
import type { MediaAsset } from "@/lib/media/types";

type Highlight = { id: string; number: string; title: string; description: string };
type ClientLogo = { id: string; name: string; url: string | null; media: MediaAsset };

export function Intro({
  content,
  highlights,
  marquee,
  logos,
}: {
  content: PageContentData<"home.intro">;
  highlights: Highlight[];
  marquee: string[];
  logos: ClientLogo[];
}) {
  return (
    <Section tone="light" spacing={false} aria-label={content.eyebrow ?? undefined}>
      <div className="container-site space-y-16 section-y lg:space-y-24">
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {content.eyebrow && (
            <div className="lg:col-span-3 lg:pt-3">
              <Eyebrow>{content.eyebrow}</Eyebrow>
            </div>
          )}
          <p className="text-h3 lg:col-span-9">{content.text}</p>
        </Reveal>

        {highlights.length > 0 && (
          <ul className="grid gap-x-8 gap-y-10 md:grid-cols-3">
            {highlights.map((h, i) => (
              <Reveal as="li" key={h.id} delay={i * 0.08} className="border-t border-ink/16 pt-6">
                <p className="text-eyebrow text-ink/48">{h.number}</p>
                <h3 className="mt-6 text-h4">{h.title}</h3>
                <p className="mt-2 text-ink/64">{h.description}</p>
              </Reveal>
            ))}
          </ul>
        )}
      </div>

      {marquee.length > 0 && (
        <Marquee items={marquee} className="border-y border-ink/16 py-6 text-h4" />
      )}

      {content.showClientLogos && logos.length > 0 && (
        <div className="container-site py-12">
          <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {logos.map((logo) => {
              const img = (
                <MediaImage
                  media={logo.media}
                  alt={logo.name}
                  sizes="160px"
                  className="h-10 w-auto bg-transparent object-contain opacity-64 grayscale transition hover:opacity-100 hover:grayscale-0"
                />
              );
              return (
                <li key={logo.id}>
                  {logo.url ? (
                    <a href={logo.url} target="_blank" rel="noopener noreferrer">
                      {img}
                    </a>
                  ) : (
                    img
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Section>
  );
}
