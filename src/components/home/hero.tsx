import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Highlighted } from "@/components/ui/heading";
import { MediaImage } from "@/components/ui/media-image";
import type { PageContentData } from "@/lib/content/schemas";
import type { MediaAsset } from "@/lib/media/types";

export function Hero({
  content,
  background,
}: {
  content: PageContentData<"home.hero">;
  background: MediaAsset | null;
}) {
  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[calc(100svh-3.5rem)] items-end overflow-hidden tone-dark"
    >
      {background && (
        <MediaImage
          media={background}
          alt=""
          sizes="100vw"
          priority
          className="absolute inset-0 -z-10 size-full object-cover"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/72 to-ink/40"
      />

      <div className="container-site pt-32 pb-16 lg:pb-24">
        {/* No scroll reveal here: the hero is the LCP and must paint without JS. */}
        <div className="max-w-5xl space-y-6">
          {content.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
          <h1 className="text-h1">
            <Highlighted text={content.title} highlight={content.highlight} />
          </h1>
          {content.subtitle && (
            <p className="max-w-2xl text-lead text-paper/80">{content.subtitle}</p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink href={content.primaryCta.href}>{content.primaryCta.label}</ButtonLink>
            <ButtonLink href={content.secondaryCta.href} variant="secondary">
              {content.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
