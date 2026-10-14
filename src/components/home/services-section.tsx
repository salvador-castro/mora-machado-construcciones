import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { iconByName } from "@/components/ui/dynamic-icon";
import { IconSquare } from "@/components/ui/icon-square";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import type { PageContentData } from "@/lib/content/schemas";

type ServiceItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  icon: string | null;
};

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
        <ul className="grid gap-px overflow-hidden border border-paper/16 bg-paper/16 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal
              as="li"
              key={s.id}
              delay={(i % 3) * 0.08}
              className="group relative flex flex-col bg-ink p-6 transition-colors hover:bg-[color-mix(in_srgb,var(--paper)_4%,var(--ink))] lg:p-8"
            >
              <div className="flex items-start justify-between">
                <IconSquare icon={iconByName(s.icon)} size="sm" />
                <span className="text-eyebrow text-paper/48">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-10 text-h4">
                <Link href={`/servicios/${s.slug}`} className="after:absolute after:inset-0">
                  {s.title}
                </Link>
              </h3>
              <p className="mt-3 flex-1 text-paper/64">{s.shortDescription}</p>
              <ArrowRight
                aria-hidden
                className="mt-8 size-5 text-paper/48 transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
              />
            </Reveal>
          ))}
        </ul>
        <div className="flex justify-center">
          <ButtonLink href={content.cta.href} arrow>
            {content.cta.label}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
